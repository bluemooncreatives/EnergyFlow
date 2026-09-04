import { notFound } from 'next/navigation'
import WebsiteBreadcrumb from "@/components/Application/Website/WebsiteBreadcrumb"
import OrderDetailActions from "@/components/Application/Website/OrderDetailActions"
import OrderShipmentTimeline from "@/components/Application/Website/OrderShipmentTimeline"
import Image from "next/image"
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from "next/link"
import { USER_ORDERS, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import { getOrderDetailsByOrderId, userCanViewOrder } from "@/lib/services/orderService"
import { getCurrentUser } from "@/lib/authentication"
import {
    ArrowLeft,
    BadgeCheck,
    ChevronRight,
    Clock,
    CreditCard,
    Headset,
    MapPin,
    Package,
    PackageCheck,
    ShoppingBag,
    Truck,
    Wallet,
    XCircle,
} from 'lucide-react'

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })

const formatDate = (d) => {
    if (!d) return null
    try {
        return new Date(d).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
    } catch {
        return null
    }
}

// ── Status presentation ────────────────────────────────────────────
const STATUS_META = {
    pending: { label: 'Order Placed', tone: 'amber', Icon: Clock, note: 'We have received your order and it is awaiting processing.' },
    processing: { label: 'Processing', tone: 'blue', Icon: Package, note: 'Your order is being prepared for shipment.' },
    shipped: { label: 'Shipped', tone: 'indigo', Icon: Truck, note: 'Your order is on the way to your address.' },
    delivered: { label: 'Delivered', tone: 'emerald', Icon: PackageCheck, note: 'Your order has been delivered. We hope you love it!' },
    cancelled: { label: 'Cancelled', tone: 'red', Icon: XCircle, note: 'This order has been cancelled.' },
    unverified: { label: 'Payment Unverified', tone: 'red', Icon: Clock, note: 'We could not verify the payment for this order yet.' },
}

const TONE = {
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
    indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
    red: 'border-red-500/30 bg-red-500/10 text-red-700',
}

const PAYMENT_STATUS_META = {
    unpaid: { label: 'Unpaid', tone: 'amber' },
    partial_paid: { label: 'Partially Paid', tone: 'blue' },
    fully_paid: { label: 'Fully Paid', tone: 'emerald' },
}

const PAYMENT_METHOD_LABEL = {
    cod: 'Cash on Delivery',
    full: 'Paid Online',
    partial: 'Partial Payment',
}

const OrderDetails = async ({ params }) => {
    const { orderid } = await params
    const orderData = await getOrderDetailsByOrderId(orderid)

    if (!orderData) notFound()

    // Authorization: only the order's owner (or an admin) may view its details.
    // Prevents one logged-in user from reading another customer's order PII by id.
    const currentUser = await getCurrentUser()
    if (!userCanViewOrder(orderData, currentUser)) notFound()

    const status = orderData?.status || 'pending'
    const statusMeta = STATUS_META[status] || STATUS_META.pending

    const products = orderData?.products ?? []
    const itemCount = products.reduce((sum, p) => sum + (p?.qty || 0), 0)

    const mrpTotal = products.reduce((sum, p) => sum + ((p?.mrp || p?.sellingPrice || 0) * (p?.qty || 0)), 0)
    const mrpSavings = Math.max(0, mrpTotal - (orderData?.subtotal || 0))
    const totalSavings = mrpSavings + (orderData?.couponDiscountAmount || 0)

    const paymentMethod = orderData?.paymentMethod || 'full'
    const paymentStatusMeta = PAYMENT_STATUS_META[orderData?.paymentStatus] || PAYMENT_STATUS_META.unpaid
    const placedOn = formatDate(orderData?.createdAt)

    const breadcrumb = {
        title: 'Order Details',
        links: [{ label: 'Order Details' }]
    }

    return (
        <div className='font-neue'>
            <WebsiteBreadcrumb props={breadcrumb} />

            <section className='website-gutter py-10 lg:py-14'>
                <div className='mx-auto w-full max-w-5xl'>

                    {/* ── Top bar ── */}
                    <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
                        <Link
                            href={USER_ORDERS}
                            className='inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground'
                        >
                            <ArrowLeft className='size-3.5' /> Back to orders
                        </Link>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${TONE[statusMeta.tone]}`}>
                            <statusMeta.Icon className='size-3.5' /> {statusMeta.label}
                        </span>
                    </div>

                    {/* ── Header card ── */}
                    <div className='overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm'>
                        <div className='flex flex-col gap-4 border-b border-border/60 bg-[var(--brand-warm-bg)]/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                            <div className='flex min-w-0 items-start gap-3'>
                                <div className='flex size-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--dark-red)] text-white'>
                                    <ShoppingBag className='size-5' />
                                </div>
                                <div className='min-w-0'>
                                    <h1 className='break-all text-base font-semibold uppercase tracking-[0.02em] text-foreground sm:text-lg'>
                                        Order #{orderData?.order_id}
                                    </h1>
                                    {placedOn && (
                                        <p className='mt-0.5 text-[13px] text-muted-foreground'>Placed on {placedOn}</p>
                                    )}
                                </div>
                            </div>
                            <p className='text-[13px] text-muted-foreground sm:text-right'>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'} · <span className='font-semibold text-foreground'>{fmt(orderData?.totalAmount)}</span>
                            </p>
                        </div>

                        {/* ── Status note / tracker ── */}
                        <OrderShipmentTimeline
                            shipment={orderData?.shipment}
                            fallbackLastUpdatedAt={orderData?.updatedAt || orderData?.createdAt}
                        />
                    </div>

                    {/* ── Main grid ── */}
                    <div className='mt-6 grid items-start gap-6 lg:grid-cols-[1fr_360px]'>

                        {/* LEFT: items + shipping */}
                        <div className='min-w-0 space-y-6'>

                            {/* Items */}
                            <div className='overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm'>
                                <div className='flex items-center justify-between border-b border-border/60 px-5 py-4'>
                                    <h2 className='flex items-center gap-2 text-base font-semibold uppercase tracking-[0.04em]'>
                                        <Package className='size-[18px] text-[var(--dark-red)]' /> Items
                                    </h2>
                                    <span className='rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground'>
                                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                {products.length === 0 ? (
                                    <p className='px-5 py-10 text-center text-sm text-muted-foreground'>
                                        No items found for this order.
                                    </p>
                                ) : (
                                    <div className='divide-y divide-border/50'>
                                        {products.map((product, idx) => {
                                            const name = product?.productId?.name || product?.name || 'Product'
                                            const slug = product?.productId?.slug
                                            const media = product?.variantId?.media?.[0]?.secure_url || placeholderImg.src
                                            const color = product?.variantId?.color
                                            const size = product?.variantId?.size
                                            const lineTotal = (product?.sellingPrice || 0) * (product?.qty || 0)
                                            const lineMrp = (product?.mrp || product?.sellingPrice || 0) * (product?.qty || 0)
                                            const nameNode = slug
                                                ? <Link href={WEBSITE_PRODUCT_DETAILS(slug)} className='transition-colors hover:text-[var(--dark-red)]'>{name}</Link>
                                                : name
                                            return (
                                                <div key={product?.variantId?._id || product?._id || idx} className='flex gap-4 p-5'>
                                                    <div className='relative h-[96px] w-[72px] flex-shrink-0 overflow-hidden rounded-md border border-border/40'>
                                                        <Image src={media} fill sizes='72px' alt={name} className='object-cover object-center' />
                                                    </div>
                                                    <div className='flex min-w-0 flex-1 flex-col'>
                                                        <h4 className='line-clamp-2 text-sm font-semibold leading-snug text-foreground'>
                                                            {nameNode}
                                                        </h4>
                                                        {(size || color) && (
                                                            <span className='mt-1.5 w-fit rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground'>
                                                                {[size, color].filter(Boolean).join(' / ')}
                                                            </span>
                                                        )}
                                                        <div className='mt-auto flex items-end justify-between pt-3'>
                                                            <span className='text-[13px] text-muted-foreground'>
                                                                {fmt(product?.sellingPrice)} × {product?.qty}
                                                            </span>
                                                            <div className='text-right'>
                                                                <p className='text-sm font-semibold text-foreground'>{fmt(lineTotal)}</p>
                                                                {lineMrp > lineTotal && (
                                                                    <p className='text-[11px] text-muted-foreground line-through'>{fmt(lineMrp)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Shipping address */}
                            <div className='overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm'>
                                <div className='flex items-center gap-2 border-b border-border/60 px-5 py-4'>
                                    <MapPin className='size-[18px] text-[var(--dark-red)]' />
                                    <h2 className='text-base font-semibold uppercase tracking-[0.04em]'>Shipping Address</h2>
                                </div>
                                <div className='px-5 py-5'>
                                    <p className='text-sm font-semibold text-foreground'>{orderData?.name}</p>
                                    <p className='mt-1 text-[13px] leading-relaxed text-muted-foreground'>
                                        {[orderData?.address, orderData?.landmark, orderData?.city, orderData?.state, orderData?.country, orderData?.pincode].filter(Boolean).join(', ')}
                                    </p>
                                    <div className='mt-3 flex flex-col gap-1 text-[13px] text-muted-foreground sm:flex-row sm:gap-6'>
                                        <span><span className='font-medium text-foreground'>Phone:</span> {orderData?.phone || '—'}</span>
                                        <span className='break-all'><span className='font-medium text-foreground'>Email:</span> {orderData?.email || '—'}</span>
                                    </div>
                                    {orderData?.ordernote && (
                                        <div className='mt-4 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5'>
                                            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'>Order Note</p>
                                            <p className='mt-1 text-[13px] text-foreground'>{orderData.ordernote}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: summary + payment + actions */}
                        <aside className='w-full'>
                            <div className='space-y-4 lg:sticky lg:top-6'>

                                {/* Payment summary */}
                                <div className='overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm'>
                                    <div className='border-b border-border/60 px-5 py-4'>
                                        <h2 className='text-base font-semibold uppercase tracking-[0.04em]'>Order Summary</h2>
                                    </div>

                                    <div className='space-y-2.5 px-5 py-4'>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>{mrpSavings > 0 ? 'Total MRP' : 'Subtotal'}</span>
                                            <span className='font-medium text-foreground'>{fmt(mrpSavings > 0 ? mrpTotal : orderData?.subtotal)}</span>
                                        </div>
                                        {mrpSavings > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Discount on MRP</span>
                                                <span className='font-medium text-emerald-600'>- {fmt(mrpSavings)}</span>
                                            </div>
                                        )}
                                        {orderData?.couponDiscountAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Coupon discount</span>
                                                <span className='font-medium text-emerald-600'>- {fmt(orderData.couponDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Shipping</span>
                                            <span className='font-medium text-emerald-600'>FREE</span>
                                        </div>

                                        <div className='my-1 border-t border-dashed border-border/70' />

                                        <div className='flex items-center justify-between'>
                                            <span className='text-base font-semibold text-foreground'>Total</span>
                                            <span className='text-xl font-semibold text-foreground'>{fmt(orderData?.totalAmount)}</span>
                                        </div>

                                        {totalSavings > 0 && (
                                            <div className='flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/[0.08] px-3 py-2 text-[13px] font-semibold text-emerald-700'>
                                                <BadgeCheck className='size-4' />
                                                You saved {fmt(totalSavings)} on this order
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment details */}
                                    <div className='space-y-2.5 border-t border-border/60 bg-muted/20 px-5 py-4'>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='flex items-center gap-1.5 text-muted-foreground'>
                                                {paymentMethod === 'cod' ? <Wallet className='size-4' /> : <CreditCard className='size-4' />}
                                                Payment
                                            </span>
                                            <span className='font-medium text-foreground'>{PAYMENT_METHOD_LABEL[paymentMethod] || 'Online'}</span>
                                        </div>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Status</span>
                                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${TONE[paymentStatusMeta.tone]}`}>
                                                {paymentStatusMeta.label}
                                            </span>
                                        </div>
                                        {orderData?.paidAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Amount paid</span>
                                                <span className='font-medium text-foreground'>{fmt(orderData.paidAmount)}</span>
                                            </div>
                                        )}
                                        {orderData?.remainingAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>{paymentMethod === 'cod' ? 'Pay on delivery' : 'Remaining'}</span>
                                                <span className='font-semibold text-[var(--dark-red)]'>{fmt(orderData.remainingAmount)}</span>
                                            </div>
                                        )}
                                        {orderData?.payment_id && (
                                            <div className='flex items-center justify-between gap-3 text-sm'>
                                                <span className='text-muted-foreground'>Transaction ID</span>
                                                <span className='truncate font-mono text-[11px] text-foreground' title={orderData.payment_id}>{orderData.payment_id}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className='space-y-2.5 border-t border-border/60 px-5 py-5'>
                                        <OrderDetailActions orderId={orderData?.order_id} />
                                        <Link
                                            href={WEBSITE_SHOP}
                                            className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[var(--dark-red)] text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--dark-red-2)]'
                                        >
                                            Continue Shopping <ChevronRight className='size-4' />
                                        </Link>
                                    </div>
                                </div>

                                {/* Help */}
                                <Link
                                    href='/contact'
                                    className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-sm transition-colors hover:border-[var(--dark-red)]/40'
                                >
                                    <span className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-cream)]/60 text-[var(--dark-red)]'>
                                        <Headset className='size-[18px]' />
                                    </span>
                                    <div className='flex-1'>
                                        <p className='text-[13px] font-semibold text-foreground'>Need help with this order?</p>
                                        <p className='text-[11px] text-muted-foreground'>Our support team is here for you.</p>
                                    </div>
                                    <ChevronRight className='size-4 text-muted-foreground' />
                                </Link>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default OrderDetails
