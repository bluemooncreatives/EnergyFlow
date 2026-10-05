"use client"

import axios, { AxiosError } from "axios"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, Ban, CheckCircle2, Copy, PackageCheck, RefreshCw, Truck, XCircle } from "lucide-react"
import ButtonLoading from "@/components/Application/ButtonLoading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isPickedUpStatus, SHIPMENT_CANCELLATION_REASONS } from "@/lib/shipmentCancellation"
import { showToast } from "@/lib/showToast"
import { cn } from "@/lib/utils"

type ShipmentStatus =
    | "PENDING"
    | "PROCESSING"
    | "READY_TO_SHIP"
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
    trackingUrl?: string | null
    pickupLocation?: string | null
    length?: number | null
    breadth?: number | null
    height?: number | null
    weight?: number | null
    shippingMode?: string | null
    cancelledAt?: string | null
    cancellationReason?: string | null
}

type OrderData = {
    _id: string
    order_id: string
    name: string
    phone: string
    address?: string | null
    landmark?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    pincode?: string | null
    paymentMethod?: string | null
    paymentStatus?: string | null
    paidAmount?: number | null
    status?: string | null
    shipment?: Shipment | null
}

type ApiResponse<T> = {
    success: boolean
    message: string
    data: T
}

type ShipmentManagementProps = {
    orderData: OrderData
    onShipmentCreated: (order: OrderData) => void
}

// Palette status tones (design-system.css §23): waiting → sun, in progress →
// olive, on the move → pine, done → forest, problem → danger.
const statusTone: Record<string, string> = {
    PENDING: "ef-tone--sun",
    PROCESSING: "ef-tone--olive",
    READY_TO_SHIP: "ef-tone--olive",
    PICKED_UP: "ef-tone--pine",
    IN_TRANSIT: "ef-tone--pine",
    OUT_FOR_DELIVERY: "ef-tone--forest",
    DELIVERED: "ef-tone--forest",
    RTO: "ef-tone--danger",
    CANCELLED: "ef-tone--danger",
}

const labelize = (value?: string | null) => {
    if (!value) return "---"
    return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatAddress = (order: OrderData) => {
    return [order.address, order.landmark, order.city, order.state, order.pincode, order.country]
        .filter(Boolean)
        .join(", ")
}

const formatDate = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const formatInr = (value: number) => value.toLocaleString("en-IN", { style: "currency", currency: "INR" })

const dimensionDefaults = {
    length: "",
    breadth: "",
    height: "",
    weight: "",
}

const ShipmentManagement = ({ orderData, onShipmentCreated }: ShipmentManagementProps) => {
    const shipment = orderData.shipment || {}
    const hasAwb = Boolean(shipment.awb)
    const isCancelled = shipment.shipmentStatus === "CANCELLED"
    const isPickedUp = isPickedUpStatus(shipment.shipmentStatus)
    const orderCancelled = orderData.status === "cancelled"
    const canCancel = hasAwb && !isCancelled && !isPickedUp
    const paidAmount = Number(orderData.paidAmount || 0)
    const cancelledOn = formatDate(shipment.cancelledAt)
    const [dimensions, setDimensions] = useState(dimensionDefaults)
    const [creatingShipment, setCreatingShipment] = useState(false)
    const [syncingShipment, setSyncingShipment] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [cancellingShipment, setCancellingShipment] = useState(false)

    useEffect(() => {
        setDimensions({
            length: shipment.length ? String(shipment.length) : "",
            breadth: shipment.breadth ? String(shipment.breadth) : "",
            height: shipment.height ? String(shipment.height) : "",
            weight: shipment.weight ? String(shipment.weight) : "",
        })
    }, [shipment.length, shipment.breadth, shipment.height, shipment.weight])

    const address = useMemo(() => formatAddress(orderData), [orderData])

    const updateDimension = (field: keyof typeof dimensionDefaults, value: string) => {
        setDimensions((current) => ({
            ...current,
            [field]: value,
        }))
    }

    const copyAwb = async () => {
        if (!shipment.awb) return
        await navigator.clipboard.writeText(shipment.awb)
        showToast("success", "AWB copied.")
    }

    const createShipment = async () => {
        setCreatingShipment(true)
        try {
            const { data } = await axios.post<ApiResponse<OrderData>>("/api/orders/create-shipment", {
                orderId: orderData._id,
                length: dimensions.length,
                breadth: dimensions.breadth,
                height: dimensions.height,
                weight: dimensions.weight,
            })

            if (!data.success) {
                throw new Error(data.message)
            }

            onShipmentCreated(data.data)
            showToast("success", data.message)
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse<unknown>>
            showToast("error", axiosError.response?.data?.message || axiosError.message || "Unable to create shipment.")
        } finally {
            setCreatingShipment(false)
        }
    }

    const syncShipment = async () => {
        setSyncingShipment(true)
        try {
            const { data } = await axios.post<ApiResponse<OrderData>>("/api/orders/track-shipment", {
                orderId: orderData._id,
            })

            if (!data.success) throw new Error(data.message)

            onShipmentCreated(data.data)
            showToast("success", data.message)
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse<unknown>>
            showToast("error", axiosError.response?.data?.message || axiosError.message || "Unable to sync tracking.")
        } finally {
            setSyncingShipment(false)
        }
    }

    const cancelShipment = async () => {
        if (!cancelReason) {
            showToast("error", "Choose a cancellation reason.")
            return
        }

        setCancellingShipment(true)
        try {
            const { data } = await axios.post<ApiResponse<OrderData>>("/api/orders/cancel-shipment", {
                orderId: orderData._id,
                reason: cancelReason,
            })

            if (!data.success) throw new Error(data.message)

            onShipmentCreated(data.data)
            setCancelDialogOpen(false)
            setCancelReason("")
            showToast("success", data.message)
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse<Partial<OrderData>>>
            const failedOrder = axiosError.response?.data?.data
            // A refusal (e.g. already picked up) carries the freshly synced order — show it.
            if (failedOrder?._id) {
                onShipmentCreated(failedOrder as OrderData)
                setCancelDialogOpen(false)
            }
            showToast("error", axiosError.response?.data?.message || axiosError.message || "Unable to cancel shipment.")
        } finally {
            setCancellingShipment(false)
        }
    }

    return (
        <section className="rounded-lg border bg-background">
            <div className="flex flex-col gap-3 border-b p-4 sm:p-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                        <Truck className="size-4 text-[var(--dark-red)]" />
                        <h3 className="text-base font-semibold sm:text-lg">Shipment Management</h3>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{address || "Shipping address is incomplete."}</p>
                </div>
                <Badge
                    variant="outline"
                    className={cn("h-6 w-fit border px-2.5", statusTone[String(shipment.shipmentStatus || "PENDING")])}
                >
                    {labelize(shipment.shipmentStatus || "PENDING")}
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4 p-3 sm:p-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
                    <InfoItem label="Order ID" value={orderData.order_id} wide />
                    <InfoItem label="Customer Name" value={orderData.name} />
                    <InfoItem label="Customer Phone" value={orderData.phone} />
                    <InfoItem label="Payment Method" value={labelize(orderData.paymentMethod)} />
                    <InfoItem label="Payment Status" value={labelize(orderData.paymentStatus)} />
                    <InfoItem label="Customer Address" value={address || "---"} wide />
                </div>

                <Card className="rounded-lg border bg-muted/20 py-0 shadow-none hover:translate-y-0 hover:shadow-none">
                    <CardHeader className="border-b px-3 py-3 sm:px-4">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {hasAwb ? <CheckCircle2 className="size-4 text-success" /> : <PackageCheck className="size-4 text-muted-foreground" />}
                            Shipment Card
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-3 py-4 sm:px-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                            <ShipmentMeta label="AWB" value={shipment.awb || "---"} onCopy={shipment.awb ? copyAwb : undefined} wide />
                            <ShipmentMeta label="Courier" value={shipment.courier || "Delhivery"} />
                            <ShipmentMeta label="Shipment Status" value={labelize(shipment.shipmentStatus || "PENDING")} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <DimensionInput label="Length" value={dimensions.length} onChange={(value) => updateDimension("length", value)} disabled={hasAwb} />
                            <DimensionInput label="Breadth" value={dimensions.breadth} onChange={(value) => updateDimension("breadth", value)} disabled={hasAwb} />
                            <DimensionInput label="Height" value={dimensions.height} onChange={(value) => updateDimension("height", value)} disabled={hasAwb} />
                            <DimensionInput label="Weight" value={dimensions.weight} onChange={(value) => updateDimension("weight", value)} disabled={hasAwb} />
                        </div>

                        {isCancelled && (
                            <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                                <p className="flex items-center gap-2 font-semibold text-destructive">
                                    <XCircle className="size-4 shrink-0" />
                                    Shipment cancelled{cancelledOn ? ` on ${cancelledOn}` : ""}
                                </p>
                                {shipment.cancellationReason && (
                                    <p className="text-muted-foreground">Reason: {shipment.cancellationReason}</p>
                                )}
                                <p className="text-muted-foreground">Delhivery will not pick up this package.</p>
                                {paidAmount > 0 && (
                                    <p className="font-medium text-foreground">
                                        The customer paid {formatInr(paidAmount)} online — refund it from your payment dashboard.
                                    </p>
                                )}
                            </div>
                        )}

                        {hasAwb && isPickedUp && (
                            <div className="flex items-start gap-2 rounded-md border bg-background p-3 text-xs text-muted-foreground">
                                <Ban className="mt-0.5 size-3.5 shrink-0" />
                                <span>The courier has picked up this shipment, so it can no longer be cancelled.</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                                <span>Dimensions are sent to Delhivery once. Edit them before creating the shipment.</span>
                            </div>
                            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                                {canCancel && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        className="h-11 flex-1 cursor-pointer sm:h-9 sm:flex-none"
                                        onClick={() => setCancelDialogOpen(true)}
                                    >
                                        <XCircle className="size-3.5" />
                                        Cancel Shipment
                                    </Button>
                                )}
                                {hasAwb && !isCancelled && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11 flex-1 cursor-pointer sm:h-9 sm:flex-none"
                                        disabled={syncingShipment}
                                        onClick={syncShipment}
                                    >
                                        <RefreshCw className={cn("size-3.5", syncingShipment && "animate-spin")} />
                                        {syncingShipment ? "Syncing" : "Sync Tracking"}
                                    </Button>
                                )}
                                <ButtonLoading
                                    type="button"
                                    text={isCancelled ? "Shipment Cancelled" : hasAwb ? "Shipment Created" : orderCancelled ? "Order Cancelled" : "Create Shipment"}
                                    loading={creatingShipment}
                                    disabled={hasAwb || orderCancelled || creatingShipment}
                                    onClick={createShipment}
                                    variant="brand"
                                    className="h-11 flex-1 cursor-pointer sm:h-9 sm:flex-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={cancelDialogOpen}
                onOpenChange={(open) => {
                    if (!cancellingShipment) setCancelDialogOpen(open)
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="">
                        <DialogTitle className="">Cancel this shipment?</DialogTitle>
                        <DialogDescription className="">
                            Delhivery will cancel AWB <span className="font-mono font-medium text-foreground">{shipment.awb}</span> and
                            this order will be marked as cancelled. The customer will get a cancellation email. This can&apos;t be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <label className="block space-y-1.5">
                        <span className="block text-xs font-medium text-muted-foreground">Reason (shown to the customer)</span>
                        <Select value={cancelReason} onValueChange={setCancelReason}>
                            <SelectTrigger className="h-11 w-full sm:h-10" aria-label="Cancellation reason">
                                <SelectValue placeholder="Choose a reason" />
                            </SelectTrigger>
                            <SelectContent className="">
                                {SHIPMENT_CANCELLATION_REASONS.map((reason) => (
                                    <SelectItem key={reason} value={reason} className="">{reason}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        <span>Only possible before the courier picks up the package. The live status is checked with Delhivery first.</span>
                    </p>
                    {paidAmount > 0 && (
                        <p className="text-xs font-medium text-foreground">
                            The customer paid {formatInr(paidAmount)} online. Refunds are not automatic — issue it from your payment dashboard.
                        </p>
                    )}

                    <DialogFooter className="">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 cursor-pointer sm:h-9"
                            disabled={cancellingShipment}
                            onClick={() => setCancelDialogOpen(false)}
                        >
                            Keep Shipment
                        </Button>
                        <ButtonLoading
                            type="button"
                            text="Cancel Shipment"
                            loading={cancellingShipment}
                            disabled={!cancelReason || cancellingShipment}
                            onClick={cancelShipment}
                            variant="destructive"
                            className="h-11 cursor-pointer sm:h-9"
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    )
}

const InfoItem = ({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) => (
    <div className={cn("min-w-0 rounded-md border bg-muted/20 p-3", wide && "col-span-2 lg:col-span-3")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground [overflow-wrap:anywhere]">{value || "---"}</p>
    </div>
)

const ShipmentMeta = ({ label, value, onCopy, wide = false }: { label: string; value: string; onCopy?: () => void; wide?: boolean }) => (
    <div className={cn("min-w-0 rounded-md border bg-background p-3", wide && "col-span-2 sm:col-span-1")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
            <p className="min-w-0 break-all text-sm font-semibold">{value}</p>
            {onCopy && (
                <Button type="button" variant="ghost" size="icon-xs" className="shrink-0 max-sm:size-8" onClick={onCopy} aria-label="Copy AWB">
                    <Copy className="size-3.5" />
                </Button>
            )}
        </div>
    </div>
)

const DimensionInput = ({
    label,
    value,
    onChange,
    disabled,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}) => (
    <label className="block min-w-0 space-y-1.5">
        <span className="block text-xs font-medium text-muted-foreground">{label} ({label === "Weight" ? "kg" : "cm"})</span>
        <Input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={label === "Weight" ? "kg" : "cm"}
            className="h-11 bg-background text-base sm:h-10 sm:text-sm"
        />
    </label>
)

export default ShipmentManagement
