'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { formatINR } from '@/components/Application/Website/storefront/format'
import { prefersReducedMotion, savingOf, unitPriceLabel } from './productUtils'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Pack sizes as a radio group. A single filled indicator slides to the chosen
 * pack (GSAP), each option shows its own price so shoppers compare without
 * clicking, and arrow keys move the choice (roving tabindex), as a native
 * radio group would.
 *
 * With one pack there is nothing to choose: it renders as a plain fact.
 */
const PackSizePicker = ({ variants, selectedId, onSelect }) => {
    const groupRef = useRef(null)
    const indicatorRef = useRef(null)
    const placed = useRef(false)

    // Place the indicator under the selected option; slide on change, jump on
    // first paint and on resize (options can re-wrap onto new rows).
    useIsoLayoutEffect(() => {
        const group = groupRef.current
        const indicator = indicatorRef.current
        if (!group || !indicator) return

        const place = (animate) => {
            const option = group.querySelector('[aria-checked="true"]')
            if (!option) return
            const box = { x: option.offsetLeft, y: option.offsetTop, width: option.offsetWidth, height: option.offsetHeight }
            if (animate && !prefersReducedMotion()) {
                gsap.to(indicator, { ...box, duration: 0.6, ease: 'expo.out', overwrite: true })
            } else {
                gsap.set(indicator, box)
            }
        }

        place(placed.current)
        placed.current = true

        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => place(false)) : null
        ro?.observe(group)
        return () => ro?.disconnect()
    }, [selectedId, variants.length])

    if (variants.length <= 1) {
        const only = variants[0]
        if (!only?.size) return null
        return (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="text-ink-muted">Pack size</span>
                <span className="inline-flex h-9 items-center rounded-[var(--radius-control)] bg-brand px-3.5 font-semibold text-on-brand">
                    {only.size}
                </span>
                {unitPriceLabel(only.sellingPrice, only.size) && (
                    <span className="text-ink-muted">{unitPriceLabel(only.sellingPrice, only.size)}</span>
                )}
            </div>
        )
    }

    const onKeyDown = (e) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
        const index = variants.findIndex((v) => v._id === selectedId)
        let next = null
        if (e.key in keys) next = (index + keys[e.key] + variants.length) % variants.length
        if (e.key === 'Home') next = 0
        if (e.key === 'End') next = variants.length - 1
        if (next === null) return
        e.preventDefault()
        onSelect(variants[next])
        requestAnimationFrame(() => groupRef.current?.querySelector(`[data-pack="${variants[next]._id}"]`)?.focus())
    }

    const selected = variants.find((v) => v._id === selectedId)

    return (
        <fieldset>
            <legend className="mb-3 flex w-full items-baseline justify-between gap-3 text-sm">
                <span className="text-ink-muted">
                    Pack size: <span className="font-semibold text-ink-strong">{selected?.size}</span>
                </span>
                <span className="text-xs text-ink-muted">{variants.length} sizes</span>
            </legend>
            <div ref={groupRef} role="radiogroup" aria-label="Pack size" onKeyDown={onKeyDown} className="relative flex flex-wrap gap-2">
                <span ref={indicatorRef} className="ef-pd-pack__indicator" aria-hidden="true" />
                {variants.map((v) => {
                    const checked = v._id === selectedId
                    const { percent } = savingOf(v)
                    return (
                        <button
                            key={v._id}
                            type="button"
                            role="radio"
                            data-pack={v._id}
                            aria-checked={checked}
                            tabIndex={checked ? 0 : -1}
                            onClick={() => !checked && onSelect(v)}
                            className="ef-pd-pack ef-focus"
                        >
                            <span className="flex items-center gap-2 text-[0.9375rem] font-semibold leading-none">
                                {v.size}
                                {percent > 0 && (
                                    <span className="rounded-[0.3rem] bg-sun px-1.5 py-0.5 text-[0.625rem] font-bold leading-none text-sun-ink">
                                        −{percent}%
                                    </span>
                                )}
                            </span>
                            <span className="text-xs leading-none opacity-80">{formatINR(v.sellingPrice)}</span>
                        </button>
                    )
                })}
            </div>
        </fieldset>
    )
}

export default PackSizePicker
