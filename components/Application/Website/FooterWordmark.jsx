'use client'

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef, useState } from 'react'

/**
 * Giant "ENERGYFLOW" wordmark.
 *
 * The text is measured on mount and the SVG viewBox is sized to its real
 * bounding box, so `width: 100%` scales the word to fill the screen width
 * with NATURAL letter spacing and proportions (no stretching, no clipping).
 *
 * The letters show only as a faint outline. On hover, a radial "spotlight"
 * gradient — clipped to the glyphs via the text `fill` — follows the cursor,
 * lighting up only the part of the writeup under the mouse.
 */

const FONT_SIZE = 100
const BASELINE_Y = 88

const FooterWordmark = () => {
    const svgRef = useRef(null)
    const textRef = useRef(null)
    const gradRef = useRef(null)
    const boxRef = useRef({ x: 0, y: 0, width: 1000, height: 100 })
    const proxy = useRef({ x: 0, y: 0, r: 0 })
    const xTo = useRef(null)
    const yTo = useRef(null)
    const rTo = useRef(null)

    const [viewBox, setViewBox] = useState('0 0 1000 100')

    useGSAP(() => {
        const apply = () => {
            const g = gradRef.current
            if (!g) return
            g.setAttribute('cx', proxy.current.x)
            g.setAttribute('cy', proxy.current.y)
            g.setAttribute('r', proxy.current.r)
        }

        xTo.current = gsap.quickTo(proxy.current, 'x', { duration: 0.35, ease: 'power3', onUpdate: apply })
        yTo.current = gsap.quickTo(proxy.current, 'y', { duration: 0.35, ease: 'power3', onUpdate: apply })
        rTo.current = gsap.quickTo(proxy.current, 'r', { duration: 0.5, ease: 'power3', onUpdate: apply })

        // Size the viewBox to the text's real bounding box → natural spacing.
        const measure = () => {
            const t = textRef.current
            if (!t) return
            const b = t.getBBox()
            boxRef.current = b
            proxy.current.x = b.x + b.width / 2
            proxy.current.y = b.y + b.height / 2
            setViewBox(`${b.x} ${b.y} ${b.width} ${b.height}`)
        }

        measure()
        if (typeof document !== 'undefined' && document.fonts?.ready) {
            document.fonts.ready.then(measure)
        }
    }, { scope: svgRef })

    const handleMove = (e) => {
        const rect = svgRef.current.getBoundingClientRect()
        const b = boxRef.current
        xTo.current?.(b.x + ((e.clientX - rect.left) / rect.width) * b.width)
        yTo.current?.(b.y + ((e.clientY - rect.top) / rect.height) * b.height)
    }

    const handleEnter = () => rTo.current?.(boxRef.current.height * 2.4)
    const handleLeave = () => rTo.current?.(0)

    return (
        <div className='mt-14'>
            <svg
                ref={svgRef}
                viewBox={viewBox}
                role='img'
                aria-label='Energyflow'
                onMouseMove={handleMove}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
                className='block w-full h-auto'
            >
                <defs>
                    <radialGradient
                        ref={gradRef}
                        id='ms-spotlight'
                        gradientUnits='userSpaceOnUse'
                        cx='0'
                        cy='0'
                        r='0'
                    >
                        <stop offset='0%' style={{ stopColor: 'var(--brand-cream)', stopOpacity: 1 }} />
                        <stop offset='55%' style={{ stopColor: 'var(--brand-cream)', stopOpacity: 0.35 }} />
                        <stop offset='100%' style={{ stopColor: 'var(--brand-cream)', stopOpacity: 0 }} />
                    </radialGradient>
                </defs>

                <text
                    ref={textRef}
                    x='0'
                    y={BASELINE_Y}
                    style={{ fontWeight: 700, fontSize: `${FONT_SIZE}px`, letterSpacing: '-0.02em' }}
                    fill='url(#ms-spotlight)'
                    stroke='rgba(255,255,255,0.28)'
                    strokeWidth='0.5'
                >
                    ENERGYFLOW
                </text>
            </svg>
        </div>
    )
}

export default FooterWordmark
