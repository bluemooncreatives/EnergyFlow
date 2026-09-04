import { orderNotification } from "@/email/orderNotification";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { zSchema } from "@/lib/zodSchema";
import { isAuthenticated } from "@/lib/authentication";
import OrderModel from "@/models/Order.model";
import UserModel from "@/models/User.model";
import { MAX_CART_QTY } from "@/lib/cartConstants";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { z } from "zod";

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

        // Server is authoritative on money. Recompute the subtotal from the line items so
        // the client cannot tamper with it. Coupon is the ONLY discount and is bounded to
        // the subtotal, so the total can never go negative or below zero.
        const subtotal = roundToTwo(
            validatedData.products.reduce((sum, item) => sum + (item.sellingPrice * item.qty), 0)
        )
        const couponDiscountAmount = Math.min(roundToTwo(validatedData.couponDiscountAmount), subtotal)
        const totalAmount = roundToTwo(subtotal - couponDiscountAmount)

        // Reject if the client's submitted total disagrees with the server's computation.
        if (Math.abs(roundToTwo(validatedData.totalAmount) - totalAmount) > 0.01) {
            return response(false, 400, 'Order total mismatch. Please refresh your cart and try again.')
        }

        let partialPaymentPercentage = paymentMethod === 'partial'
            ? Number(validatedData.partialPaymentPercentage || 0)
            : 100

        if (paymentMethod === 'partial' && ![30, 50].includes(partialPaymentPercentage)) {
            return response(false, 400, 'Invalid partial payment percentage. Allowed values are 30 or 50.')
        }

        let expectedPaidAmount = 0
        let expectedRemainingAmount = totalAmount
        if (paymentMethod === 'full') {
            expectedPaidAmount = totalAmount
            expectedRemainingAmount = 0
        } else if (paymentMethod === 'partial') {
            expectedPaidAmount = Math.round((totalAmount * partialPaymentPercentage) / 100)
            expectedRemainingAmount = roundToTwo(totalAmount - expectedPaidAmount)
        }

        const paidAmount = roundToTwo(validatedData.paidAmount ?? expectedPaidAmount)
        const remainingAmount = roundToTwo(validatedData.remainingAmount ?? expectedRemainingAmount)

        if (Math.abs(paidAmount - expectedPaidAmount) > 0.01 || Math.abs(remainingAmount - expectedRemainingAmount) > 0.01) {
            return response(false, 400, 'Payment amount mismatch. Please review the selected payment mode and retry.')
        }

        // The order belongs to the authenticated account that placed it.
        const resolvedUserId = auth.userId

        let paymentVerification = paymentMethod === 'cod'
        let orderId = validatedData.order_id || null
        let paymentId = null

        if (paymentMethod !== 'cod') {
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

            paymentVerification = true
            orderId = validatedData.razorpay_order_id
            paymentId = validatedData.razorpay_payment_id
        }

        if (!orderId) {
            return response(false, 400, 'Order id is missing.')
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
            products: validatedData.products,
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

        // Order confirmation email. Best-effort only — the order is already saved,
        // so a mail failure must never fail the request. All money values here are
        // the server-computed ones (not the client's), so the email can never show
        // a tampered total.
        try {
            const mailData = {
                name: validatedData.name,
                order_id: orderId,
                orderDetailsUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${orderId}`,
                items: validatedData.products.map((p) => ({
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

            await sendMail('Your Energyflow order is confirmed', validatedData.email, orderNotification(mailData))

        } catch (error) {
            console.log(error)
        }

        const successMessage = paymentMethod === 'cod'
            ? 'Order placed successfully! Pay on delivery.'
            : paymentMethod === 'partial'
                ? `Order placed! Paid ${paidAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}. Remaining ${remainingAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} on delivery.`
                : 'Order placed successfully!'

        return response(true, 200, successMessage)

    } catch (error) {
        return catchError(error)
    }

}