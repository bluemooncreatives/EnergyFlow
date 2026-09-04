'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const DOTS = 'dots'

const range = (start, end) => {
    const out = []
    for (let i = start; i <= end; i++) out.push(i)
    return out
}

// Builds the 1-based list of page items with ellipsis, e.g. [1, 'dots', 4, 5, 6, 'dots', 20].
// `siblings` = how many pages to show on each side of the current page.
const getPageItems = (current, total, siblings = 1) => {
    // first + last + current + 2 siblings + 2 dots
    const totalNumbers = siblings * 2 + 5

    if (total <= totalNumbers) return range(1, total)

    const leftSibling = Math.max(current - siblings, 1)
    const rightSibling = Math.min(current + siblings, total)

    const showLeftDots = leftSibling > 2
    const showRightDots = rightSibling < total - 1

    if (!showLeftDots && showRightDots) {
        return [...range(1, 3 + 2 * siblings), DOTS, total]
    }
    if (showLeftDots && !showRightDots) {
        return [1, DOTS, ...range(total - (2 + 2 * siblings), total)]
    }
    return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, total]
}

const ShopPagination = ({ page, totalPages, onPageChange, disabled = false, siblings = 1 }) => {
    // Nothing to paginate through.
    if (!totalPages || totalPages <= 1) return null

    const current = page + 1 // component works in 1-based pages
    // Fewer siblings (0) on mobile keeps the row from overflowing a phone width;
    // desktop passes 1 for a wider window of page numbers.
    const items = getPageItems(current, totalPages, siblings)

    const goTo = (target) => {
        if (disabled) return
        const clamped = Math.min(Math.max(target, 1), totalPages)
        if (clamped !== current) onPageChange(clamped - 1)
    }

    const cell =
        'inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-1.5 font-neue text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 sm:h-9 sm:min-w-9 sm:px-2 sm:text-[13px]'
    const idle =
        'border-border/70 bg-background text-foreground hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'

    return (
        <nav role="navigation" aria-label="Pagination" className="flex items-center justify-center gap-1 sm:gap-1.5">
            <button
                type="button"
                aria-label="Go to previous page"
                disabled={disabled || current === 1}
                onClick={() => goTo(current - 1)}
                className={cn(cell, idle)}
            >
                <ChevronLeft className="size-4" />
            </button>

            {items.map((item, index) => {
                if (item === DOTS) {
                    return (
                        <span
                            key={`dots-${index}`}
                            aria-hidden
                            className="inline-flex h-8 min-w-6 items-center justify-center text-xs text-muted-foreground sm:h-9 sm:min-w-9 sm:text-[13px]"
                        >
                            …
                        </span>
                    )
                }

                const active = item === current
                return (
                    <button
                        key={item}
                        type="button"
                        aria-label={`Go to page ${item}`}
                        aria-current={active ? 'page' : undefined}
                        disabled={disabled}
                        onClick={() => goTo(item)}
                        className={cn(
                            cell,
                            active
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
                                : idle
                        )}
                    >
                        {item}
                    </button>
                )
            })}

            <button
                type="button"
                aria-label="Go to next page"
                disabled={disabled || current === totalPages}
                onClick={() => goTo(current + 1)}
                className={cn(cell, idle)}
            >
                <ChevronRight className="size-4" />
            </button>
        </nav>
    )
}

export default ShopPagination
