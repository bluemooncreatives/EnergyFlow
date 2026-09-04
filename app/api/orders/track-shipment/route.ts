import { NextRequest } from "next/server"
import { z } from "zod"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { DelhiveryError } from "@/lib/delhivery"
import { catchError, response } from "@/lib/helperFunction"
import { syncOrderShipment } from "@/lib/services/shipmentTrackingService"
import OrderModel, { withDefaultShipment } from "@/models/Order.model"

export const runtime = "nodejs"

const Order = OrderModel as any
const trackingSchema = z.object({ orderId: z.string().min(1, "Order id is required.") })

export async function POST(request: NextRequest) {
    try {
        const auth = await isAuthenticated("admin", request)
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.", {}, { status: 403 })
        }

        const parsed = trackingSchema.safeParse(await request.json())
        if (!parsed.success) {
            return response(false, 400, "Invalid tracking request.", {}, { status: 400 })
        }

        await connectDB()
        const order = await Order.findById(parsed.data.orderId)
        if (!order || order.deletedAt) {
            return response(false, 404, "Order not found.", {}, { status: 404 })
        }

        if (!order.shipment?.awb) {
            return response(false, 400, "Create the shipment before tracking it.", {}, { status: 400 })
        }

        const tracking = await syncOrderShipment({
            orderId: String(order._id),
            awb: order.shipment.awb,
            deliveredAt: order.shipment.deliveredAt,
        })

        const updatedOrder = await Order.findById(order._id)
            .populate("products.productId", "name slug")
            .populate({
                path: "products.variantId",
                populate: { path: "media" },
            })
            .lean()

        return response(
            true,
            200,
            `Shipment status updated: ${tracking.providerStatus}.`,
            withDefaultShipment(updatedOrder),
        )
    } catch (error) {
        if (error instanceof DelhiveryError) {
            const statusCode = error.kind === "configuration"
                ? 500
                : error.kind === "validation"
                    ? 400
                    : error.retryable ? 503 : 502
            return response(false, statusCode, error.message, {}, { status: statusCode })
        }
        return catchError(error)
    }
}
