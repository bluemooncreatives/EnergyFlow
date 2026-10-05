import { NextRequest } from "next/server"
import { z } from "zod"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { cancelShipment, DelhiveryError, isBeforePickup, trackShipment, TrackShipmentResult } from "@/lib/delhivery"
import { catchError, response } from "@/lib/helperFunction"
import { sendMail } from "@/lib/sendMail"
import { isPickedUpStatus, notCancellableMessage, SHIPMENT_CANCELLATION_REASONS } from "@/lib/shipmentCancellation"
import { orderStatusUpdate } from "@/email/orderStatusUpdate"
import OrderModel, { withDefaultShipment } from "@/models/Order.model"

export const runtime = "nodejs"

const Order = OrderModel as any

const cancelSchema = z.object({
    orderId: z.string().min(1, "Order id is required."),
    reason: z.enum(SHIPMENT_CANCELLATION_REASONS, { message: "Choose a cancellation reason." }),
})

const loadOrder = (id: unknown) => Order.findById(id)
    .populate("products.productId", "name slug")
    .populate({
        path: "products.variantId",
        populate: { path: "media" },
    })
    .lean()

const formatInr = (value: number) => value.toLocaleString("en-IN", { style: "currency", currency: "INR" })

export async function POST(request: NextRequest) {
    try {
        const auth = await isAuthenticated("admin", request)
        if (!auth.isAuth) {
            return response(false, 403, "Unauthorized.", {}, { status: 403 })
        }

        const parsed = cancelSchema.safeParse(await request.json())
        if (!parsed.success) {
            return response(false, 400, parsed.error.issues[0]?.message || "Invalid cancellation request.", {}, { status: 400 })
        }

        await connectDB()

        const order = await Order.findById(parsed.data.orderId)
        if (!order || order.deletedAt) {
            return response(false, 404, "Order not found.", {}, { status: 404 })
        }

        const awb = order.shipment?.awb
        if (!awb) {
            return response(
                false,
                400,
                "This order has no Delhivery shipment yet. Change the order status to Cancelled instead.",
                {},
                { status: 400 },
            )
        }

        if (order.shipment.shipmentStatus === "CANCELLED") {
            return response(false, 409, "This shipment is already cancelled.", withDefaultShipment(order), { status: 409 })
        }

        // Statuses only move forward, so a stored post-pickup status is final.
        if (isPickedUpStatus(order.shipment.shipmentStatus)) {
            return response(
                false,
                409,
                notCancellableMessage(order.shipment.shipmentStatus),
                withDefaultShipment(order),
                { status: 409 },
            )
        }

        // Our stored status may be stale — confirm with Delhivery that the
        // courier has not collected the package yet.
        let tracking: TrackShipmentResult
        try {
            tracking = await trackShipment(awb)
        } catch (error) {
            if (error instanceof DelhiveryError && error.kind !== "configuration") {
                return response(
                    false,
                    502,
                    `Couldn't confirm the pickup status with Delhivery, so nothing was cancelled. Try again in a few minutes. (${error.message})`,
                    {},
                    { status: 502 },
                )
            }
            throw error
        }

        const now = new Date()
        const alreadyCancelledOnDelhivery = tracking.shipmentStatus === "CANCELLED"

        if (!alreadyCancelledOnDelhivery && !isBeforePickup(tracking)) {
            // Save the fresh status so the admin screen shows why it was refused.
            await Order.updateOne(
                { _id: order._id, "shipment.awb": awb },
                { $set: { "shipment.shipmentStatus": tracking.shipmentStatus, "shipment.lastSyncedAt": now } },
                { runValidators: true },
            )
            return response(
                false,
                409,
                notCancellableMessage(tracking.shipmentStatus, tracking.providerStatus),
                withDefaultShipment(await loadOrder(order._id)),
                { status: 409 },
            )
        }

        if (!alreadyCancelledOnDelhivery) {
            try {
                await cancelShipment(awb)
            } catch (error) {
                if (error instanceof DelhiveryError && error.kind !== "configuration") {
                    return response(
                        false,
                        502,
                        `Delhivery did not cancel the shipment: ${error.message}`,
                        {},
                        { status: 502 },
                    )
                }
                throw error
            }
        }

        const previousStatus = order.status
        const updated = await Order.findOneAndUpdate(
            { _id: order._id, "shipment.awb": awb, "shipment.shipmentStatus": { $ne: "CANCELLED" } },
            {
                $set: {
                    status: "cancelled",
                    "shipment.shipmentStatus": "CANCELLED",
                    "shipment.cancelledAt": now,
                    "shipment.cancellationReason": parsed.data.reason,
                    "shipment.lastSyncedAt": now,
                },
            },
            { new: true, runValidators: true },
        )

        if (!updated) {
            return response(false, 409, "This shipment was already cancelled by someone else.", {}, { status: 409 })
        }

        // Best-effort: a mail failure must never undo a completed cancellation.
        if (previousStatus !== "cancelled" && updated.email) {
            try {
                await sendMail(
                    "Your Energyflow order was cancelled",
                    updated.email,
                    orderStatusUpdate({
                        name: updated.name,
                        order_id: updated.order_id,
                        status: "cancelled",
                        orderDetailsUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/order-details/${updated.order_id}`,
                    }),
                )
            } catch (mailError) {
                console.error("Failed to send order cancellation email:", (mailError as Error)?.message || mailError)
            }
        }

        const paidAmount = Number(updated.paidAmount || 0)
        const message = [
            alreadyCancelledOnDelhivery
                ? "This shipment was already cancelled on Delhivery. The order is now marked as cancelled."
                : "Shipment cancelled on Delhivery and the order is marked as cancelled.",
            paidAmount > 0 ? `The customer paid ${formatInr(paidAmount)} online - refund it from your payment dashboard.` : "",
        ].filter(Boolean).join(" ")

        return response(true, 200, message, withDefaultShipment(await loadOrder(updated._id)))
    } catch (error) {
        if (error instanceof DelhiveryError) {
            const statusCode = error.kind === "configuration" ? 500 : error.kind === "validation" ? 400 : 502
            return response(false, statusCode, error.message, {}, { status: statusCode })
        }
        return catchError(error)
    }
}
