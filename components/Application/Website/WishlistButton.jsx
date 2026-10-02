'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import useHydrated from '@/hooks/useHydrated'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'

const VARIANTS = {
    // Floating over a product photo.
    card: 'ef-focus flex size-9 items-center justify-center rounded-full bg-surface-card/90 shadow-elev-1 backdrop-blur-sm transition-[background-color,transform] hover:scale-105 hover:bg-surface-card',
    // Outlined circle beside the product page's share button.
    icon: 'ef-icon-btn size-10',
}

/**
 * Save / unsave a product. The heart is filled when saved. Until the stored
 * wishlist is available on the client it renders unsaved, matching the
 * server-rendered markup.
 */
const WishlistButton = ({ productId, name, variant = 'card', className }) => {
    const hydrated = useHydrated()
    const label = formatProductName(name) || 'this product'
    const { saved, toggle, pending, available } = useWishlist(productId, label)
    const on = hydrated && saved

    if (!available) return null

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={on}
            aria-busy={pending || undefined}
            aria-label={on ? `Remove from wishlist: ${label}` : `Save to wishlist: ${label}`}
            title={on ? 'Remove from wishlist' : 'Save to wishlist'}
            className={cn(
                VARIANTS[variant] || VARIANTS.card,
                // .ef-icon-btn colours itself (and inverts on hover); only the
                // saved state overrides it, and hands hover back.
                variant === 'icon'
                    ? on && 'text-[var(--dark-red)] hover:text-on-brand'
                    : on ? 'text-[var(--dark-red)]' : 'text-brand',
                className
            )}
        >
            <Heart
                key={on ? 'on' : 'off'}
                className={cn(
                    variant === 'icon' ? '!size-4' : 'size-4',
                    on && 'fill-current animate-in zoom-in-50 duration-300 motion-reduce:animate-none'
                )}
                strokeWidth={2}
                aria-hidden="true"
            />
        </button>
    )
}

export default WishlistButton
