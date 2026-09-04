import { orderStatus } from "@/lib/utils"
import mongoose from "mongoose"

export const shipmentStatus = Object.freeze([
    "PENDING",
    "PROCESSING",
    "READY_TO_SHIP",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RTO",
    "CANCELLED",
])

export const defaultShipment = Object.freeze({
    courier: null,
    awb: null,
    shipmentStatus: "PENDING",
    trackingUrl: null,
    pickupLocation: null,
    length: null,
    breadth: null,
    height: null,
    weight: null,
    shippingMode: null,
    shipmentCreatedAt: null,
    deliveredAt: null,
    lastSyncedAt: null,
})

export const createDefaultShipment = () => ({ ...defaultShipment })

export const normalizeShipment = (shipment = {}) => {
    const cleanShipment = Object.fromEntries(
        Object.entries(shipment || {}).filter(([, value]) => value !== undefined)
    )

    return {
        ...defaultShipment,
        ...cleanShipment,
        shipmentStatus: cleanShipment.shipmentStatus || defaultShipment.shipmentStatus,
    }
}

export const withDefaultShipment = (order) => {
    if (!order) return order

    const plainOrder = typeof order.toObject === 'function' ? order.toObject() : order

    return {
        ...plainOrder,
        shipment: normalizeShipment(plainOrder.shipment),
    }
}

export const withDefaultShipmentMany = (orders = []) => orders.map(withDefaultShipment)

const trimOrNull = (value) => {
    if (value === undefined || value === null) return null

    const trimmed = String(value).trim()
    return trimmed || null
}

const upperTrimOrNull = (value) => {
    const trimmed = trimOrNull(value)
    return trimmed ? trimmed.toUpperCase() : null
}

const numberOrNull = (value) => {
    if (value === undefined || value === null || value === '') return null
    return value
}

const shipmentSchema = new mongoose.Schema({
    courier: {
        type: String,
        trim: true,
        default: defaultShipment.courier,
        set: trimOrNull,
    },
    awb: {
        type: String,
        trim: true,
        uppercase: true,
        default: defaultShipment.awb,
        set: upperTrimOrNull,
    },
    shipmentStatus: {
        type: String,
        enum: shipmentStatus,
        required: true,
        default: defaultShipment.shipmentStatus,
        set: (value) => upperTrimOrNull(value) || defaultShipment.shipmentStatus,
    },
    trackingUrl: {
        type: String,
        trim: true,
        default: defaultShipment.trackingUrl,
        set: trimOrNull,
    },
    pickupLocation: {
        type: String,
        trim: true,
        default: defaultShipment.pickupLocation,
        set: trimOrNull,
    },
    length: {
        type: Number,
        min: 0,
        default: defaultShipment.length,
        set: numberOrNull,
    },
    breadth: {
        type: Number,
        min: 0,
        default: defaultShipment.breadth,
        set: numberOrNull,
    },
    height: {
        type: Number,
        min: 0,
        default: defaultShipment.height,
        set: numberOrNull,
    },
    weight: {
        type: Number,
        min: 0,
        default: defaultShipment.weight,
        set: numberOrNull,
    },
    shippingMode: {
        type: String,
        trim: true,
        default: defaultShipment.shippingMode,
        set: upperTrimOrNull,
    },
    shipmentCreatedAt: {
        type: Date,
        default: defaultShipment.shipmentCreatedAt,
    },
    deliveredAt: {
        type: Date,
        default: defaultShipment.deliveredAt,
    },
    lastSyncedAt: {
        type: Date,
        default: defaultShipment.lastSyncedAt,
    },
}, { _id: false })

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },

    city: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    // Street line: Flat / House no. / Building / Street / Area.
    // Optional at the schema level for backward compatibility with legacy orders
    // that only captured "landmark"; the checkout form requires it for new orders.
    address: {
        type: String,
        required: false
    },
    // Nearby landmark — optional helper for the delivery agent.
    landmark: {
        type: String,
        required: false
    },
    ordernote: {
        type: String,
        required: false
    },

    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            mrp: { type: Number, required: true },
            sellingPrice: { type: Number, required: true },
        }
    ],
    subtotal: {
        type: Number,
        required: true
    },
    couponDiscountAmount: {
        type: Number,
        required: true,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'full', 'partial'],
        required: true,
        default: 'full'
    },
    partialPaymentPercentage: {
        type: Number,
        enum: [30, 50, 100],
        default: 100
    },
    paidAmount: {
        type: Number,
        required: true,
        default: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'partial_paid', 'fully_paid'],
        default: 'unpaid'
    },
    status: {
        type: String,
        enum: orderStatus,
        default: 'pending'
    },
    shipment: {
        type: shipmentSchema,
        default: createDefaultShipment,
    },
    payment_id: {
        type: String,
        required: false
    },
    order_id: {
        type: String,
        required: true
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },
}, { timestamps: true })

orderSchema.index({ order_id: 1 })
orderSchema.index({ user: 1, deletedAt: 1 })
orderSchema.index({ 'shipment.awb': 1 }, { sparse: true })
orderSchema.index({ 'shipment.shipmentStatus': 1, deletedAt: 1 })

const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema, 'orders')
export default OrderModel
