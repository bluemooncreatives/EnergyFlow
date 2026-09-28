'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { formatINR } from '@/components/Application/Website/storefront/format'
import { prefersReducedMotion } from './productUtils'

// A rupee amount that counts to its new value when it changes (switching pack
// size). React renders the first value only; later values are written by the
// tween, so React never fights the animation over the text node.
const AnimatedPrice = ({ value, className }) => {
    const ref = useRef(null)
    const [initial] = useState(() => formatINR(value))
    const current = useRef(Number(value) || 0)

    useEffect(() => {
        const el = ref.current
        const target = Number(value) || 0
        if (!el || target === current.current) return

        const state = { v: current.current }
        current.current = target
        if (prefersReducedMotion()) {
            el.textContent = formatINR(target)
            return
        }
        const tween = gsap.to(state, {
            v: target,
            duration: 0.7,
            ease: 'power3.out',
            onUpdate: () => { el.textContent = formatINR(Math.round(state.v)) },
            onComplete: () => { el.textContent = formatINR(target) },
        })
        return () => tween.kill()
    }, [value])

    return <span ref={ref} className={className}>{initial}</span>
}

export default AnimatedPrice
