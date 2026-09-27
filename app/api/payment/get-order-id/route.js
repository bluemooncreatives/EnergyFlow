import { isAuthenticated } from "@/lib/authentication";
import { MAX_CART_QTY } from "@/lib/cartConstants";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { amountDueNow, checkoutFingerprint, quoteCheckout, razorpayClient } from "@/lib/services/orderPricing";
import { z } from "zod";

// Creates the Razorpay order for an online payment. The amount is priced here
// from the catalogue — never taken from the client — and this is the last
// point before money moves, so anything that would make the order wrong
// (unavailable item, changed price, dead coupon) stops the shopper here.
export async function POST(request) {
    try {
        await connectDB()

        // Only signed-in users can initiate a payment (account-required checkout).
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Please sign in to continue with payment.')
        }

        const payload = await request.json()
        const schema = z.object({
            products: z.array(z.object({
                variantId: z.string().length(24),
                productId: z.string().length(24).optional(),
                qty: z.number().int().min(1).max(MAX_CART_QTY),
                sellingPrice: z.number().nonnegative(),
            })).min(1, 'Your order is empty.'),
            couponCode: z.string().trim().toUpperCase().optional(),
            amount: z.number().nonnegative().optional(),
        })

        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const { products, couponCode, amount } = validate.data
        const quote = await quoteCheckout({ products, couponCode })

        if (quote.unavailable.length || !quote.lines.length) {
            return response(false, 409, 'Some items in your order are no longer available. Please review your order.', { code: 'ITEM_UNAVAILABLE', unavailable: quote.unavailable })
        }
        if (quote.couponError) {
            return response(false, 409, quote.couponError, { code: 'COUPON_INVALID' })
        }

        const payable = amountDueNow(quote.totalAmount, 'full')
        if (quote.priceChanged || (amount !== undefined && Math.abs(amount - payable) > 0.01)) {
            return response(false, 409, 'Prices have changed since you started checkout. Please review the updated total.', { code: 'PRICE_CHANGED' })
        }
        if (payable <= 0) {
            return response(false, 400, 'Invalid amount.')
        }

        const orderDetail = await razorpayClient().orders.create({
            amount: Math.round(payable * 100),
            currency: 'INR',
            // Binds this payment to exactly this basket and account; save-order
            // re-derives the fingerprint from what it is asked to save.
            notes: {
                user: String(auth.userId),
                checkout: checkoutFingerprint({
                    lines: quote.lines,
                    couponDiscountAmount: quote.couponDiscountAmount,
                    totalAmount: quote.totalAmount,
                    paidAmount: payable,
                }),
            },
        })

        return response(true, 200, 'Order id generated.', { order_id: orderDetail.id, amount: payable })

    } catch (error) {
        return catchError(error)
    }
}
