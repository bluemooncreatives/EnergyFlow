import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sendMail } from "@/lib/sendMail";
import { orderStatusUpdate } from "@/email/orderStatusUpdate";
import { orderStatus } from "@/lib/utils";
import OrderModel from "@/models/Order.model";

// Statuses worth emailing the customer about. Internal-only states (pending,
// unverified) are deliberately excluded so we never spam transactional noise.
const NOTIFY_STATUSES = new Set(['processing', 'shipped', 'delivered', 'cancelled'])

// Per-status subject lines.
const STATUS_SUBJECT = {
    processing: 'Your Energyflow order is being prepared',
    shipped: 'Your Energyflow order has shipped',
    delivered: 'Your Energyflow order has been delivered',
    cancelled: 'Your Energyflow order was cancelled',
}

export async function PUT(request) {
    try {

        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const { _id, status } = await request.json()

        if (!_id || !status) {
            return response(false, 400, 'Order id and status are required.')
        }

        // Guard against arbitrary/unknown status strings reaching the DB enum.
        if (!orderStatus.includes(status)) {
            return response(false, 400, 'Invalid order status.')
        }

        const orderData = await OrderModel.findById(_id)

        if (!orderData) {
            return response(false, 404, 'Order not found.')
        }

        // No-op guard: don't re-save or re-email if the status hasn't changed
        // (admins can click the same status; customers shouldn't get duplicates).
        const previousStatus = orderData.status
        if (previousStatus === status) {
            return response(true, 200, 'Order status is already set.', orderData)
        }

        orderData.status = status
        await orderData.save()

        // Notify the customer on meaningful transitions. Best-effort: a mail
        // failure must never fail the admin's status update.
        if (NOTIFY_STATUSES.has(status) && orderData.email) {
            try {
                await sendMail(
                    STATUS_SUBJECT[status] || 'Update on your Energyflow order',
                    orderData.email,
                    orderStatusUpdate({
                        name: orderData.name,
                        order_id: orderData.order_id,
                        status,
                        orderDetailsUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${orderData.order_id}`,
                    })
                )
            } catch (mailError) {
                console.error('Failed to send order status email:', mailError?.message || mailError)
            }
        }

        return response(true, 200, 'Order status updated successfully.', orderData)

    } catch (error) {
        return catchError(error)
    }
}