'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useReveal } from '@/hooks/useReveal'

gsap.registerPlugin(ScrollTrigger)

// Motion scope for the About page. Everything inside is a server component —
// this wrapper only adds behaviour, so the page's copy is in the HTML whether
// or not this bundle ever runs.
//
// Three effects, all opt-in through data attributes:
//   data-reveal    fade-up on approach          (shared storefront behaviour)
//   data-headline  masked line slide, on load   (the <h1> only)
//   data-parallax  slow drift against the page  (hero band photos)
//
// Like useReveal, the hidden state is applied here in JS rather than in CSS:
// a failed or slow bundle then leaves the page fully readable instead of
// blank, which is the difference between a degraded page and a broken one.
const AboutMotion = ({ children, className }) => {
    const scope = useRef(null)

    useReveal(scope)

    useGSAP(() => {
        const root = scope.current
        if (!root) return
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        // The <h1> lines rise out of their overflow masks, one after the next.
        const lines = gsap.utils.toArray(root.querySelectorAll('[data-headline]'))
        if (lines.length) {
            // fromTo, not from: a `from` tween that is interrupted (a re-run,
            // a killed timeline) can leave the line parked off-screen, and an
            // invisible <h1> is the worst thing this file could cause.
            gsap.fromTo(
                lines,
                { yPercent: 110 },
                { yPercent: 0, duration: 1, ease: 'power3.out', stagger: 0.08 }
            )
        }

        // Hero band photos drift up as the strip leaves the viewport. The
        // element is inset beyond its frame (see .bandMedia) so there is room
        // to move without exposing an edge.
        gsap.utils.toArray(root.querySelectorAll('[data-parallax]')).forEach((el) => {
            const distance = Number(el.dataset.parallax) || 0
            if (!distance) return
            gsap.fromTo(
                el,
                { yPercent: distance },
                {
                    yPercent: -distance,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: el.parentElement || el,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                }
            )
        })
    }, { scope })

    return (
        <div ref={scope} className={className}>
            {children}
        </div>
    )
}

export default AboutMotion
