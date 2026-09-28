'use client'

import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import { tintAt } from './storefront/format'

gsap.registerPlugin(ScrollTrigger)

const AUTO_MS = 6000
const PAD = (n) => String(n).padStart(2, '0')

// Render exactly five stars, clamping the stored rating into the 0–5 range so a
// stray value never produces a broken row.
const clampRating = (rating) => Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))

const initials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') || '•'

const TestimonialClient = ({ testimonials = [], tone = 'page' }) => {
    const TOTAL = testimonials.length

    const [active, setActive] = useState(0)
    // Autoplay needs more than one slide, and is off entirely for users who
    // ask for reduced motion. Resolved after mount so SSR markup is stable.
    const [autoplay, setAutoplay] = useState(false)
    const activeRef = useRef(0)
    const sectionRef = useRef(null)
    const contentRef = useRef(null)
    const progressRef = useRef(null)
    const progressTweenRef = useRef(null)
    const timerRef = useRef(null)
    const isAnimatingRef = useRef(false)
    const pausedRef = useRef(false)
    const goToRef = useRef(null)

    useReveal(sectionRef)

    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setAutoplay(TOTAL > 1 && !reduce)
    }, [TOTAL])

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
        if (!autoplay || pausedRef.current) return
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
                if (autoplay && !pausedRef.current) startProgress()
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

    // Hovering or focusing the carousel holds the current review; leaving
    // restarts the cycle from a full interval.
    const pause = () => {
        if (!autoplay || pausedRef.current) return
        pausedRef.current = true
        clearInterval(timerRef.current)
        progressTweenRef.current?.pause()
    }
    const resume = (event) => {
        if (!autoplay || !pausedRef.current) return
        if (event?.type === 'blur' && event.currentTarget.contains(event.relatedTarget)) return
        pausedRef.current = false
        startProgress()
        startTimer()
    }

    // Defensive: never index past the array if the data shrank between renders.
    const item = testimonials[active] || testimonials[0]
    if (!item) return null

    const rating = clampRating(item.rating)
    const multi = TOTAL > 1

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby="reviews-title">
            <div className="grid gap-[var(--section-gap)] lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">

                {/* ── Heading + controls ── */}
                <div data-reveal className="flex flex-col items-start gap-4 lg:justify-between">
                    <div className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">Customer reviews</span>
                        <h2 id="reviews-title" className="ef-title">
                            What they <span className="ef-title__accent">say</span>
                        </h2>
                        <p className="ef-lead max-w-sm">Real words from the people who stock their kitchens with us.</p>
                    </div>

                    {multi && (
                        <div className="mt-2 flex w-full items-center justify-between gap-4 lg:mt-0">
                            <span className="font-medium text-ink-strong" aria-live="polite">
                                <span className="text-3xl tracking-[-0.02em] tabular-nums">{PAD(active + 1)}</span>
                                <span className="text-sm text-ink-muted"> / {PAD(TOTAL)}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    aria-label="Previous review"
                                    onClick={() => goTo((active - 1 + TOTAL) % TOTAL)}
                                    className="ef-icon-btn"
                                >
                                    <ArrowLeft aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="Next review"
                                    onClick={() => goTo((active + 1) % TOTAL)}
                                    className="ef-icon-btn"
                                >
                                    <ArrowRight aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Review card ── */}
                <div
                    data-reveal
                    className="ef-card overflow-hidden"
                    style={{ borderRadius: 'var(--radius-tile)' }}
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                    onFocus={pause}
                    onBlur={resume}
                >
                    <div className="relative flex flex-col gap-6 p-6 sm:p-10">
                        <span className="flex size-12 items-center justify-center rounded-full bg-amber text-brand-deep">
                            <Quote className="size-5 fill-current" aria-hidden="true" />
                        </span>

                        <div ref={contentRef} className="flex min-h-[15rem] flex-col justify-between gap-8 sm:min-h-[13rem]">
                            <blockquote className="m-0">
                                <p className="text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] font-medium leading-[1.55] tracking-[-0.01em] text-ink-strong">
                                    &ldquo;{item.review}&rdquo;
                                </p>
                            </blockquote>

                            <div className="flex items-center gap-3">
                                <span
                                    aria-hidden="true"
                                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-brand"
                                    style={{ background: tintAt(active) }}
                                >
                                    {initials(item.name)}
                                </span>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[0.9375rem] font-semibold text-ink-strong">{item.name}</p>
                                    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                aria-hidden="true"
                                                className={cn('size-3.5', i < rating ? 'fill-gold text-gold' : 'fill-line-soft text-line-strong')}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* progress — only meaningful while autoplay cycles slides */}
                    {autoplay && (
                        <div className="h-1 w-full bg-surface-well" aria-hidden="true">
                            <div ref={progressRef} className="h-full w-full origin-left scale-x-0 bg-brand" />
                        </div>
                    )}
                </div>
            </div>

            {/* dot navigation — hidden when there is only a single testimonial */}
            {multi && (
                <div className="mt-6 flex flex-wrap justify-center lg:justify-end">
                    {testimonials.map((t, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Go to review ${i + 1}${t?.name ? ` by ${t.name}` : ''}`}
                            aria-current={i === active ? 'true' : undefined}
                            onClick={() => goTo(i)}
                            className="ef-focus group flex h-8 min-w-8 items-center justify-center rounded-full px-1"
                        >
                            <span
                                className={cn(
                                    'h-1.5 rounded-full transition-all duration-300',
                                    i === active ? 'w-6 bg-brand' : 'w-1.5 bg-line-strong group-hover:bg-ink-muted'
                                )}
                            />
                        </button>
                    ))}
                </div>
            )}
        </Section>
    )
}

export default TestimonialClient
