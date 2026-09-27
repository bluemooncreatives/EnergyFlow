'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Drives a native horizontal scroller (`.ef-rail`) with prev/next buttons.
// Reports whether each direction can still move so the buttons disable at the
// ends, and whether the rail overflows at all so controls can be hidden when
// every card already fits. Re-measures on resize and when cards load in.
export const useScrollRail = () => {
    const railRef = useRef(null)
    const [state, setState] = useState({ canPrev: false, canNext: false, overflows: false })

    useEffect(() => {
        const el = railRef.current
        if (!el) return

        const update = () => {
            const max = el.scrollWidth - el.clientWidth
            const next = {
                overflows: max > 4,
                canPrev: el.scrollLeft > 4,
                canNext: el.scrollLeft < max - 4,
            }
            setState((prev) =>
                prev.overflows === next.overflows && prev.canPrev === next.canPrev && prev.canNext === next.canNext
                    ? prev
                    : next
            )
        }

        update()
        el.addEventListener('scroll', update, { passive: true })
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
        ro?.observe(el)
        Array.from(el.children).forEach((child) => ro?.observe(child))

        return () => {
            el.removeEventListener('scroll', update)
            ro?.disconnect()
        }
    }, [])

    const scroll = useCallback((direction) => {
        const el = railRef.current
        if (!el) return
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // Page by what's visible, minus a sliver so the next card's edge stays in view.
        el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reduce ? 'auto' : 'smooth' })
    }, [])

    return { railRef, ...state, scrollPrev: () => scroll(-1), scrollNext: () => scroll(1) }
}

export default useScrollRail
