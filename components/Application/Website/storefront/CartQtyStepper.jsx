'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { cn } from '@/lib/utils'

/**
 * − qty + control bound to a cart line. Replaces the add button once a pack
 * is in the cart (cards, drawer), so the quantity can be changed in place.
 *
 * At one, the minus becomes a bin: the next tap removes the line, and the
 * icon says so before it happens. Plus stops at the per-order cap.
 *
 * tone:  "solid" — filled pine, the in-cart state on product cards
 *        "soft"  — honey tint, for rows inside the cart drawer
 * block: stretch to the container (card foot buttons).
 */
const CartQtyStepper = ({
    qty,
    onIncrease,
    onDecrease,
    atMax = qty >= MAX_CART_QTY,
    name = 'item',
    tone = 'solid',
    size = 'md',
    block = false,
    className,
}) => {
    const removing = qty <= 1
    const btn = cn(
        'ef-focus flex h-full shrink-0 items-center justify-center rounded-full transition-[background-color,transform] active:scale-90 disabled:pointer-events-none disabled:opacity-40 motion-reduce:active:scale-100',
        size === 'sm' ? 'w-8' : 'w-10',
        tone === 'solid' ? 'hover:bg-white/15' : 'hover:bg-surface-card'
    )

    return (
        <div
            role="group"
            aria-label={`Quantity of ${name} in cart`}
            className={cn(
                'inline-flex select-none items-center justify-between rounded-full p-0.5',
                size === 'sm' ? 'h-9' : 'h-10',
                tone === 'solid'
                    ? 'bg-pine text-white shadow-elev-1'
                    : 'bg-tint-honey text-brand shadow-[inset_0_0_0_1px_var(--line-soft)]',
                block && 'w-full',
                className
            )}
        >
            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDecrease() }}
                aria-label={removing ? `Remove ${name} from cart` : `Decrease quantity of ${name}`}
                title={removing ? 'Remove from cart' : 'Decrease quantity'}
                className={btn}
            >
                {removing
                    ? <Trash2 className="size-3.5" aria-hidden="true" />
                    : <Minus className="size-4" strokeWidth={2.5} aria-hidden="true" />}
            </button>

            <span className="min-w-7 text-center text-[0.9375rem] font-semibold tabular-nums" aria-live="polite" aria-atomic="true">
                {/* Keyed so each change replays the small pop. */}
                <span key={qty} className="inline-block animate-in fade-in zoom-in-75 duration-200 motion-reduce:animate-none">
                    {qty}
                </span>
                <span className="sr-only"> in cart</span>
            </span>

            <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIncrease() }}
                disabled={atMax}
                aria-label={`Increase quantity of ${name}`}
                title={atMax ? `Maximum ${MAX_CART_QTY} per order` : 'Increase quantity'}
                className={btn}
            >
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
        </div>
    )
}

export default CartQtyStepper
