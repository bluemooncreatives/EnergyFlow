'use client'

import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

const formatNumber = (n, { decimals, locale, prefix, suffix }) =>
    `${prefix}${new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n)}${suffix}`

/**
 * A number that counts up from `from` to `value` the first time it scrolls
 * into view.
 *
 * The server HTML already holds the final figure, so crawlers, screen readers,
 * no-JS visitors and reduced-motion users all get the real number with no
 * animation. An invisible copy of the final figure reserves the width, so the
 * digits never push the layout around while they climb.
 *
 *   <NumberCounter value={1200} suffix="+" />
 *   <NumberCounter value={4.8} decimals={1} />
 */
const NumberCounter = ({
    value,
    from = 0,
    decimals = 0,
    prefix = '',
    suffix = '',
    duration = 1800,
    locale = 'en-IN',
    className,
}) => {
    const liveRef = useRef(null)
    const options = { decimals, locale, prefix, suffix }
    const final = formatNumber(value, options)

    // Layout effect: the reset to `from` lands before the first paint, so a
    // visible counter never flashes its final value first.
    useLayoutEffect(() => {
        const el = liveRef.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
        // Already scrolled past (restored scroll, deep link): leave it be.
        if (el.getBoundingClientRect().bottom < 0) return

        const fmt = { decimals, locale, prefix, suffix }
        const step = 10 ** decimals
        let frame = 0
        el.textContent = formatNumber(from, fmt)

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return
            observer.disconnect()

            const start = performance.now()
            const tick = (now) => {
                const t = Math.min(1, (now - start) / duration)
                const current = from + (value - from) * easeOutExpo(t)
                el.textContent = t < 1
                    ? formatNumber(Math.floor(current * step) / step, fmt)
                    : formatNumber(value, fmt)
                if (t < 1) frame = requestAnimationFrame(tick)
            }
            frame = requestAnimationFrame(tick)
        }, { threshold: 0.5 })

        observer.observe(el)

        return () => {
            observer.disconnect()
            cancelAnimationFrame(frame)
            el.textContent = formatNumber(value, fmt)
        }
    }, [value, from, decimals, prefix, suffix, duration, locale])

    return (
        <span className={cn('relative inline-grid whitespace-nowrap tabular-nums', className)}>
            <span className="sr-only">{final}</span>
            <span aria-hidden="true" className="invisible col-start-1 row-start-1">{final}</span>
            <span aria-hidden="true" ref={liveRef} className="col-start-1 row-start-1">{final}</span>
        </span>
    )
}

export default NumberCounter
