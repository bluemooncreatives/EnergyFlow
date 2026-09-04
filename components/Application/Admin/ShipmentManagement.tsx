"use client"

import axios, { AxiosError } from "axios"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Copy, PackageCheck, RefreshCw, Truck } from "lucide-react"
import ButtonLoading from "@/components/Application/ButtonLoading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

const statusTone: Record<string, string> = {
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PROCESSING: "border-blue-200 bg-blue-50 text-blue-700",
    READY_TO_SHIP: "border-cyan-200 bg-cyan-50 text-cyan-700",
    PICKED_UP: "border-indigo-200 bg-indigo-50 text-indigo-700",
    IN_TRANSIT: "border-violet-200 bg-violet-50 text-violet-700",
    OUT_FOR_DELIVERY: "border-orange-200 bg-orange-50 text-orange-700",
    DELIVERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    RTO: "border-rose-200 bg-rose-50 text-rose-700",
    CANCELLED: "border-red-200 bg-red-50 text-red-700",
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

const dimensionDefaults = {
    length: "",
    breadth: "",
    height: "",
    weight: "",
}

const ShipmentManagement = ({ orderData, onShipmentCreated }: ShipmentManagementProps) => {
    const shipment = orderData.shipment || {}
    const hasAwb = Boolean(shipment.awb)
    const [dimensions, setDimensions] = useState(dimensionDefaults)
    const [creatingShipment, setCreatingShipment] = useState(false)
    const [syncingShipment, setSyncingShipment] = useState(false)

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

    return (
        <section className="rounded-lg border bg-background">
            <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <Truck className="size-4 text-[var(--dark-red)]" />
                        <h3 className="text-lg font-semibold">Shipment Management</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{address || "Shipping address is incomplete."}</p>
                </div>
                <Badge
                    variant="outline"
                    className={cn("h-6 border px-2.5", statusTone[String(shipment.shipmentStatus || "PENDING")])}
                >
                    {labelize(shipment.shipmentStatus || "PENDING")}
                </Badge>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoItem label="Order ID" value={orderData.order_id} />
                    <InfoItem label="Customer Name" value={orderData.name} />
                    <InfoItem label="Customer Phone" value={orderData.phone} />
                    <InfoItem label="Payment Method" value={labelize(orderData.paymentMethod)} />
                    <InfoItem label="Payment Status" value={labelize(orderData.paymentStatus)} />
                    <InfoItem label="Customer Address" value={address || "---"} wide />
                </div>

                <Card className="rounded-lg border bg-muted/20 py-0 shadow-none hover:translate-y-0 hover:shadow-none">
                    <CardHeader className="border-b px-4 py-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            {hasAwb ? <CheckCircle2 className="size-4 text-emerald-600" /> : <PackageCheck className="size-4 text-muted-foreground" />}
                            Shipment Card
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 px-4 py-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <ShipmentMeta label="AWB" value={shipment.awb || "---"} onCopy={shipment.awb ? copyAwb : undefined} />
                            <ShipmentMeta label="Courier" value={shipment.courier || "Delhivery"} />
                            <ShipmentMeta label="Shipment Status" value={labelize(shipment.shipmentStatus || "PENDING")} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DimensionInput label="Length" value={dimensions.length} onChange={(value) => updateDimension("length", value)} disabled={hasAwb} />
                            <DimensionInput label="Breadth" value={dimensions.breadth} onChange={(value) => updateDimension("breadth", value)} disabled={hasAwb} />
                            <DimensionInput label="Height" value={dimensions.height} onChange={(value) => updateDimension("height", value)} disabled={hasAwb} />
                            <DimensionInput label="Weight" value={dimensions.weight} onChange={(value) => updateDimension("weight", value)} disabled={hasAwb} />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                                <span>Dimensions are sent to Delhivery once. Edit them before creating the shipment.</span>
                            </div>
                            <div className="flex w-full gap-2 sm:w-auto">
                                {hasAwb && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-9 flex-1 cursor-pointer sm:flex-none"
                                        disabled={syncingShipment}
                                        onClick={syncShipment}
                                    >
                                        <RefreshCw className={cn("size-3.5", syncingShipment && "animate-spin")} />
                                        {syncingShipment ? "Syncing" : "Sync Tracking"}
                                    </Button>
                                )}
                                <ButtonLoading
                                    type="button"
                                    text={hasAwb ? "Shipment Created" : "Create Shipment"}
                                    loading={creatingShipment}
                                    disabled={hasAwb || creatingShipment}
                                    onClick={createShipment}
                                    variant="brand"
                                    className="h-9 flex-1 cursor-pointer sm:flex-none"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

const InfoItem = ({ label, value, wide = false }: { label: string; value?: string | null; wide?: boolean }) => (
    <div className={cn("rounded-md border bg-muted/20 p-3", wide && "sm:col-span-2 lg:col-span-3")}>
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-foreground">{value || "---"}</p>
    </div>
)

const ShipmentMeta = ({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) => (
    <div className="rounded-md border bg-background p-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
            <p className="break-all text-sm font-semibold">{value}</p>
            {onCopy && (
                <Button type="button" variant="ghost" size="icon-xs" className="" onClick={onCopy} aria-label="Copy AWB">
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
    <label className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Input
            type="number"
            min="0"
            step="0.01"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            placeholder={label === "Weight" ? "kg" : "cm"}
            className="h-10 bg-background"
        />
    </label>
)

export default ShipmentManagement
