import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { statusGroupOf } from "@/lib/account";
import OrderModel, { withDefaultShipmentMany } from "@/models/Order.model";
import UserModel from "@/models/User.model";
import MediaModel from "@/models/Media.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";
import mongoose from "mongoose";

const RECENT_ORDER_LIMIT = 5
const NON_SPENDING_STATUSES = ['cancelled', 'unverified']

export async function GET(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        // A token carrying a malformed id would make every query below throw a
        // CastError (500). Treat it as an unknown account instead.
        if (!mongoose.Types.ObjectId.isValid(auth.userId)) {
            return response(false, 404, 'User not found.')
        }
        const userId = new mongoose.Types.ObjectId(auth.userId)

        // Orders are always tied to the account that placed them, so match strictly
        // by user. (The order's contact email is user-supplied and must NOT be used
        // for access, or one customer could surface their order on another's account.)
        const orderFilter = {
            deletedAt: null,
            user: userId
        }

        const [user, recentOrders, statusTotals] = await Promise.all([
            UserModel.findOne({ _id: userId, deletedAt: null })
                .select('name email phone address landmark city state pincode country avatar isEmailVerified createdAt +password')
                .lean(),
            OrderModel.find(orderFilter)
                .sort({ createdAt: -1 })
                .limit(RECENT_ORDER_LIMIT)
                .select('order_id products totalAmount status paymentStatus paymentMethod createdAt shipment')
                .populate('products.productId', 'name slug')
                .populate({
                    path: 'products.variantId',
                    select: 'media',
                    populate: { path: 'media' }
                })
                .lean(),
            OrderModel.aggregate([
                { $match: orderFilter },
                { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
            ]),
        ])

        if (!user) {
            return response(false, 404, 'User not found.')
        }

        const stats = { totalOrders: 0, activeOrders: 0, deliveredOrders: 0, cancelledOrders: 0, totalSpent: 0 }
        for (const { _id: status, count, amount } of statusTotals) {
            stats.totalOrders += count
            const group = statusGroupOf(status)
            if (group === 'active') stats.activeOrders += count
            else if (group === 'delivered') stats.deliveredOrders += count
            else stats.cancelledOrders += count
            if (!NON_SPENDING_STATUSES.includes(status)) stats.totalSpent += amount
        }

        const hasPassword = Boolean(user.password)
        delete user.password

        return response(true, 200, 'Dashboard info.', {
            user: { ...user, hasPassword },
            stats,
            recentOrders: withDefaultShipmentMany(recentOrders),
            // Kept for older clients that read the flat count.
            totalOrder: stats.totalOrders,
        })

    } catch (error) {
        return catchError(error)
    }
}
