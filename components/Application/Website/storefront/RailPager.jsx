'use client'

import { cn } from '@/lib/utils'
import RailControls from './RailControls'

// Past this many stops, dots get too small to read; a progress track instead.
const MAX_DOTS = 8

/**
 * Where-am-I row under a `useScrollRail` rail, for touch layouts where the
 * rail's own arrows are hidden: one dot per snap stop (the current one
 * stretched), a "2 / 4" count, and prev / next buttons. It tells a shopper
 * the row scrolls sideways and how much is left. Renders nothing when every
 * card already fits.
 *
 * The dots are also a tap target to jump straight to a stop, but the arrows
 * are the accessible control; the dots are hidden from assistive tech.
 */
const RailPager = ({ rail, label = 'items', className }) => {
    if (!rail.overflows) return null
    const { stops, index } = rail
    const dots = stops <= MAX_DOTS

    return (
        <div className={cn('flex items-center gap-3', className)}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
                {dots ? (
                    <div className="flex items-center" aria-hidden="true">
                        {Array.from({ length: stops }, (_, i) => (
                            <button
                                key={i}
                                type="button"
                                tabIndex={-1}
                                onClick={() => rail.scrollToStop(i)}
                                className="flex h-8 items-center px-[3px]"
                            >
                                <span
                                    className={cn(
                                        'block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none',
                                        i === index ? 'w-6 bg-brand' : 'w-1.5 bg-line-strong'
                                    )}
                                />
                            </button>
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
                <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums text-ink-muted">
                    <span className="text-ink-strong">{index + 1}</span> / {stops}
                    <span className="sr-only"> {label}</span>
                </span>
            </div>
            <RailControls rail={rail} label={label} />
        </div>
    )
}

export default RailPager
