import { NextRequest } from "next/server"
import { z } from "zod"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { createShipment, DelhiveryError } from "@/lib/delhivery"
import { catchError, response } from "@/lib/helperFunction"
import OrderModel, { withDefaultShipment } from "@/models/Order.model"

export const runtime = "nodejs"

const Order = OrderModel as any

const shipmentSchema = z.object({
    orderId: z.string().min(1, "Order id is required."),
    length: z.coerce.number().positive("Length must be greater than 0."),
    breadth: z.coerce.number().positive("Breadth must be greater than 0."),
    height: z.coerce.number().positive("Height must be greater than 0."),
    weight: z.coerce.number().positive("Weight must be greater than 0."),
})

const fullAddress = (order: any) => [
    order.address,
    order.landmark,
    order.city,
    order.state,
    order.country,
].filter(Boolean).join(" ")

export async function POST(request: NextRequest) {
    try {
        const auth = await isAuthenticated("admin", request)
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.", {}, { status: 403 })
        }

        const parsed = shipmentSchema.safeParse(await request.json())
        if (!parsed.success) {
            return response(
                false,
                400,
                "Invalid shipment details.",
                { error: parsed.error.flatten() },
                { status: 400 },
            )
        }

        await connectDB()

        const order = await Order.findById(parsed.data.orderId)
        if (!order || order.deletedAt) {
            return response(false, 404, "Order not found.", {}, { status: 404 })
        }

        if (order.shipment?.awb) {
            return response(
                false,
                409,
                "Shipment already exists for this order.",
                withDefaultShipment(order),
                { status: 409 },
            )
        }

        const address = fullAddress(order)
        if (!address || !order.name || !order.phone || !order.pincode) {
            return response(
                false,
                400,
                "Order is missing customer name, phone, pincode, or address.",
                {},
                { status: 400 },
            )
        }

        const remainingAmount = Number(order.remainingAmount || 0)
        const isCodShipment = order.paymentMethod === "cod" || remainingAmount > 0
        const codAmount = isCodShipment
            ? Number((remainingAmount > 0 ? remainingAmount : order.totalAmount || 0).toFixed(2))
            : 0
        const products = Array.isArray(order.products)
            ? order.products.map((item: any) => ({
                name: item.name || `Order ${order.order_id}`,
                quantity: Number(item.qty || 1),
            }))
            : []

        const createdShipment = await createShipment({
            orderId: order.order_id,
            customerName: order.name,
            phone: order.phone,
            address,
            pincode: order.pincode,
            city: order.city,
            state: order.state,
            country: order.country,
            products,
            paymentType: isCodShipment ? "COD" : "PREPAID",
            codAmount,
            totalAmount: Number(order.totalAmount || 0),
            dimensions: {
                length: parsed.data.length,
                breadth: parsed.data.breadth,
                height: parsed.data.height,
            },
            weight: parsed.data.weight,
            pickupLocation: process.env.DELHIVERY_PICKUP_LOCATION,
            sellerName: "Energyflow",
            sellerAddress: process.env.DELHIVERY_SELLER_ADD,
            sellerGstTin: process.env.DELHIVERY_SELLER_GST_TIN,
            hsnCode: process.env.DELHIVERY_HSN_CODE,
        })

        const now = new Date()
        order.shipment = {
            ...(order.shipment?.toObject?.() || order.shipment || {}),
            ...createdShipment,
            pickupLocation: process.env.DELHIVERY_PICKUP_LOCATION,
            length: parsed.data.length,
            breadth: parsed.data.breadth,
            height: parsed.data.height,
            weight: parsed.data.weight,
            shippingMode: isCodShipment ? "COD" : "PREPAID",
            shipmentCreatedAt: now,
            lastSyncedAt: now,
        }

        await order.save()

        const updatedOrder = await Order.findById(order._id)
            .populate("products.productId", "name slug")
            .populate({
                path: "products.variantId",
                populate: { path: "media" },
            })
            .lean()

        return response(true, 200, "Shipment created successfully.", withDefaultShipment(updatedOrder))
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
