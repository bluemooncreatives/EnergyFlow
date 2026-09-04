'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * Hero banner with a giant watermark title (used on /my-account, /orders, …).
 *
 * The title is *measured* and scaled so it always spans the full banner width —
 * short words ("Orders") and long words ("Dashboard") both fill edge-to-edge,
 * instead of a fixed `vw` size that only fills for one word length. The scale is
 * capped at MAX_FONT_PX so short words don't explode on wide desktop screens
 * (there it keeps the previous 18rem watermark size).
 */

const MAX_FONT_PX = 288   // 18rem — previous desktop cap; keeps the watermark look on wide screens
const FILL = 0.95         // fill 95% of the banner width, leaving a small side gutter

// Pre-hydration / SSR fallback size so the title isn't tiny before JS measures it.
const FALLBACK_FONT = 'clamp(2.75rem, 13vw, 18rem)'

const WebsiteBreadcrumb = ({ props }) => {
    const boxRef = useRef(null)
    const textRef = useRef(null)
    const [fontSize, setFontSize] = useState(null)

    const fit = useCallback(() => {
        const box = boxRef.current
        const text = textRef.current
        if (!box || !text || !box.clientWidth) return
        // Measure the title's natural width at a fixed reference size (kept
        // transient — set, read, restore within one frame so it never paints),
        // then scale so that width becomes (banner width × FILL), capped at
        // MAX_FONT_PX. Storing the result in state keeps React the owner of the
        // inline font-size so a later re-render can't reset it.
        const prev = text.style.fontSize
        text.style.fontSize = '100px'
        const natural = text.getBoundingClientRect().width
        text.style.fontSize = prev
        if (!natural) return
        setFontSize(Math.min(MAX_FONT_PX, (box.clientWidth * FILL) / natural * 100))
    }, [])

    useEffect(() => {
        fit()
        const ro = new ResizeObserver(fit)
        if (boxRef.current) ro.observe(boxRef.current)
        // The brand webfont has different metrics than the fallback — re-fit once
        // it has loaded so the measurement is accurate.
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            document.fonts.ready.then(fit)
        }
        return () => ro.disconnect()
    }, [fit, props.title])

    return (
        <section className="relative isolate h-[180px] overflow-hidden sm:h-[160px] lg:h-[200px]">
            {/* Brand background */}
            <div className="absolute inset-0 bg-[var(--dark-red-2)]" />

            {/* Watermark title — measured + scaled to fill the banner width. On
                mobile it sits below the fixed header so it isn't clipped by it. */}
            <div
                ref={boxRef}
                className="absolute inset-x-0 top-20 z-10 flex justify-center sm:top-10 lg:top-16"
            >
                <div
                    ref={textRef}
                    className="pointer-events-none select-none whitespace-nowrap font-neue font-semibold uppercase leading-[0.8] tracking-tighter text-white"
                    style={{
                        fontSize: fontSize != null ? `${fontSize}px` : FALLBACK_FONT,
                        WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)',
                        maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 38%, rgba(0,0,0,0) 100%)',
                        textShadow: '0 12px 32px rgba(0,0,0,0.18)',
                    }}
                    aria-hidden
                >
                    {props.title}
                </div>
            </div>

            {/* Gradient fade to background */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-b from-transparent via-background/50 to-background sm:h-36" />
        </section>
    )
}

export default WebsiteBreadcrumb
