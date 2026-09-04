import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel, { withDefaultShipmentMany } from "@/models/Order.model";
import MediaModel from "@/models/Media.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";

export async function GET(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const userId = auth.userId

        // Orders are always tied to the account that placed them, so match strictly
        // by user. (The order's contact email is user-supplied and must NOT be used
        // for access, or one customer could surface their order on another's account.)
        const orderFilter = {
            deletedAt: null,
            user: userId
        }

        // get recent orders 
        const recentOrders = await OrderModel.find(orderFilter).populate('products.productId', 'name slug').populate({
            path: 'products.variantId',
            populate: { path: 'media' }
        }).limit(10).lean()

        // get total order count 
        const totalOrder = await OrderModel.countDocuments(orderFilter)

        return response(true, 200, 'Dashboard info.', { recentOrders: withDefaultShipmentMany(recentOrders), totalOrder })

    } catch (error) {
        return catchError(error)
    }
}
