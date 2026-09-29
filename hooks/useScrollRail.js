'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const EDGE = 4           // px of slack at either end
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Where each card snaps to (its left edge less the rail's scroll padding),
// clamped to the scrollable range and de-duplicated: the last few cards of a
// multi-card rail all share the final stop.
const measureStops = (el, max, stopSelector) => {
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
    const origin = el.getBoundingClientRect().left + el.clientLeft - el.scrollLeft
    const stops = []
    for (const child of stopSelector ? el.querySelectorAll(stopSelector) : el.children) {
        const at = Math.min(max, Math.max(0, child.getBoundingClientRect().left - origin - pad))
        if (!stops.length || at - stops[stops.length - 1] > EDGE) stops.push(at)
    }
    return stops.length ? stops : [0]
}

// Drives a native horizontal scroller (`.ef-rail`) with prev/next buttons.
// Reports whether each direction can still move so the buttons disable at the
// ends, and whether the rail overflows at all so controls can be hidden when
// every card already fits. Also reports the snap stops and which one is
// current, for a position indicator (RailPager). Re-measures on resize and
// when cards load in.
export const useScrollRail = (stopSelector) => {
    const railRef = useRef(null)
    const stopsRef = useRef([0])
    const [state, setState] = useState({ canPrev: false, canNext: false, overflows: false, stops: 1, index: 0 })

    useEffect(() => {
        const el = railRef.current
        if (!el) return

        const update = () => {
            const max = Math.max(0, el.scrollWidth - el.clientWidth)
            const stops = measureStops(el, max, stopSelector)
            stopsRef.current = stops
            let index = 0
            stops.forEach((at, i) => {
                if (Math.abs(at - el.scrollLeft) < Math.abs(stops[index] - el.scrollLeft)) index = i
            })
            const next = {
                overflows: max > EDGE,
                canPrev: el.scrollLeft > EDGE,
                canNext: el.scrollLeft < max - EDGE,
                stops: stops.length,
                index,
            }
            setState((prev) =>
                Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next
            )
        }

        update()
        el.addEventListener('scroll', update, { passive: true })
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
        ro?.observe(el)
        const observeCards = () => {
            ro?.disconnect()
            ro?.observe(el)
            // Nested stops are used by responsive rails whose desktop cards
            // animate their widths. Watching those cards would remeasure the
            // whole rail on every animation frame; viewport resize is enough.
            if (!stopSelector) Array.from(el.children).forEach((child) => ro?.observe(child))
            update()
        }
        const mutations = new MutationObserver(observeCards)
        mutations.observe(el, { childList: true })
        observeCards()

        return () => {
            el.removeEventListener('scroll', update)
            ro?.disconnect()
            mutations.disconnect()
        }
    }, [stopSelector])

    const scroll = useCallback((direction) => {
        const el = railRef.current
        if (!el) return
        const stops = stopsRef.current
        const at = direction > 0
            ? stops.find((stop) => stop > el.scrollLeft + EDGE)
            : [...stops].reverse().find((stop) => stop < el.scrollLeft - EDGE)
        if (at !== undefined) el.scrollTo({ left: at, behavior: reducedMotion() ? 'instant' : 'smooth' })
    }, [])

    const scrollToStop = useCallback((i) => {
        const el = railRef.current
        const at = stopsRef.current[i]
        if (!el || at === undefined) return
        el.scrollTo({ left: at, behavior: reducedMotion() ? 'instant' : 'smooth' })
    }, [])

    return { railRef, ...state, scrollPrev: () => scroll(-1), scrollNext: () => scroll(1), scrollToStop }
}

export default useScrollRail
