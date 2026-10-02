'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useSelector } from 'react-redux'
import useHydrated from '@/hooks/useHydrated'
import { cn } from '@/lib/utils'
import { selectWishlistCount } from '@/store/reducer/wishlistReducer'
import { WEBSITE_WISHLIST } from '@/routes/WebsiteRoute'

// Saved-items count, 0 until the stored list is available on the client so
// the first render matches the server.
export const useWishlistCount = () => {
    const hydrated = useHydrated()
    const count = useSelector(selectWishlistCount)
    return hydrated ? count : 0
}

// Header heart with a count badge (desktop nav).
const WishlistLink = ({ className }) => {
    const count = useWishlistCount()
    return (
        <Link
            href={WEBSITE_WISHLIST}
            aria-label={count > 0 ? `Wishlist, ${count} saved ${count === 1 ? 'item' : 'items'}` : 'Wishlist'}
            title="Wishlist"
            className={cn('relative text-[var(--ink-body)] transition-colors hover:text-[var(--brand-primary-hover)]', className)}
        >
            <Heart className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
            {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-on-brand tabular-nums" aria-hidden="true">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    )
}

export default WishlistLink
