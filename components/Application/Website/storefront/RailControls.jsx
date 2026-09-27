'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// Prev / next buttons for a `useScrollRail` rail. Renders nothing when the rail
// doesn't overflow, so a short list never shows two dead arrows.
const RailControls = ({ rail, label = 'items', className }) => {
    if (!rail.overflows) return null

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <button
                type="button"
                className="ef-icon-btn"
                onClick={rail.scrollPrev}
                disabled={!rail.canPrev}
                aria-label={`Previous ${label}`}
            >
                <ArrowLeft aria-hidden="true" />
            </button>
            <button
                type="button"
                className="ef-icon-btn"
                onClick={rail.scrollNext}
                disabled={!rail.canNext}
                aria-label={`Next ${label}`}
            >
                <ArrowRight aria-hidden="true" />
            </button>
        </div>
    )
}

export default RailControls
