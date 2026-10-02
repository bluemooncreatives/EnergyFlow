import { Clock, Package, PackageCheck, Truck, XCircle } from 'lucide-react'

// ── Status presentation ────────────────────────────────────────────
export const STATUS_META = {
    pending: { label: 'Order Placed', tone: 'sun', Icon: Clock, note: 'We have received your order and it is awaiting processing.' },
    processing: { label: 'Processing', tone: 'olive', Icon: Package, note: 'Your order is being prepared for shipment.' },
    shipped: { label: 'Shipped', tone: 'pine', Icon: Truck, note: 'Your order is on the way to your address.' },
    delivered: { label: 'Delivered', tone: 'forest', Icon: PackageCheck, note: 'Your order has been delivered. We hope you love it!' },
    cancelled: { label: 'Cancelled', tone: 'danger', Icon: XCircle, note: 'This order has been cancelled.' },
    unverified: { label: 'Payment Unverified', tone: 'danger', Icon: Clock, note: 'We could not verify the payment for this order yet.' },
}

export const statusMetaFor = (status) => STATUS_META[status] || STATUS_META.pending

// Palette status tones (design-system.css §23): waiting → sun, in progress →
// olive, on the move → pine, done → forest, problem → danger.
export const TONE = {
    sun: 'ef-tone--sun',
    olive: 'ef-tone--olive',
    pine: 'ef-tone--pine',
    forest: 'ef-tone--forest',
    danger: 'ef-tone--danger',
}

export const PAYMENT_STATUS_META = {
    unpaid: { label: 'Unpaid', tone: 'sun' },
    partial_paid: { label: 'Partially Paid', tone: 'olive' },
    fully_paid: { label: 'Fully Paid', tone: 'forest' },
}

export const PAYMENT_METHOD_LABEL = {
    cod: 'Cash on Delivery',
    full: 'Paid Online',
    partial: 'Partial Payment',
}
