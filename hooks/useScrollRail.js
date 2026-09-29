'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const EDGE = 4           // px of slack at either end
const NUDGE_PX = 64      // how far the peek nudge slides
const NUDGE_MS = 1000

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Where each card snaps to (its left edge less the rail's scroll padding),
// clamped to the scrollable range and de-duplicated: the last few cards of a
// multi-card rail all share the final stop.
const measureStops = (el, max) => {
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
    const origin = el.getBoundingClientRect().left + el.clientLeft - el.scrollLeft
    const stops = []
    for (const child of el.children) {
        const at = Math.min(max, Math.max(0, child.getBoundingClientRect().left - origin - pad))
        if (!stops.length || at - stops[stops.length - 1] > EDGE) stops.push(at)
    }
    return stops.length ? stops : [0]
}

// Slides the rail a little way and back, so a first-time visitor on a touch
// screen sees that it moves sideways. Snap is suspended for the move (it would
// fight a programmatic scroll) and any touch cancels it at once.
const playNudge = (el) => {
    const snap = el.style.scrollSnapType
    el.style.scrollSnapType = 'none'
    let frame = 0
    let start = 0
    const stop = () => {
        cancelAnimationFrame(frame)
        el.style.scrollSnapType = snap
        el.removeEventListener('pointerdown', stop)
        el.removeEventListener('wheel', stop)
    }
    const step = (now) => {
        if (!start) start = now
        const t = Math.min(1, (now - start) / NUDGE_MS)
        // Out and back on one sine, eased at both ends.
        el.scrollLeft = Math.sin(Math.PI * t) ** 2 * NUDGE_PX
        if (t < 1) frame = requestAnimationFrame(step)
        else { el.scrollLeft = 0; stop() }
    }
    el.addEventListener('pointerdown', stop, { once: true })
    el.addEventListener('wheel', stop, { once: true, passive: true })
    frame = requestAnimationFrame(step)
    return stop
}

// Drives a native horizontal scroller (`.ef-rail`) with prev/next buttons.
// Reports whether each direction can still move so the buttons disable at the
// ends, and whether the rail overflows at all so controls can be hidden when
// every card already fits. Also reports the snap stops and which one is
// current, for a position indicator (RailPager). Re-measures on resize and
// when cards load in.
//
// nudge: a key (e.g. "categories"). On touch screens the rail plays a one-off
// peek the first time it is mostly in view, once per key per session, unless
// the shopper has already scrolled it or prefers reduced motion.
export const useScrollRail = ({ nudge } = {}) => {
    const railRef = useRef(null)
    const stopsRef = useRef([0])
    const [state, setState] = useState({ canPrev: false, canNext: false, overflows: false, stops: 1, index: 0 })

    useEffect(() => {
        const el = railRef.current
        if (!el) return

        const update = () => {
            const max = el.scrollWidth - el.clientWidth
            const stops = measureStops(el, max)
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
        Array.from(el.children).forEach((child) => ro?.observe(child))

        return () => {
            el.removeEventListener('scroll', update)
            ro?.disconnect()
        }
    }, [])

    useEffect(() => {
        const el = railRef.current
        if (!nudge || !el || typeof IntersectionObserver === 'undefined') return
        if (!window.matchMedia('(hover: none)').matches || reducedMotion()) return
        const key = `ef-rail-nudge:${nudge}`
        try { if (sessionStorage.getItem(key)) return } catch { /* storage blocked: nudge anyway */ }

        let timer = 0
        let cancel = null
        const io = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            io.disconnect()
            // A beat after it settles into view, so the eye is already on it.
            timer = setTimeout(() => {
                if (el.scrollLeft > EDGE || el.scrollWidth - el.clientWidth <= EDGE) return
                try { sessionStorage.setItem(key, '1') } catch { /* no-op */ }
                cancel = playNudge(el)
            }, 450)
        }, { threshold: 0.6 })
        io.observe(el)
        return () => {
            io.disconnect()
            clearTimeout(timer)
            cancel?.()
        }
    }, [nudge])

    const scroll = useCallback((direction) => {
        const el = railRef.current
        if (!el) return
        // Page by what's visible, minus a sliver so the next card's edge stays in view.
        el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }, [])

    const scrollToStop = useCallback((i) => {
        const el = railRef.current
        const at = stopsRef.current[i]
        if (!el || at === undefined) return
        el.scrollTo({ left: at, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }, [])

    return { railRef, ...state, scrollPrev: () => scroll(-1), scrollNext: () => scroll(1), scrollToStop }
}

export default useScrollRail
