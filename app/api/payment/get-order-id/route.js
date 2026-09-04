import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { zSchema } from "@/lib/zodSchema";
import Razorpay from "razorpay";

export async function POST(request) {
    try {
        await connectDB()

        // Only signed-in users can initiate a payment (account-required checkout).
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Please sign in to continue with payment.')
        }

        const payload = await request.json()
        const schema = zSchema.pick({
            amount: true
        })

        const validate = schema.safeParse(payload)

        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const normalizedAmount = Number(validate.data.amount)
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return response(false, 400, 'Invalid amount.')
        }

        const razInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        })


        const razOption = {
            amount: Math.round(normalizedAmount * 100),
            currency: 'INR'
        }

        const orderDetail = await razInstance.orders.create(razOption)
        const order_id = orderDetail.id

        return response(true, 200, 'Order id generated.', order_id)

    } catch (error) {
        return catchError(error)
    }
}