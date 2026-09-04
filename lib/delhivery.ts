import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

const DEFAULT_BASE_URL = "https://track.delhivery.com"
const CREATE_SHIPMENT_PATH = "/api/cmu/create.json"
const TRACK_SHIPMENT_PATH = "/api/v1/packages/json/"
const DEFAULT_RETRIES = 3
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])

export type ShipmentStatus =
    | "PENDING"
    | "PROCESSING"
    | "READY_TO_SHIP"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "RTO"
    | "CANCELLED"

export type ShipmentDimensions = {
    length: number
    breadth: number
    height: number
}

export type ShipmentProduct = {
    name: string
    quantity: number
}

export type CreateShipmentInput = {
    orderId: string
    customerName: string
    phone: string
    address: string
    pincode: string
    city?: string
    state?: string
    country?: string
    products: ShipmentProduct[]
    paymentType: "COD" | "PREPAID"
    codAmount: number
    totalAmount: number
    dimensions: ShipmentDimensions
    /** Delhivery expects shipment weight in kilograms. */
    weight: number
    pickupLocation?: string
    sellerName?: string
    sellerAddress?: string
    sellerGstTin?: string
    hsnCode?: string
}

export type CreateShipmentResult = {
    awb: string
    courier: "Delhivery"
    shipmentStatus: "READY_TO_SHIP"
    trackingUrl: string
}

export type TrackShipmentResult = {
    awb: string
    courier: "Delhivery"
    shipmentStatus: ShipmentStatus
    providerStatus: string
    statusDate: string | null
    instructions: string | null
}

type DelhiveryPackage = {
    waybill?: string | number
    status?: string
    remarks?: string[] | string
    refnum?: string
}

type DelhiveryCreateResponse = {
    success?: boolean
    packages?: DelhiveryPackage[]
    package?: DelhiveryPackage
    waybill?: string | number
    error?: string
    message?: string
    rmk?: string
}

type DelhiveryTrackingStatus = {
    Status?: string
    StatusType?: string
    StatusDateTime?: string
    StatusDate?: string
    Instructions?: string
}

type DelhiveryTrackingResponse = {
    ShipmentData?: Array<{
        Shipment?: {
            AWB?: string | number
            Status?: DelhiveryTrackingStatus
        }
    }>
    Error?: string
    error?: string
    message?: string
}

type DelhiveryErrorOptions = {
    statusCode?: number
    retryable?: boolean
    cause?: unknown
    kind?: "configuration" | "validation" | "provider"
}

export class DelhiveryError extends Error {
    readonly statusCode?: number
    readonly retryable: boolean
    readonly kind: "configuration" | "validation" | "provider"

    constructor(message: string, options: DelhiveryErrorOptions = {}) {
        super(message, { cause: options.cause })
        this.name = "DelhiveryError"
        this.statusCode = options.statusCode
        this.retryable = options.retryable ?? false
        this.kind = options.kind ?? "provider"
    }
}

const log = (
    level: "info" | "warn" | "error",
    event: string,
    context: Record<string, unknown> = {},
) => {
    // Never log the token, address, phone, customer name, or full provider payload.
    console[level](JSON.stringify({
        service: "delhivery",
        event,
        timestamp: new Date().toISOString(),
        ...context,
    }))
}

const cleanText = (value: unknown) => String(value ?? "")
    .replace(/[&#%;,\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const positiveNumber = (value: number, field: string) => {
    if (!Number.isFinite(value) || value <= 0) {
        throw new DelhiveryError(`${field} must be greater than 0.`, { kind: "validation" })
    }
    return value
}

const nonNegativeNumber = (value: number, field: string) => {
    if (!Number.isFinite(value) || value < 0) {
        throw new DelhiveryError(`${field} cannot be negative.`, { kind: "validation" })
    }
    return Number(value.toFixed(2))
}

const requiredText = (value: string | undefined, field: string) => {
    const cleaned = cleanText(value)
    if (!cleaned) throw new DelhiveryError(`${field} is required.`, { kind: "validation" })
    return cleaned
}

const getConfig = () => {
    const token = process.env.DELHIVERY_API_TOKEN?.trim()
    // Keep the old name as a compatibility fallback for existing deployments.
    const baseUrl = (
        process.env.DELHIVERY_BASE_URL
        || process.env.DELHIVERY_API_BASE_URL
        || DEFAULT_BASE_URL
    ).trim().replace(/\/+$/, "")

    if (!token) {
        throw new DelhiveryError("DELHIVERY_API_TOKEN is not configured.", { kind: "configuration" })
    }

    return { token, baseUrl }
}

const createClient = (): AxiosInstance => {
    const { token, baseUrl } = getConfig()
    return axios.create({
        baseURL: baseUrl,
        timeout: 15_000,
        headers: {
            Authorization: `Token ${token}`,
            Accept: "application/json",
        },
    })
}

const retryDelay = (attempt: number, retryAfter?: string) => {
    const retryAfterSeconds = Number(retryAfter)
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        return Math.min(retryAfterSeconds * 1000, 30_000)
    }

    const exponentialDelay = 400 * (2 ** (attempt - 1))
    return exponentialDelay + Math.floor(Math.random() * 200)
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const requestWithRetry = async <T>(
    operation: "create_shipment" | "track_shipment",
    config: AxiosRequestConfig,
    retries = DEFAULT_RETRIES,
): Promise<AxiosResponse<T>> => {
    const client = createClient()
    const startedAt = Date.now()

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
        try {
            const result = await client.request<T>(config)
            log("info", `${operation}_succeeded`, {
                attempt,
                durationMs: Date.now() - startedAt,
                statusCode: result.status,
            })
            return result
        } catch (error) {
            const axiosError = error as AxiosError
            const statusCode = axiosError.response?.status
            const retryable = !axiosError.response || Boolean(statusCode && RETRYABLE_STATUS_CODES.has(statusCode))
            const hasAttemptsRemaining = attempt <= retries

            log(retryable && hasAttemptsRemaining ? "warn" : "error", `${operation}_failed`, {
                attempt,
                durationMs: Date.now() - startedAt,
                statusCode: statusCode ?? null,
                errorCode: axiosError.code ?? null,
                retrying: retryable && hasAttemptsRemaining,
            })

            if (!retryable || !hasAttemptsRemaining) {
                throw new DelhiveryError(
                    statusCode
                        ? `Delhivery request failed with status ${statusCode}.`
                        : "Delhivery is currently unreachable.",
                    { statusCode, retryable, cause: error },
                )
            }

            await sleep(retryDelay(attempt, axiosError.response?.headers?.["retry-after"]))
        }
    }

    throw new DelhiveryError("Delhivery request failed.", { retryable: true })
}

const extractAwb = (data: DelhiveryCreateResponse) => {
    const value = data?.packages?.[0]?.waybill ?? data?.package?.waybill ?? data?.waybill
    return value === undefined || value === null ? "" : String(value).trim()
}

const extractCreateError = (data: DelhiveryCreateResponse) => {
    const remarks = data?.packages?.[0]?.remarks ?? data?.package?.remarks
    const packageMessage = Array.isArray(remarks) ? remarks.join(" ") : remarks

    return cleanText(
        data?.error
        || data?.message
        || data?.rmk
        || packageMessage
        || data?.packages?.[0]?.status
        || data?.package?.status
        || "Delhivery did not return an AWB.",
    )
}

export const mapDelhiveryStatus = (status: DelhiveryTrackingStatus = {}): ShipmentStatus => {
    const value = `${status.Status ?? ""} ${status.StatusType ?? ""}`.toLowerCase()

    if (/cancel/.test(value)) return "CANCELLED"
    if (/rto|return|dto/.test(value)) return "RTO"
    if (/delivered/.test(value)) return "DELIVERED"
    if (/out for delivery|dispatched to consignee|ofd/.test(value)) return "OUT_FOR_DELIVERY"
    if (/picked|pickup complete/.test(value)) return "PICKED_UP"
    if (/transit|dispatched|destination|bag|hub|facility/.test(value)) return "IN_TRANSIT"
    if (/manifest/.test(value)) return "PROCESSING"
    if (/not picked|ready/.test(value)) return "READY_TO_SHIP"
    return "PROCESSING"
}

export const createShipment = async (input: CreateShipmentInput): Promise<CreateShipmentResult> => {
    const pickupLocation = requiredText(
        input.pickupLocation || process.env.DELHIVERY_PICKUP_LOCATION,
        "Delhivery pickup location",
    )
    const orderId = requiredText(input.orderId, "Order ID")
    const products = input.products
        .filter((product) => cleanText(product.name))
        .map((product) => ({
            name: cleanText(product.name),
            quantity: Math.max(1, Math.trunc(Number(product.quantity) || 1)),
        }))

    if (!products.length) {
        throw new DelhiveryError("Product information is required.", { kind: "validation" })
    }

    const quantity = products.reduce((total, product) => total + product.quantity, 0)
    const payload = {
        shipments: [{
            name: requiredText(input.customerName, "Customer name"),
            phone: requiredText(input.phone, "Phone"),
            add: requiredText(input.address, "Address"),
            pin: requiredText(input.pincode, "Pincode"),
            city: cleanText(input.city),
            state: cleanText(input.state),
            country: cleanText(input.country || "India"),
            order: orderId,
            products_desc: products.map((product) => `${product.name} x ${product.quantity}`).join(" | "),
            quantity,
            payment_mode: input.paymentType === "COD" ? "COD" : "Pre-paid",
            cod_amount: input.paymentType === "COD" ? nonNegativeNumber(input.codAmount, "COD amount") : 0,
            total_amount: nonNegativeNumber(input.totalAmount, "Total amount"),
            shipment_length: positiveNumber(input.dimensions.length, "Length"),
            shipment_width: positiveNumber(input.dimensions.breadth, "Breadth"),
            shipment_height: positiveNumber(input.dimensions.height, "Height"),
            weight: positiveNumber(input.weight, "Weight"),
            seller_name: cleanText(input.sellerName || "Energyflow"),
            seller_add: cleanText(input.sellerAddress),
            ...(input.sellerGstTin ? { seller_gst_tin: cleanText(input.sellerGstTin) } : {}),
            ...(input.hsnCode ? { hsn_code: cleanText(input.hsnCode) } : {}),
        }],
        pickup_location: { name: pickupLocation },
    }

    log("info", "create_shipment_started", {
        orderId,
        paymentType: input.paymentType,
        productCount: products.length,
    })

    const body = new URLSearchParams({ format: "json", data: JSON.stringify(payload) })
    const response = await requestWithRetry<DelhiveryCreateResponse>("create_shipment", {
        method: "POST",
        url: CREATE_SHIPMENT_PATH,
        data: body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    const awb = extractAwb(response.data)
    if (!awb) {
        const message = extractCreateError(response.data)
        log("error", "create_shipment_invalid_response", { orderId, message })
        throw new DelhiveryError(message, { statusCode: response.status })
    }

    return {
        awb,
        courier: "Delhivery",
        shipmentStatus: "READY_TO_SHIP",
        trackingUrl: `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
    }
}

export const trackShipment = async (awbValue: string): Promise<TrackShipmentResult> => {
    const awb = requiredText(awbValue, "AWB")
    log("info", "track_shipment_started", { awb })

    const response = await requestWithRetry<DelhiveryTrackingResponse>("track_shipment", {
        method: "GET",
        url: TRACK_SHIPMENT_PATH,
        params: { waybill: awb },
    })

    const shipment = response.data?.ShipmentData?.[0]?.Shipment
    if (!shipment?.Status) {
        const message = cleanText(
            response.data?.Error
            || response.data?.error
            || response.data?.message
            || "No Delhivery tracking information was found for this AWB.",
        )
        log("error", "track_shipment_invalid_response", { awb, message })
        throw new DelhiveryError(message, { statusCode: response.status })
    }

    const providerStatus = cleanText(shipment.Status.Status || shipment.Status.StatusType || "Unknown")
    return {
        awb: String(shipment.AWB || awb),
        courier: "Delhivery",
        shipmentStatus: mapDelhiveryStatus(shipment.Status),
        providerStatus,
        statusDate: shipment.Status.StatusDateTime || shipment.Status.StatusDate || null,
        instructions: shipment.Status.Instructions || null,
    }
}
