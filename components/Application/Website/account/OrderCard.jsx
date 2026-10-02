'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Package } from 'lucide-react'
import { WEBSITE_ORDER_DETAILS } from '@/routes/WebsiteRoute'
import { formatCurrency, formatDate, orderItemCount, orderProductSummary, orderThumbnails } from '@/lib/account'
import OrderStatusBadge from './OrderStatusBadge'

const isCloudinary = (src) => {
    try {
        return new URL(src).hostname === 'res.cloudinary.com'
    } catch {
        return false
    }
}

// Product thumbnail that degrades to an icon tile when the image is missing
// or fails to load (deleted media, broken URL).
const Thumb = ({ src, name }) => {
    const [failed, setFailed] = useState(false)
    return (
        <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-surface-well ring-2 ring-surface-card">
            {src && !failed ? (
                <Image
                    src={src}
                    alt={name}
                    fill
                    sizes="48px"
                    unoptimized={!isCloudinary(src)}
                    className="object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <Package className="size-4 text-foreground/40" aria-hidden="true" />
            )}
        </span>
    )
}

const OrderCard = ({ order }) => {
    const { thumbs, extra } = orderThumbnails(order, 3)
    const count = orderItemCount(order)
    const placedOn = formatDate(order?.createdAt)
    const orderId = order?.order_id

    const body = (
        <>
            <div className="flex shrink-0 -space-x-3">
                {thumbs.length === 0 ? (
                    <Thumb src={null} name="Order" />
                ) : (
                    thumbs.map((t, i) => <Thumb key={`${t.src || t.name}-${i}`} src={t.src} name={t.name} />)
                )}
                {extra > 0 && (
                    <span className="relative flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-well text-xs font-semibold text-foreground/70 ring-2 ring-surface-card">
                        +{extra}
                    </span>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate text-sm font-semibold text-[var(--brand-primary)]">
                        #{orderId || '—'}
                    </p>
                    <OrderStatusBadge status={order?.status} />
                </div>
                <p className="mt-1 truncate text-[13px] text-foreground/70" title={orderProductSummary(order)}>
                    {orderProductSummary(order)}
                </p>
                <p className="mt-0.5 text-xs text-foreground/50">
                    {placedOn ? `Placed ${placedOn}` : 'Date unavailable'} · {count} {count === 1 ? 'item' : 'items'}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-center">
                <p className="text-sm font-semibold text-[var(--brand-primary)] sm:text-base">
                    {formatCurrency(order?.totalAmount)}
                </p>
                {orderId && <ChevronRight className="size-4 text-foreground/40 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
            </div>
        </>
    )

    const rowClass = 'group flex items-start gap-4 px-5 py-4 transition-colors sm:items-center'

    // A row without an order id has nowhere to link to — render it inert.
    if (!orderId) {
        return <div className={rowClass} data-testid="order-card">{body}</div>
    }

    return (
        <Link
            href={WEBSITE_ORDER_DETAILS(orderId)}
            className={`${rowClass} hover:bg-surface-well/60 focus-visible:bg-surface-well/60 focus-visible:outline-none`}
            aria-label={`View order ${orderId}`}
            data-testid="order-card"
        >
            {body}
        </Link>
    )
}

export const OrderCardSkeleton = () => (
    <div className="flex items-center gap-4 px-5 py-4" aria-hidden="true">
        <span className="size-12 shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-border/60" />
        <div className="flex-1 space-y-2">
            <span className="block h-3.5 w-32 animate-pulse rounded bg-border/60" />
            <span className="block h-3 w-48 max-w-full animate-pulse rounded bg-border/60" />
        </div>
        <span className="h-4 w-16 animate-pulse rounded bg-border/60" />
    </div>
)

export default OrderCard
