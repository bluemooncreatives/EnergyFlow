// Shared by the cancel-shipment API and the admin UI — keep it free of server-only imports.

/** Reasons an admin can pick. These are shown to the customer, so keep them customer-safe. */
export const SHIPMENT_CANCELLATION_REASONS = [
    "Cancelled at customer's request",
    "Item out of stock",
    "Payment issue",
    "Delivery address issue",
    "Duplicate order",
    "Other",
] as const

export type ShipmentCancellationReason = (typeof SHIPMENT_CANCELLATION_REASONS)[number]

/** Our shipment statuses that mean the courier already has the package. */
export const PICKED_UP_SHIPMENT_STATUSES = [
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RTO",
] as const

export const isPickedUpStatus = (status?: string | null) =>
    (PICKED_UP_SHIPMENT_STATUSES as readonly string[]).includes(String(status || "").toUpperCase())

/** The message shown to the admin when a shipment can no longer be cancelled. */
export const notCancellableMessage = (status?: string | null, providerStatus?: string | null) => {
    const value = String(status || "").toUpperCase()
    if (value === "DELIVERED") return "This order has already been delivered, so the shipment can't be cancelled."
    if (value === "RTO") return "This shipment is already returning to origin (RTO), so it can't be cancelled."
    return `The courier has already picked up this shipment${providerStatus ? ` (Delhivery status: ${providerStatus})` : ""}, so it can't be cancelled.`
}
