'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const AUTO_MS = 6000
const PAD = (n) => String(n).padStart(2, '0')

// Render exactly five stars, clamping the stored rating into the 0–5 range so a
// stray value never produces a broken row.
const clampRating = (rating) => Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))

const TestimonialClient = ({ testimonials = [] }) => {
    const TOTAL = testimonials.length
    const autoplay = TOTAL > 1

    const [active, setActive] = useState(0)
    const activeRef = useRef(0)
    const sectionRef = useRef(null)
    const dividerRef = useRef(null)
    const headerRef = useRef(null)
    const bigQuoteRef = useRef(null)
    const contentRef = useRef(null)
    const progressRef = useRef(null)
    const progressTweenRef = useRef(null)
    const timerRef = useRef(null)
    const isAnimatingRef = useRef(false)
    const goToRef = useRef(null)

    useGSAP(() => {
        gsap.fromTo(
            [headerRef.current, bigQuoteRef.current],
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
                ease: 'power4.out',
                stagger: 0.1,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )
        gsap.fromTo(
            dividerRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
                scaleX: 1,
                duration: 1.2,
                ease: 'expo.inOut',
                delay: 0.12,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )
    }, { scope: sectionRef })

    const startProgress = useCallback(() => {
        if (!progressRef.current) return
        if (progressTweenRef.current) progressTweenRef.current.kill()
        gsap.set(progressRef.current, { scaleX: 0, transformOrigin: 'left center' })
        progressTweenRef.current = gsap.to(progressRef.current, {
            scaleX: 1,
            duration: AUTO_MS / 1000,
            ease: 'none',
        })
    }, [])

    const startTimer = useCallback(() => {
        clearInterval(timerRef.current)
        if (!autoplay) return
        timerRef.current = setInterval(() => {
            goToRef.current?.((activeRef.current + 1) % TOTAL)
        }, AUTO_MS)
    }, [autoplay, TOTAL])

    const goTo = useCallback((index) => {
        if (isAnimatingRef.current) return
        if (index === activeRef.current) return
        isAnimatingRef.current = true
        clearInterval(timerRef.current)

        gsap.to(contentRef.current, {
            autoAlpha: 0,
            y: -14,
            duration: 0.26,
            ease: 'power2.in',
            onComplete: () => {
                activeRef.current = index
                setActive(index)
                requestAnimationFrame(() => {
                    gsap.fromTo(
                        contentRef.current,
                        { autoAlpha: 0, y: 18 },
                        {
                            autoAlpha: 1,
                            y: 0,
                            duration: 0.45,
                            ease: 'power3.out',
                            onComplete: () => {
                                isAnimatingRef.current = false
                                startTimer()
                            },
                        }
                    )
                })
                if (autoplay) startProgress()
            },
        })
    }, [startProgress, startTimer, autoplay])

    useEffect(() => { goToRef.current = goTo }, [goTo])

    useEffect(() => {
        gsap.set(contentRef.current, { autoAlpha: 1 })
        if (autoplay) {
            startProgress()
            startTimer()
        }
        return () => {
            clearInterval(timerRef.current)
            if (progressTweenRef.current) progressTweenRef.current.kill()
        }
    }, [startProgress, startTimer, autoplay])

    // Defensive: never index past the array if the data shrank between renders.
    const item = testimonials[active] || testimonials[0]
    if (!item) return null

    const rating = clampRating(item.rating)

    return (
        <section ref={sectionRef} className="relative overflow-hidden bg-background website-gutter pt-20 lg:pt-28 pb-6 lg:pb-10">

            {/* decorative large quote */}
            <div
                ref={bigQuoteRef}
                aria-hidden
                className="pointer-events-none absolute -top-6 left-2 select-none font-neue text-[16rem] leading-none text-[var(--dark-red)]/20 lg:left-6 lg:text-[20rem]"
            >
                &ldquo;
            </div>

            {/* header */}
            <div ref={headerRef} className="relative mb-5 flex items-end justify-between">
                <div>
                    <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/50">
                        Customer Reviews
                    </p>
                    <h2 className="mt-1.5 font-neue text-[clamp(1.8rem,4.8vw,3.8rem)] font-medium uppercase text-[var(--dark-red-2)]">
                        What They Say
                    </h2>
                </div>
                <span className="font-neue text-[var(--dark-red)]">
                    <span className="text-2xl font-semibold sm:text-3xl">{PAD(active + 1)}</span>
                    <span className="text-sm"> / {PAD(TOTAL)}</span>
                </span>
            </div>

            {/* divider */}
            <div ref={dividerRef} className="mb-10 h-px w-full bg-[var(--dark-red)]/20" />

            {/* slide content */}
            <div ref={contentRef} className="relative min-h-[200px] lg:min-h-[160px]">
                <blockquote className="max-w">
                    <p className="font-neue text-[1.3rem] font-medium leading-[1.7] tracking-[0.01em] text-[var(--dark-red)] sm:text-[1.55rem] lg:text-[1.7rem]">
                        &ldquo;{item.review}&rdquo;
                    </p>
                </blockquote>

                <div className="mt-8 flex items-center gap-4">
                    <span className="h-px w-7 shrink-0 bg-[var(--dark-red)]/35" />
                    <div>
                        <p className="text-[1rem] font-semibold uppercase tracking-[0.08em] text-[var(--dark-red)]/80">
                            {item.name}
                        </p>
                        <div className="mt-1 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`size-3 ${i < rating ? 'fill-amber-500 text-amber-500' : 'fill-[var(--dark-red)]/20 text-[var(--dark-red)]/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* progress bar — only meaningful while autoplay cycles between slides */}
            {autoplay && (
                <div className="mt-10 h-px w-full bg-[var(--dark-red)]/10">
                    <div ref={progressRef} className="h-full w-full origin-left bg-[var(--dark-red)]/35" />
                </div>
            )}

            {/* bottom nav — hidden when there is only a single testimonial */}
            {autoplay && (
                <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Go to review ${i + 1}`}
                                aria-current={i === active}
                                onClick={() => goTo(i)}
                                className="group flex h-6 min-w-6 items-center justify-center px-0.5"
                            >
                                <span
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === active ? 'w-6 bg-[var(--dark-red)]' : 'w-1.5 bg-[var(--dark-red)]/25 group-hover:bg-[var(--dark-red)]/45'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            aria-label="Previous review"
                            onClick={() => goTo((active - 1 + TOTAL) % TOTAL)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dark-red)]/25 text-[var(--dark-red)]/55 transition hover:border-[var(--dark-red)]/60 hover:text-[var(--dark-red)]"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next review"
                            onClick={() => goTo((active + 1) % TOTAL)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--dark-red)]/25 text-[var(--dark-red)]/55 transition hover:border-[var(--dark-red)]/60 hover:text-[var(--dark-red)]"
                        >
                            <ArrowRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}

export default TestimonialClient
