'use client'

import { cn } from '@/lib/utils'
import RailControls from './RailControls'

// Past this many stops, dots get too small to read; a progress track instead.
const MAX_DOTS = 8

/**
 * Navigation above a `useScrollRail` rail, for touch layouts where the
 * rail's own arrows are hidden: one dot per snap stop (the current one
 * stretched), a "2 / 4" count, and prev / next buttons. It tells a shopper
 * the row scrolls sideways and how much is left. Renders nothing when every
 * card already fits.
 *
 * Dots show progress; the labelled arrows are the interactive controls.
 */
const RailPager = ({ rail, label = 'items', className }) => {
    if (!rail.overflows) return null
    const { stops, index } = rail
    const dots = stops <= MAX_DOTS

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-[0.8125rem] font-medium text-ink-strong">Swipe to explore</span>
                <div className="flex items-center gap-3">
                    {dots ? (
                        <div className="flex items-center" aria-hidden="true">
                            {Array.from({ length: stops }, (_, i) => (
                                <span
                                    key={i}
                                    className="flex h-4 items-center px-[3px]"
                                >
                                    <span
                                        className={cn(
                                            'block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                                            i === index ? 'w-6 bg-brand' : 'w-1.5 bg-line-strong'
                                        )}
                                    />
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line-strong" aria-hidden="true">
                            <span
                                className="absolute inset-y-0 rounded-full bg-brand transition-[left] duration-300 ease-out motion-reduce:transition-none"
                                style={{
                                    width: `${Math.max(12, 100 / stops)}%`,
                                    left: `${(index / (stops - 1)) * (100 - Math.max(12, 100 / stops))}%`,
                                }}
                            />
                        </div>
                    )}
                    <span role="status" aria-atomic="true" className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-ink-muted">
                        <span className="text-ink-strong">{index + 1}</span> / {stops}
                        <span className="sr-only"> {label}</span>
                    </span>
                </div>
            </div>
            <RailControls rail={rail} label={label} />
        </div>
    )
}

export default RailPager
