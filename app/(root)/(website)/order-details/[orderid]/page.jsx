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
    CreditCard,
    Headset,
    MapPin,
    Package,
    ShoppingBag,
    Wallet,
    PackageX,
} from 'lucide-react'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { STATUS_META, TONE, PAYMENT_STATUS_META, PAYMENT_METHOD_LABEL } from '@/components/Application/Website/account/orderStatus'

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

const OrderDetails = async ({ params }) => {
    const { orderid } = await params
    // Independent lookups — the order query does not feed the session read — so
    // they run together rather than one after the other.
    const [orderData, currentUser] = await Promise.all([
        getOrderDetailsByOrderId(orderid),
        getCurrentUser(),
    ])

    if (!orderData) notFound()

    // Authorization: only the order's owner (or an admin) may view its details.
    // Prevents one logged-in user from reading another customer's order PII by id.
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

            <section className='ef-container py-10 lg:py-14'>
                <div className='mx-auto w-full max-w-5xl'>

                    {/* ── Top bar ── */}
                    <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
                        <Link
                            href={USER_ORDERS}
                            className='inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-muted transition-colors hover:text-foreground'
                        >
                            <ArrowLeft className='size-3.5' /> Back to orders
                        </Link>
                        <span className={`inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border px-3 py-1 text-[11px] font-semibold uppercase tracking-normal ${TONE[statusMeta.tone]}`}>
                            <statusMeta.Icon className='size-3.5' /> {statusMeta.label}
                        </span>
                    </div>

                    {/* ── Header card ── */}
                    <div className='overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]'>
                        <div className='flex flex-col gap-4 border-b border-border/60 bg-surface-well/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6'>
                            <div className='flex min-w-0 items-start gap-3'>
                                <div className='flex size-11 flex-shrink-0 items-center justify-center rounded-full bg-brand text-on-brand'>
                                    <ShoppingBag className='size-5' />
                                </div>
                                <div className='min-w-0'>
                                    <h1 className='break-all text-lg font-medium text-ink-strong sm:text-xl'>
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
                    <div className='mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]'>

                        {/* LEFT: items + shipping */}
                        <div className='min-w-0 space-y-6'>

                            {/* Items */}
                            <div className='overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]'>
                                <div className='flex items-center justify-between border-b border-border/60 px-5 py-4'>
                                    <h2 className='flex items-center gap-2 text-[1.0625rem] font-medium text-ink-strong'>
                                        <Package className='size-[18px] text-brand' /> Items
                                    </h2>
                                    <span className='rounded-[var(--radius-control)] bg-surface-well px-2.5 py-1 text-[0.75rem] font-medium text-ink-body'>
                                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                {products.length === 0 ? (
                                    <EmptyState
                                        icon={PackageX}
                                        title='No items found'
                                        description='This order has no line items on record. If this looks wrong, contact us with your order ID.'
                                    />
                                ) : (
                                    <div className='divide-y divide-border/50'>
                                        {products.map((product, idx) => {
                                            const name = product?.productId?.name || product?.name || 'Product'
                                            const slug = product?.productId?.slug
                                            const media = product?.variantId?.media?.[0]?.secure_url || placeholderImg.src
                                            const size = product?.variantId?.size
                                            const lineTotal = (product?.sellingPrice || 0) * (product?.qty || 0)
                                            const lineMrp = (product?.mrp || product?.sellingPrice || 0) * (product?.qty || 0)
                                            const nameNode = slug
                                                ? <Link href={WEBSITE_PRODUCT_DETAILS(product.productId)} className='transition-colors hover:text-brand'>{name}</Link>
                                                : name
                                            return (
                                                <div key={product?.variantId?._id || product?._id || idx} className='flex gap-4 p-5'>
                                                    <div className='relative h-[96px] w-[72px] flex-shrink-0 overflow-hidden rounded-well'>
                                                        <Image src={media} fill sizes='72px' alt={name} className='object-cover object-center' />
                                                    </div>
                                                    <div className='flex min-w-0 flex-1 flex-col'>
                                                        <h4 className='line-clamp-2 font-neue text-sm font-semibold leading-snug text-foreground'>
                                                            {nameNode}
                                                        </h4>
                                                        {size && (
                                                            <span className='mt-1.5 w-fit rounded-[var(--radius-control)] bg-surface-well px-2 py-0.5 text-[0.75rem] text-ink-body'>
                                                                {size}
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
                            <div className='overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]'>
                                <div className='flex items-center gap-2 border-b border-border/60 px-5 py-4'>
                                    <MapPin className='size-[18px] text-brand' />
                                    <h2 className='text-[1.0625rem] font-medium text-ink-strong'>Shipping Address</h2>
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
                                            <p className='text-[0.75rem] font-medium text-ink-muted'>Order Note</p>
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
                                <div className='overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)]'>
                                    <div className='border-b border-border/60 px-5 py-4'>
                                        <h2 className='text-[1.0625rem] font-medium text-ink-strong'>Order Summary</h2>
                                    </div>

                                    <div className='space-y-2.5 px-5 py-4'>
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>{mrpSavings > 0 ? 'Total MRP' : 'Subtotal'}</span>
                                            <span className='font-medium text-foreground'>{fmt(mrpSavings > 0 ? mrpTotal : orderData?.subtotal)}</span>
                                        </div>
                                        {mrpSavings > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Discount on MRP</span>
                                                <span className='font-medium text-success'>- {fmt(mrpSavings)}</span>
                                            </div>
                                        )}
                                        {orderData?.couponDiscountAmount > 0 && (
                                            <div className='flex items-center justify-between text-sm'>
                                                <span className='text-muted-foreground'>Coupon discount</span>
                                                <span className='font-medium text-success'>- {fmt(orderData.couponDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className='flex items-center justify-between text-sm'>
                                            <span className='text-muted-foreground'>Shipping</span>
                                            <span className='font-medium text-success'>FREE</span>
                                        </div>

                                        <div className='my-1 border-t border-dashed border-border/70' />

                                        <div className='flex items-center justify-between'>
                                            <span className='text-base font-semibold text-foreground'>Total</span>
                                            <span className='text-xl font-semibold text-foreground'>{fmt(orderData?.totalAmount)}</span>
                                        </div>

                                        {totalSavings > 0 && (
                                            <div className='flex items-center justify-center gap-1.5 rounded-lg bg-success/[0.08] px-3 py-2 text-[13px] font-semibold text-success'>
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
                                            <span className={`rounded-[var(--radius-control)] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal ${TONE[paymentStatusMeta.tone]}`}>
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
                                                <span className='font-semibold text-brand'>{fmt(orderData.remainingAmount)}</span>
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
                                            className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-brand text-[0.9375rem] font-medium text-on-brand transition-colors hover:bg-brand-hover'
                                        >
                                            Continue Shopping <ChevronRight className='size-4' />
                                        </Link>
                                    </div>
                                </div>

                                {/* Help */}
                                <Link
                                    href='/contact'
                                    className='flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-5 py-4 shadow-sm transition-colors hover:border-brand/40'
                                >
                                    <span className='flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-tint-honey text-brand'>
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
