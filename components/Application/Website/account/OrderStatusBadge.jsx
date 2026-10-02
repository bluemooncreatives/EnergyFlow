import { cn } from '@/lib/utils'
import { TONE, statusMetaFor } from './orderStatus'

const OrderStatusBadge = ({ status, className }) => {
    const meta = statusMetaFor(status)
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-normal whitespace-nowrap',
                TONE[meta.tone],
                className
            )}
        >
            <meta.Icon className="size-3" aria-hidden="true" /> {meta.label}
        </span>
    )
}

export default OrderStatusBadge
