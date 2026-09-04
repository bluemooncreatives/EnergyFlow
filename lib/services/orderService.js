import { connectDB } from '@/lib/databaseConnection'
import OrderModel, { withDefaultShipment } from '@/models/Order.model'
import '@/models/Product.model'
import '@/models/ProductVariant.model'
import '@/models/Media.model'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Attach any guest orders (user: null) that were placed with this email to the
 * now-verified account. Call this only once the account owner has proven control
 * of the email (email verification, OTP login, or Google sign-in) so we never
 * leak someone else's order onto an account that merely typed their address.
 *
 * Email is matched case-insensitively so a guest who checked out as "Jane@X.com"
 * still gets linked to an account registered as "jane@x.com".
 */
export const claimGuestOrders = async (userId, email) => {
    if (!userId || !email) return { matchedCount: 0, modifiedCount: 0 }

    await connectDB()

    const emailRegex = new RegExp(`^${escapeRegex(email.trim())}$`, 'i')

    const result = await OrderModel.updateMany(
        { email: emailRegex, user: null, deletedAt: null },
        { $set: { user: userId } }
    )

    return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
}

/**
 * Authorization gate for viewing a single order. An order may be viewed by an
 * admin, by the account it belongs to, or by an account whose verified email
 * matches the order's contact email (covers legacy orders placed before the
 * account existed). Used by the order-details page and the invoice download.
 */
export const userCanViewOrder = (order, user) => {
    if (!order || !user) return false
    if (user.role === 'admin') return true

    const sameUser = order.user && user.userId && String(order.user) === String(user.userId)
    const sameEmail = order.email && user.email &&
        String(order.email).trim().toLowerCase() === String(user.email).trim().toLowerCase()

    return Boolean(sameUser || sameEmail)
}

export const getOrderDetailsByOrderId = async (orderId) => {
    if (!orderId) return null

    await connectDB()

    const order = await OrderModel.findOne({ order_id: orderId, deletedAt: null })
        .populate('products.productId', 'name slug')
        .populate({
            path: 'products.variantId',
            populate: { path: 'media', select: 'secure_url alt' }
        })
        .lean()

    return order ? toPlainObject(withDefaultShipment(order)) : null
}
