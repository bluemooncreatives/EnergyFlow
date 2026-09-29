'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { getLenis } from '@/components/Application/LenisProvider'
import { scrollToElement, scrollToY } from '@/lib/scroll'

// How long to keep the new page pinned where it belongs. Long enough to
// outlast the mobile sheet's close animation (200ms) and the frames Lenis
// takes to settle, short enough that it is over before anyone notices.
const SETTLE_MS = 600

/**
 * Where a page opens.
 *
 * Next resets the scroll itself on navigation, but on this site two things
 * undo it. Lenis keeps its own scroll value and writes it back on the frame
 * after the route swaps. And the mobile menu is a Radix sheet, so the body is
 * still scroll-locked while the sheet plays its close animation — which is
 * exactly the window the new page mounts in. Together they mean a tap in the
 * menu can open the next page halfway down it: scroll to the footer, open the
 * menu, tap Shop, and the shop page arrives at the bottom.
 *
 * So the behaviour is owned here rather than inferred:
 *
 *   forward navigation   → the top of the new page, instantly, or its #hash
 *                          target once that element exists
 *   back / forward       → left alone; the browser and Next put the visitor
 *                          back where they were, which is what they expect
 *   query-only changes   → left alone, so shop filters, pagination and the
 *                          product page's ?size= keep their position (those
 *                          screens scroll themselves where it makes sense)
 *
 * The position is re-asserted over the settle window rather than set once,
 * because whatever the sheet or Lenis does happens a frame or two later. Any
 * real input from the visitor ends it immediately — if they start scrolling,
 * the page is theirs.
 */
const RouteScrollReset = () => {
    const pathname = usePathname()
    const poppedRef = useRef(false)
    const firstRef = useRef(true)

    // A history pop is the one navigation that must keep its position.
    useEffect(() => {
        const onPopState = () => { poppedRef.current = true }
        window.addEventListener('popstate', onPopState)
        return () => window.removeEventListener('popstate', onPopState)
    }, [])

    useEffect(() => {
        // The first pass is the document load: the browser has already placed
        // the page (top, a #hash, or a position it restored).
        if (firstRef.current) {
            firstRef.current = false
            return
        }
        if (poppedRef.current) {
            poppedRef.current = false
            return
        }

        // The new page is a different height, so Lenis's cached limit is stale.
        getLenis()?.resize()

        const hash = window.location.hash.slice(1)
        let frame = 0
        let done = false
        const started = performance.now()

        const release = () => {
            done = true
            cancelAnimationFrame(frame)
        }

        const settle = () => {
            if (done) return
            if (hash) {
                // The target may not have streamed in yet; keep looking, and
                // fall back to the top if it never arrives.
                if (scrollToElement(hash, { smooth: false })) return release()
            } else if (Math.abs(window.scrollY) > 2) {
                scrollToY(0, { smooth: false })
            }
            if (performance.now() - started < SETTLE_MS) {
                frame = requestAnimationFrame(settle)
            } else if (hash) {
                scrollToY(0, { smooth: false })
            }
        }
        settle()

        // Anything the visitor does themselves wins.
        const options = { passive: true, once: true }
        window.addEventListener('wheel', release, options)
        window.addEventListener('touchstart', release, options)
        window.addEventListener('pointerdown', release, options)
        window.addEventListener('keydown', release, { once: true })

        return () => {
            release()
            window.removeEventListener('wheel', release)
            window.removeEventListener('touchstart', release)
            window.removeEventListener('pointerdown', release)
            window.removeEventListener('keydown', release)
        }
    }, [pathname])

    return null
}

export default RouteScrollReset
