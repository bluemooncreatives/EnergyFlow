import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import MediaModel from "@/models/Media.model";
import OrderModel, { withDefaultShipment } from "@/models/Order.model";
import ProductModel from "@/models/Product.model";
import ProductVariantModel from "@/models/ProductVariant.model";

export async function GET(request, { params }) {
    try {
        await connectDB()

        // This endpoint backs the admin order-details view and exposes full order
        // data, so it is restricted to admins.
        const auth = await isAuthenticated('admin', request)
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized')
        }

        const getParams = await params
        const orderid = getParams.orderid

        if (!orderid) {
            return response(false, 404, 'Order not found.')
        }

        const orderData = await OrderModel.findOne({ order_id: orderid }).populate('products.productId', 'name slug').populate({
            path: 'products.variantId',
            populate: { path: 'media' }
        }).lean()

        if (!orderData) {
            return response(false, 404, 'Order not found.')
        }

        return response(true, 200, 'Order found.', withDefaultShipment(orderData))

    } catch (error) {
        return catchError(error)
    }
}
