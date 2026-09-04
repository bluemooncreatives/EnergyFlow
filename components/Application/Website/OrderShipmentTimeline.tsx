import { CheckCircle2, Clock, MapPin, Package, PackageCheck, Truck } from "lucide-react"

type ShipmentStatus =
    | "PENDING"
    | "PROCESSING"
    | "READY_TO_SHIP"
    | "MANIFESTED"
    | "SHIPPED"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "RTO"
    | "CANCELLED"

type Shipment = {
    courier?: string | null
    awb?: string | null
    shipmentStatus?: ShipmentStatus | string | null
    shipmentCreatedAt?: string | Date | null
    deliveredAt?: string | Date | null
    lastSyncedAt?: string | Date | null
}

type OrderShipmentTimelineProps = {
    shipment?: Shipment | null
    fallbackLastUpdatedAt?: string | Date | null
}

const TRACK_STEPS = [
    { key: "placed", label: "Placed", Icon: CheckCircle2 },
    { key: "processing", label: "Processing", Icon: Package },
    { key: "shipped", label: "Shipped", Icon: Truck },
    { key: "out_for_delivery", label: "Out for delivery", Icon: MapPin },
    { key: "delivered", label: "Delivered", Icon: PackageCheck },
] as const

const SHIPMENT_STATUS_STEP: Record<string, (typeof TRACK_STEPS)[number]["key"]> = {
    PENDING: "placed",
    PROCESSING: "processing",
    READY_TO_SHIP: "shipped",
    MANIFESTED: "shipped",
    SHIPPED: "shipped",
    PICKED_UP: "shipped",
    IN_TRANSIT: "shipped",
    OUT_FOR_DELIVERY: "out_for_delivery",
    DELIVERED: "delivered",
    RTO: "shipped",
    CANCELLED: "placed",
}

const STATUS_NOTE: Record<string, string> = {
    PENDING: "We have received your order and it is awaiting shipment processing.",
    PROCESSING: "Your order is being prepared for shipment.",
    READY_TO_SHIP: "Your shipment has been created and is waiting for pickup.",
    MANIFESTED: "Your shipment has been manifested with the courier.",
    SHIPPED: "Your order has been shipped.",
    PICKED_UP: "Your order has been picked up by the courier.",
    IN_TRANSIT: "Your order is on the way to your address.",
    OUT_FOR_DELIVERY: "Your order is out for delivery.",
    DELIVERED: "Your order has been delivered. We hope you love it!",
    RTO: "The shipment is returning to origin. Please contact support for help.",
    CANCELLED: "This shipment has been cancelled.",
}

const formatDate = (value?: string | Date | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

const labelize = (value?: string | null) => {
    if (!value) return "---"
    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getShipmentStatus = (status?: string | null) => String(status || "PENDING").toUpperCase()

const OrderShipmentTimeline = ({ shipment, fallbackLastUpdatedAt }: OrderShipmentTimelineProps) => {
    const shipmentStatus = getShipmentStatus(shipment?.shipmentStatus)
    const activeStep = SHIPMENT_STATUS_STEP[shipmentStatus] || "placed"
    const activeStepIndex = TRACK_STEPS.findIndex((step) => step.key === activeStep)
    const lastUpdated = formatDate(
        shipment?.lastSyncedAt ||
        shipment?.deliveredAt ||
        shipment?.shipmentCreatedAt ||
        fallbackLastUpdatedAt,
    )
    const note = STATUS_NOTE[shipmentStatus] || "Your shipment status will update here as soon as tracking is available."

    return (
        <section className="px-5 py-6 sm:px-6">
            <p className="mb-5 flex items-start gap-2 text-[13px] text-muted-foreground">
                <Clock className="mt-0.5 size-4 flex-shrink-0" />
                <span>{note}</span>
            </p>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ShipmentInfo label="Tracking Number (AWB)" value={shipment?.awb || "---"} mono />
                <ShipmentInfo label="Courier Name" value={shipment?.courier || "---"} />
                <ShipmentInfo label="Current Shipment Status" value={labelize(shipmentStatus)} />
                <ShipmentInfo label="Last Updated Time" value={lastUpdated || "---"} />
            </div>

            <ol className="space-y-4 sm:flex sm:items-start sm:space-y-0">
                {TRACK_STEPS.map((step, index) => {
                    const done = index <= activeStepIndex
                    const connectorDone = index < activeStepIndex
                    const isLast = index === TRACK_STEPS.length - 1

                    return (
                        <li key={step.key} className={`relative flex gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 ${isLast ? "sm:flex-none" : ""}`}>
                            <div className="relative z-10 flex flex-col items-center">
                                <span className={`flex size-9 items-center justify-center rounded-full border-2 transition-colors ${done ? "border-[var(--dark-red)] bg-[var(--dark-red)] text-white" : "border-border bg-background text-muted-foreground"}`}>
                                    <step.Icon className="size-4" />
                                </span>
                                {!isLast && (
                                    <span className={`mt-2 h-8 w-0.5 rounded-full sm:hidden ${connectorDone ? "bg-[var(--dark-red)]" : "bg-border"}`} />
                                )}
                            </div>
                            <span className={`pt-2 text-[10px] font-semibold uppercase tracking-[0.1em] sm:pt-0 ${done ? "text-foreground" : "text-muted-foreground"}`}>
                                {step.label}
                            </span>
                            {!isLast && (
                                <span className={`absolute left-[2.25rem] top-4 hidden h-0.5 w-[calc(100%-1.25rem)] rounded-full sm:block ${connectorDone ? "bg-[var(--dark-red)]" : "bg-border"}`} />
                            )}
                        </li>
                    )
                })}
            </ol>
        </section>
    )
}

const ShipmentInfo = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className={`mt-1 break-words text-sm font-semibold text-foreground ${mono ? "font-mono" : ""}`}>
            {value}
        </p>
    </div>
)

export default OrderShipmentTimeline
