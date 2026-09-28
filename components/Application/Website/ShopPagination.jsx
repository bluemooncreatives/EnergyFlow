'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHydrated } from '@/hooks/useHydrated'

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
    // React Query can report a fetch in flight during SSR but not on the first
    // client render; only reflect it once hydrated so the markup matches.
    const hydrated = useHydrated()
    const busy = hydrated && disabled
    // Nothing to paginate through.
    if (!totalPages || totalPages <= 1) return null

    const current = page + 1 // component works in 1-based pages
    // Fewer siblings (0) on mobile keeps the row from overflowing a phone width;
    // desktop passes 1 for a wider window of page numbers.
    const items = getPageItems(current, totalPages, siblings)

    const goTo = (target) => {
        if (busy) return
        const clamped = Math.min(Math.max(target, 1), totalPages)
        if (clamped !== current) onPageChange(clamped - 1)
    }

    // `disabled` attributes depend only on page bounds (identical on server and
    // client). The in-flight fetch state is signalled with aria-busy and the
    // guard in goTo — it can differ between SSR and the first client render,
    // which previously caused a hydration attribute mismatch.
    const cell =
        'ef-focus inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2 text-[0.875rem] font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-35 aria-busy:cursor-progress'
    const idle =
        'bg-surface-card text-ink-strong shadow-[inset_0_0_0_1px_var(--line-soft)] hover:bg-brand hover:text-on-brand'

    return (
        <nav role="navigation" aria-label="Pagination" aria-busy={busy || undefined} className="flex items-center justify-center gap-1.5">
            <button
                type="button"
                aria-label="Go to previous page"
                disabled={current === 1}
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
                            className="inline-flex h-10 min-w-6 items-center justify-center text-[0.875rem] text-ink-muted"
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
                        onClick={() => goTo(item)}
                        className={cn(
                            cell,
                            active
                                ? 'bg-brand text-on-brand hover:bg-brand-hover'
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
                disabled={current === totalPages}
                onClick={() => goTo(current + 1)}
                className={cn(cell, idle)}
            >
                <ChevronRight className="size-4" />
            </button>
        </nav>
    )
}

export default ShopPagination
