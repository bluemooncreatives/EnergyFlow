'use client'

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import CustomEase from "gsap/CustomEase"

gsap.registerPlugin(CustomEase)

// The lockup never has to be a flash: a short floor keeps the brand beat
// readable on a warm cache without meaningfully delaying a slow one (the
// 2.5s safety net below still bounds the worst case).
const MIN_VISIBLE_MS = 1400

const PageLoader = ({ onReady, onComplete }) => {
    const loaderRef = useRef(null)
    const barRef = useRef(null)
    const barTweenRef = useRef(null)
    const progressRef = useRef({ value: 0 })
    const [isLoaded, setIsLoaded] = useState(false)
    const startRef = useRef(0)
    if (startRef.current === 0 && typeof performance !== 'undefined') {
        startRef.current = performance.now()
    }

    // Paint the bar straight to the DOM rather than through React state. GSAP
    // updates ~60x/s during the most load-sensitive window; routing each tick
    // through setState would queue ~90 renders and as many forced reflows,
    // inflating Total Blocking Time for no visual gain.
    const paintProgress = (value) => {
        if (barRef.current) {
            barRef.current.style.transform = `scaleX(${value / 100})`
        }
    }

    // Reveal as soon as the hero (LCP) image is ready. Waiting for the full
    // window `load` event holds the overlay hostage to every below-fold asset,
    // which is what pushed Speed Index to ~7s. A 2.5s timeout is the safety
    // net so the loader can never trap the page behind a stalled image.
    useEffect(() => {
        let done = false
        let minTimer = null
        const markLoaded = () => {
            if (done) return
            done = true
            const elapsed = performance.now() - startRef.current
            const wait = Math.max(MIN_VISIBLE_MS - elapsed, 0)
            minTimer = window.setTimeout(() => setIsLoaded(true), wait)
        }

        const heroImage = document.querySelector('.slide-visual')
        if (!heroImage || heroImage.complete || document.readyState === 'complete') {
            markLoaded()
        } else {
            heroImage.addEventListener('load', markLoaded)
            heroImage.addEventListener('error', markLoaded)
        }

        const timeoutId = window.setTimeout(markLoaded, 2500)

        return () => {
            if (heroImage) {
                heroImage.removeEventListener('load', markLoaded)
                heroImage.removeEventListener('error', markLoaded)
            }
            window.clearTimeout(timeoutId)
            if (minTimer !== null) window.clearTimeout(minTimer)
        }
    }, [])

    // Entrance cascade, then the fill. The mark arrives first, the wordmark
    // and subline follow it in, and the rule draws itself last — by which
    // point the lime fill is already running, so the bar tracks the real load
    // alongside the rest of the page rather than after it.
    //
    // The fill races to 90% and waits there: the final stretch is reserved
    // for the load signal, so the bar never claims to be done while the hero
    // image is still in flight.
    useEffect(() => {
        const loader = loaderRef.current
        if (!loader) return

        const markEl = loader.querySelector(".lockup-mark")
        const wordEl = loader.querySelector(".lockup-word")
        const subEl = loader.querySelector(".lockup-sub")
        const trackEl = loader.querySelector(".bar-track")

        const tl = gsap.timeline()

        tl.to(markEl, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
        })

        tl.to(
            wordEl,
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
            "-=0.25"
        )

        tl.to(
            subEl,
            { opacity: 0.6, y: 0, duration: 0.45, ease: "power3.out" },
            "-=0.32"
        )

        // The white rule draws out from its centre as the fill begins.
        tl.to(
            trackEl,
            { opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out" },
            "-=0.28"
        )

        tl.add(
            gsap.to(progressRef.current, {
                value: 90,
                duration: 1.6,
                ease: "power2.out",
                onUpdate: () => paintProgress(progressRef.current.value),
            }),
            "<"
        )

        barTweenRef.current = tl
        return () => tl.kill()
    }, [])

    // Exit choreography: the bar completes, the lockup lifts away, then the
    // two brand blocks wipe off the screen. `onReady` fires while the blocks
    // still cover everything, so the hero's entrance starts behind the
    // curtain rather than popping in after it.
    useEffect(() => {
        if (!isLoaded) return

        const loader = loaderRef.current
        if (!loader) return

        if (barTweenRef.current) barTweenRef.current.kill()

        CustomEase.create("hop", "0.9, 0, 0.1, 1")

        const lockupEl = loader.querySelector(".lockup")
        const trackEl = loader.querySelector(".bar-track")
        const blockEls = loader.querySelectorAll(".block")

        const remaining = 100 - progressRef.current.value
        const fillDuration = Math.max(0.25, Math.min(0.5, remaining / 150))

        const tl = gsap.timeline({ defaults: { ease: "hop" } })

        tl.to(progressRef.current, {
            value: 100,
            duration: fillDuration,
            ease: "power2.out",
            onUpdate: () => paintProgress(progressRef.current.value),
        })

        // Bar retires first, then the lockup lifts.
        tl.to(trackEl, {
            opacity: 0,
            y: -6,
            duration: 0.3,
            ease: "power2.out",
        })

        tl.to(
            lockupEl,
            {
                opacity: 0,
                y: -18,
                duration: 0.45,
            },
            "<0.08"
        )

        // Signal the hero to start while blocks still cover the screen.
        tl.call(() => { if (onReady) onReady() })

        tl.to(
            blockEls,
            {
                clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
                duration: 0.7,
                stagger: 0.08,
                delay: 0.1,
            },
            "<"
        )

        tl.set(loader, {
            display: "none",
            onComplete: () => {
                if (onComplete) onComplete()
            }
        })

        return () => {
            tl.kill()
        }
    }, [isLoaded, onReady, onComplete])

    return (
        <div
            ref={loaderRef}
            role="status"
            aria-live="polite"
            aria-label="Loading Energyflow"
            className="loader fixed top-0 left-0 w-full h-svh overflow-hidden z-[120] pointer-events-none"
        >
            <div className="overlay absolute top-0 w-full h-full flex">
                <div className="block w-full h-full bg-[var(--brand-primary)] [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%)]"></div>
                <div className="block w-full h-full bg-[var(--brand-primary)] [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%)]"></div>
            </div>

            {/* Centred lockup: mark, wordmark, then the progress rule beneath. */}
            <div className="lockup absolute inset-0 z-[2] flex flex-col items-center justify-center gap-7 will-change-transform">
                {/* Initial states are inline rather than Tailwind classes so
                    they're correct in the server-rendered HTML — a class GSAP
                    later overrides with a transform would fight it. */}
                <div className="flex flex-col items-center gap-3">
                    {/* Plain <img>: this sits on the critical path and needs no
                        optimisation hop or layout transform. */}
                    <img
                        src="/assets/images/hero/logo.png"
                        alt=""
                        width={88}
                        height={72}
                        className="lockup-mark h-auto w-[4.5rem] object-contain will-change-transform max-sm:w-16"
                        style={{ opacity: 0, transform: 'translateY(14px) scale(0.92)' }}
                    />
                    <span className="flex flex-col items-center leading-none">
                        <span
                            className="lockup-word font-header text-[1.75rem] text-white will-change-transform max-sm:text-2xl"
                            style={{ opacity: 0, transform: 'translateY(12px)' }}
                        >
                            Energyflow
                        </span>
                        <span
                            className="lockup-sub mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-white will-change-transform max-sm:text-[0.625rem]"
                            style={{ opacity: 0, transform: 'translateY(10px)' }}
                        >
                            Premium Dry Fruits &amp; Super Foods
                        </span>
                    </span>
                </div>

                <div
                    className="bar-track h-px w-40 overflow-hidden rounded-full bg-white/20 will-change-transform max-sm:w-32"
                    style={{ opacity: 0, transform: 'scaleX(0)' }}
                >
                    <div
                        ref={barRef}
                        className="h-full w-full origin-left bg-[var(--brand-lime)] will-change-transform"
                        style={{ transform: 'scaleX(0)' }}
                    />
                </div>
            </div>
        </div>
    )
}

export default PageLoader
