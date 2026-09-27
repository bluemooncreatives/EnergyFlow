'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

// Storefront scroll reveal. Mark any element inside `scopeRef` with
// `data-reveal` and it fades up the first time it nears the viewport; siblings
// entering together are staggered.
//
// Content is visible by default — the hidden state is applied by JS here, so a
// failed/slow bundle never leaves a section blank. Elements that are already on
// (or above) screen when this runs — a restored scroll position, a deep link, a
// section hydrated late by LazyHydrate — are revealed immediately instead of
// waiting on a trigger they have already passed.
export const useReveal = (scopeRef, dependencies = []) => {
    useGSAP(() => {
        const root = scopeRef.current
        if (!root) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const els = gsap.utils.toArray(root.querySelectorAll('[data-reveal]'))
        if (!els.length) return

        const threshold = window.innerHeight * 0.92
        const onScreen = []
        const below = []
        els.forEach((el) => (el.getBoundingClientRect().top < threshold ? onScreen : below).push(el))

        const reveal = (batch) => gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.07,
            overwrite: true,
        })

        if (onScreen.length) {
            gsap.set(onScreen, { autoAlpha: 0, y: 20 })
            reveal(onScreen)
        }

        if (below.length) {
            gsap.set(below, { autoAlpha: 0, y: 28 })
            ScrollTrigger.batch(below, { start: 'top 92%', once: true, onEnter: reveal })
        }
    }, { scope: scopeRef, dependencies })
}

export default useReveal
