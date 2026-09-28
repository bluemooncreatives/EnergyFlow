import { orderNotification } from "@/email/orderNotification";
import { orderAdminNotification } from "@/email/orderAdminNotification";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { zSchema } from "@/lib/zodSchema";
import { isAuthenticated } from "@/lib/authentication";
import OrderModel from "@/models/Order.model";
import { amountDueNow, checkoutFingerprint, priceOrderLines, quoteCheckout, razorpayClient } from "@/lib/services/orderPricing";
import UserModel from "@/models/User.model";
import { MAX_CART_QTY } from "@/lib/cartConstants";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { z } from "zod";

const STORE_PAYMENT_LABEL = { cod: 'COD', full: 'Paid', partial: 'Part-paid' }

// Where "new order" alerts go: ORDER_NOTIFICATION_EMAIL (comma-separated for
// several people), falling back to the store mailbox the site sends from.
const orderNotificationRecipients = () =>
    String(process.env.ORDER_NOTIFICATION_EMAIL || process.env.NODEMAILER_EMAIL || '')
        .split(',')
        .map((address) => address.trim())
        .filter((address) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()

        const productSchema = z.object({
            productId: z.string().length(24, 'Invalid product id format'),
            variantId: z.string().length(24, 'Invalid variant id format'),
            name: z.string().min(1),
            qty: z.number().int().min(1).max(MAX_CART_QTY, `Maximum ${MAX_CART_QTY} units per item.`),
            mrp: z.number().nonnegative(),
            sellingPrice: z.number().nonnegative()
        })

        const orderSchema = zSchema.pick({
            name: true, email: true, phone: true, address: true, country: true, state: true, city: true, pincode: true, landmark: true, ordernote: true
        }).extend({
            userId: z.string().optional(),
            razorpay_payment_id: z.string().optional(),
            razorpay_order_id: z.string().optional(),
            razorpay_signature: z.string().optional(),
            order_id: z.string().optional(),
            couponCode: z.string().trim().toUpperCase().optional(),
            subtotal: z.number().nonnegative(),
            couponDiscountAmount: z.number().nonnegative(),
            totalAmount: z.number().nonnegative(),
            products: z.array(productSchema).min(1, 'Products are required.'),
            paymentMethod: z.enum(['cod', 'full', 'partial']).optional(),
            partialPaymentPercentage: z.number().optional(),
            paidAmount: z.number().nonnegative().optional(),
            remainingAmount: z.number().nonnegative().optional()
        })


        const validate = orderSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', { error: validate.error })
        }

        const validatedData = validate.data

        // Checkout is account-required. An order can only ever be placed by a
        // signed-in user, so it is always tied to a real account (no guest orders).
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Please sign in to place your order.')
        }

        const roundToTwo = (value) => Number(Number(value || 0).toFixed(2))
        const hasRazorpayPayload = Boolean(
            validatedData.razorpay_payment_id && validatedData.razorpay_order_id && validatedData.razorpay_signature
        )

        // Backward compatible fallback: old frontend sent only Razorpay fields without paymentMethod.
        const paymentMethod = validatedData.paymentMethod || (hasRazorpayPayload ? 'full' : null)
        if (!paymentMethod) {
            return response(false, 400, 'Payment method is required.')
        }

        // The order belongs to the authenticated account that placed it.
        const resolvedUserId = auth.userId

        let lines
        let subtotal
        let couponDiscountAmount
        let totalAmount
        let paidAmount
        let remainingAmount
        let partialPaymentPercentage = 100
        let paymentVerification = false
        let orderId = null
        let paymentId = null

        if (paymentMethod === 'cod') {
            // No money has moved yet, so the order is priced here from the
            // catalogue and any drift sends the shopper back to review it.
            const quote = await quoteCheckout({ products: validatedData.products, couponCode: validatedData.couponCode })
            if (quote.unavailable.length || !quote.lines.length) {
                return response(false, 409, 'Some items in your order are no longer available. Please review your order and try again.', { code: 'ITEM_UNAVAILABLE', unavailable: quote.unavailable })
            }
            if (quote.couponError) {
                return response(false, 409, quote.couponError, { code: 'COUPON_INVALID' })
            }
            if (
                quote.priceChanged ||
                Math.abs(roundToTwo(validatedData.couponDiscountAmount) - quote.couponDiscountAmount) > 0.01 ||
                Math.abs(roundToTwo(validatedData.totalAmount) - quote.totalAmount) > 0.01
            ) {
                return response(false, 409, 'Prices have changed since you started checkout. Please review the updated total and try again.', { code: 'PRICE_CHANGED' })
            }

            lines = quote.lines
            subtotal = quote.subtotal
            couponDiscountAmount = quote.couponDiscountAmount
            totalAmount = quote.totalAmount
            paidAmount = 0
            remainingAmount = totalAmount
            paymentVerification = true
            orderId = validatedData.order_id || null
        } else {
            // Online payment: the shopper has ALREADY been charged by the time
            // this runs, so nothing here may reject a genuine payment over a
            // price that moved since. Instead the payment is proven to be for
            // exactly this basket: get-order-id priced it server-side and stamped
            // the Razorpay order with its fingerprint and the buyer's account.
            if (!hasRazorpayPayload) {
                return response(false, 400, 'Missing payment verification fields.')
            }

            const verification = validatePaymentVerification({
                order_id: validatedData.razorpay_order_id,
                payment_id: validatedData.razorpay_payment_id
            }, validatedData.razorpay_signature, process.env.RAZORPAY_KEY_SECRET)

            if (!verification) {
                return response(false, 400, 'Payment verification failed.')
            }

            orderId = validatedData.razorpay_order_id
            paymentId = validatedData.razorpay_payment_id

            subtotal = roundToTwo(validatedData.products.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0))
            couponDiscountAmount = Math.min(roundToTwo(validatedData.couponDiscountAmount), subtotal)
            totalAmount = roundToTwo(subtotal - couponDiscountAmount)
            if (Math.abs(roundToTwo(validatedData.totalAmount) - totalAmount) > 0.01) {
                return response(false, 400, 'Order total mismatch. Please contact support with your payment id.', { payment_id: paymentId })
            }

            if (paymentMethod === 'partial') {
                partialPaymentPercentage = Number(validatedData.partialPaymentPercentage || 0)
                if (![30, 50].includes(partialPaymentPercentage)) {
                    return response(false, 400, 'Invalid partial payment percentage. Allowed values are 30 or 50.')
                }
            }
            paidAmount = amountDueNow(totalAmount, paymentMethod, partialPaymentPercentage)
            remainingAmount = roundToTwo(totalAmount - paidAmount)

            try {
                const razorpay = razorpayClient()
                const [payment, razorpayOrder] = await Promise.all([
                    razorpay.payments.fetch(paymentId),
                    razorpay.orders.fetch(orderId),
                ])
                const expectedFingerprint = checkoutFingerprint({
                    lines: validatedData.products,
                    couponDiscountAmount,
                    totalAmount,
                    paidAmount,
                })
                const paidOk = payment.order_id === orderId &&
                    payment.currency === 'INR' &&
                    ['authorized', 'captured'].includes(payment.status) &&
                    payment.amount === razorpayOrder.amount &&
                    razorpayOrder.amount === Math.round(paidAmount * 100) &&
                    razorpayOrder.notes?.user === String(resolvedUserId) &&
                    razorpayOrder.notes?.checkout === expectedFingerprint
                if (!paidOk) {
                    return response(false, 400, 'This payment does not match your order. Please contact support with your payment id.', { payment_id: paymentId })
                }
                paymentVerification = true
            } catch (error) {
                // Razorpay unreachable: the signature is valid, so the shopper
                // has paid. Keep the order, flagged for an admin to reconcile.
                console.log('Razorpay lookup failed, saving order as unverified:', error)
                paymentVerification = false
            }

            // Prices are the ones that were paid; names/MRP come from the
            // catalogue where the item still exists.
            const { lines: catalogue } = await priceOrderLines(validatedData.products)
            const catalogueById = new Map(catalogue.map((line) => [line.variantId, line]))
            lines = validatedData.products.map((item) => {
                const known = catalogueById.get(item.variantId)
                return {
                    productId: item.productId,
                    variantId: item.variantId,
                    name: known?.name || item.name,
                    qty: item.qty,
                    mrp: known?.mrp ?? item.mrp,
                    sellingPrice: item.sellingPrice,
                }
            })
        }

        if (!orderId) {
            return response(false, 400, 'Order id is missing.')
        }

        // Idempotent: a retried request (double submit, flaky network, handler
        // firing twice) must not create a second order for the same payment.
        const existingOrder = await OrderModel.findOne({ order_id: orderId }).select('user').lean()
        if (existingOrder) {
            if (String(existingOrder.user) !== String(resolvedUserId)) {
                return response(false, 409, 'This order id is already in use.')
            }
            return response(true, 200, 'Order already placed.', { order_id: orderId, duplicate: true })
        }

        const paymentStatus = paymentMethod === 'cod'
            ? 'unpaid'
            : paymentMethod === 'partial'
                ? 'partial_paid'
                : 'fully_paid'

        await OrderModel.create({
            user: resolvedUserId,
            name: validatedData.name,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            country: validatedData.country,
            state: validatedData.state,
            city: validatedData.city,
            pincode: validatedData.pincode,
            landmark: validatedData.landmark,
            ordernote: validatedData.ordernote,
            products: lines.map(({ productId, variantId, name, qty, mrp, sellingPrice }) => ({
                productId, variantId, name, qty, mrp, sellingPrice
            })),
            couponDiscountAmount,
            totalAmount,
            subtotal,
            paymentMethod,
            partialPaymentPercentage,
            paidAmount,
            remainingAmount,
            paymentStatus,
            payment_id: paymentId,
            order_id: orderId,
            status: paymentVerification ? 'pending' : 'unverified'
        })

        // Optionally persist the shipping address back onto the user's profile so the
        // next checkout is pre-filled. Best-effort only — the order is already saved,
        // so a profile-update failure must never fail the order. Account identity
        // fields (name/email) are deliberately NOT touched here.
        if (payload.saveAddress === true) {
            try {
                await UserModel.findByIdAndUpdate(resolvedUserId, {
                    phone: validatedData.phone,
                    address: validatedData.address,
                    landmark: validatedData.landmark || '',
                    city: validatedData.city,
                    state: validatedData.state,
                    pincode: validatedData.pincode,
                    country: validatedData.country,
                })
            } catch (error) {
                console.log('Failed to save address to profile:', error)
            }
        }

        // Emails: the customer's confirmation and the store's "new order" alert.
        // Best-effort only — the order is already saved, so a mail failure must
        // never fail the request. All money values here are the server-computed
        // ones (not the client's), so neither email can show a tampered total.
        // Sent in parallel so one slow/failed send never holds up the other.
        // (A retried request returned early above as a duplicate, so the store
        // is alerted exactly once per order.)
        try {
            const mailData = {
                name: validatedData.name,
                order_id: orderId,
                orderDetailsUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${orderId}`,
                items: lines.map((p) => ({
                    name: p.name,
                    qty: p.qty,
                    sellingPrice: p.sellingPrice,
                })),
                subtotal,
                couponDiscountAmount,
                totalAmount,
                paymentMethod,
                paidAmount,
                remainingAmount,
                phone: validatedData.phone,
                address: {
                    address: validatedData.address,
                    landmark: validatedData.landmark,
                    city: validatedData.city,
                    state: validatedData.state,
                    pincode: validatedData.pincode,
                    country: validatedData.country,
                },
            }

            const storeInbox = orderNotificationRecipients()
            const needsVerification = !paymentVerification
            const alertSubject = [
                needsVerification ? '⚠ VERIFY PAYMENT —' : '🛒 New order',
                orderId,
                '·',
                totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }),
                '·',
                STORE_PAYMENT_LABEL[paymentMethod] || paymentMethod,
                '·',
                validatedData.name,
            ].join(' ')

            const [customerMail, storeMail] = await Promise.allSettled([
                sendMail('Your Energyflow order is confirmed', validatedData.email, orderNotification(mailData)),
                storeInbox.length
                    ? sendMail(
                        alertSubject,
                        storeInbox,
                        orderAdminNotification({
                            ...mailData,
                            email: validatedData.email,
                            couponCode: couponDiscountAmount > 0 ? validatedData.couponCode : '',
                            payment_id: paymentId,
                            ordernote: validatedData.ordernote,
                            needsVerification,
                            placedAt: new Date(),
                        }),
                        // "Reply" in the store inbox goes straight to the customer.
                        { replyTo: validatedData.email }
                    )
                    : Promise.resolve({ success: false, message: 'No order notification recipient configured.' }),
            ])

            // sendMail never throws; it reports. Log failures so a broken SMTP
            // setup shows up in the server logs instead of silently losing alerts.
            for (const [who, result] of [['customer', customerMail], ['store', storeMail]]) {
                const outcome = result.status === 'fulfilled' ? result.value : { success: false, message: result.reason?.message }
                if (!outcome?.success) {
                    console.error(`Order ${orderId}: ${who} email not sent —`, outcome?.message)
                }
            }
        } catch (error) {
            console.log(error)
        }

        const successMessage = paymentMethod === 'cod'
            ? 'Order placed successfully! Pay on delivery.'
            : paymentMethod === 'partial'
                ? `Order placed! Paid ${paidAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}. Remaining ${remainingAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} on delivery.`
                : 'Order placed successfully!'

        return response(true, 200, successMessage, { order_id: orderId })

    } catch (error) {
        return catchError(error)
    }

}