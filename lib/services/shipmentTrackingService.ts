import { connectDB } from "@/lib/databaseConnection"
import { trackShipment, TrackShipmentResult } from "@/lib/delhivery"
import OrderModel from "@/models/Order.model"

const Order = OrderModel as any

export type SyncOrderShipmentInput = {
    orderId: string
    awb: string
    deliveredAt?: Date | string | null
}

const validDate = (value: string | null) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Fetch one AWB from Delhivery and atomically persist its normalized status.
 * The AWB is included in the update filter so a stale worker cannot update an
 * order whose shipment was replaced while the provider request was in flight.
 */
export const syncOrderShipment = async (
    input: SyncOrderShipmentInput,
): Promise<TrackShipmentResult> => {
    await connectDB()

    const tracking = await trackShipment(input.awb)
    const now = new Date()
    const updates: Record<string, unknown> = {
        "shipment.courier": tracking.courier,
        "shipment.awb": tracking.awb,
        "shipment.shipmentStatus": tracking.shipmentStatus,
        "shipment.lastSyncedAt": now,
    }

    if (tracking.shipmentStatus === "DELIVERED" && !input.deliveredAt) {
        updates["shipment.deliveredAt"] = validDate(tracking.statusDate) || now
    }

    const result = await Order.updateOne(
        { _id: input.orderId, "shipment.awb": input.awb },
        { $set: updates },
        { runValidators: true },
    )

    if (!result.matchedCount) {
        throw new Error("Order shipment changed before tracking could be saved.")
    }

    return tracking
}

