'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ScrollTrigger measures every trigger's start/end once, and only
// re-measures on window load/resize. Storefront pages keep changing height
// after that — LazyHydrate sections mount, the reviews island loads on the
// client, images and fonts arrive, client navigation swaps the page — so
// triggers below the change fire at the wrong scroll position, or never
// (leaving `once` reveals stuck at their hidden starting state). Re-measure
// whenever the document's height actually changes, and after each route.
const ScrollTriggerSync = () => {
    const pathname = usePathname()

    useEffect(() => {
        if (typeof ResizeObserver === 'undefined') return
        let timer = 0
        let lastHeight = document.body.scrollHeight
        const ro = new ResizeObserver(() => {
            const height = document.body.scrollHeight
            if (height === lastHeight) return
            lastHeight = height
            clearTimeout(timer)
            timer = setTimeout(() => ScrollTrigger.refresh(), 150)
        })
        ro.observe(document.body)
        return () => {
            clearTimeout(timer)
            ro.disconnect()
        }
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => ScrollTrigger.refresh(), 150)
        return () => clearTimeout(timer)
    }, [pathname])

    return null
}

export default ScrollTriggerSync
