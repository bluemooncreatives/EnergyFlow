'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, ArrowRight, Pause, Play, Quote, Star } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn, initialsOf } from '@/lib/utils'
import Section from './storefront/Section'
import { tintAt } from './storefront/format'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Tuning.
const AUTO_S = 7          // seconds each review holds while autoplaying
const DEPTH = 2           // cards fanned out behind the front one
const PEEK_PX = 14        // how far each card behind rises above the one in front
const SWIPE_PX = 60       // drag distance that commits to a change
const FLING = 0.5         // px/ms — a quick flick commits even when short
const MAX_CHIPS = 8       // past this, the name list gets too long to scan
const AVATARS = 4

const PAD = (n) => String(n).padStart(2, '0')

// Render exactly five stars, clamping the stored rating into the 0–5 range so a
// stray value never produces a broken row.
const clampRating = (rating) => Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))

const depthOf = (index, active, count) => (index - active + count) % count

// Resting pose for a card `depth` places behind the front one. Cards past
// DEPTH wait, invisible, at the back of the deck.
const slot = (depth) => {
    const d = Math.min(depth, DEPTH + 1)
    return {
        x: 0,
        xPercent: 0,
        y: -d * PEEK_PX,
        scale: 1 - d * 0.05,
        rotation: d === 0 ? 0 : d % 2 ? 2.4 : -1.8,
        autoAlpha: depth > DEPTH ? 0 : 1,
    }
}

// Word-by-word rise for the quote on the front card.
const wordsIn = (words) => ({
    yPercent: 70,
    autoAlpha: 0,
    duration: 0.55,
    ease: 'power3.out',
    stagger: { amount: Math.min(0.6, words.length * 0.022) },
})

const Stars = ({ value }) => (
    <div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                aria-hidden="true"
                className={cn('size-4', i < value ? 'fill-gold text-gold' : 'fill-line-soft text-line-strong')}
            />
        ))}
    </div>
)

// One review in the deck. Every card is in the server HTML (and stacked in the
// same grid cell, so the deck is always as tall as the longest review and
// never shifts layout between slides); only the front one is exposed to
// assistive tech and the tab order.
const ReviewCard = ({ item, index, count, front, setRef }) => {
    const words = String(item.review).trim().split(/\s+/)
    const last = words.length - 1

    return (
        <article
            ref={setRef}
            aria-hidden={!front}
            inert={!front}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            className="relative col-start-1 row-start-1 flex flex-col justify-between gap-7 rounded-[var(--radius-tile)] p-6 shadow-elev-2 ring-1 ring-inset ring-line-soft sm:gap-9 sm:p-9 lg:p-10"
            // zIndex is fixed per card so React never rewrites it; GSAP owns
            // the stacking order once the deck is live.
            style={{ background: tintAt(index), zIndex: count - index }}
        >
            <div className="flex items-center justify-between gap-4">
                <Stars value={clampRating(item.rating)} />
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber text-brand-deep sm:size-12">
                    <Quote className="size-5 fill-current" aria-hidden="true" />
                </span>
            </div>

            <blockquote className="m-0">
                <p className="text-[clamp(1.0625rem,0.95rem+0.6vw,1.5rem)] font-medium leading-[1.55] tracking-[-0.01em] text-ink-strong">
                    <span className="sr-only">{item.review}</span>
                    <span aria-hidden="true">
                        {words.map((word, k) => (
                            <Fragment key={k}>
                                <span data-word className="inline-block">
                                    {k === 0 && '“'}{word}{k === last && '”'}
                                </span>{' '}
                            </Fragment>
                        ))}
                    </span>
                </p>
            </blockquote>

            <footer className="flex items-center gap-3 border-t border-line-soft pt-5">
                <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-card text-sm font-semibold text-brand"
                >
                    {initialsOf(item.name)}
                </span>
                <p className="min-w-0 truncate text-[0.9375rem] font-semibold text-ink-strong">{item.name}</p>
                <span aria-hidden="true" className="ml-auto font-header text-sm tabular-nums text-ink-muted">
                    {PAD(index + 1)}
                </span>
            </footer>
        </article>
    )
}

const TestimonialClient = ({ testimonials = [], tone = 'page' }) => {
    const items = testimonials.filter((item) => item?.review && item?.name)
    const count = items.length
    const multi = count > 1

    const [active, setActive] = useState(0)
    // Autoplay needs more than one slide and is off entirely for users who
    // ask for reduced motion. Resolved after mount so SSR markup is stable.
    const [autoplay, setAutoplay] = useState(false)
    const [paused, setPaused] = useState(false)
    // Screen-reader announcement, set only on shopper-initiated changes so
    // autoplay never talks over the page.
    const [announce, setAnnounce] = useState('')

    const sectionRef = useRef(null)
    const deckRef = useRef(null)
    const cardsRef = useRef([])
    const barRef = useRef(null)
    const glyphRef = useRef(null)
    const activeRef = useRef(0)
    const introRef = useRef(null)
    const tlRef = useRef(null)
    const clockRef = useRef(null)      // the progress-bar tween doubles as the autoplay timer
    const holdsRef = useRef(new Set()) // reasons autoplay is held: hover, focus, view, drag, user
    const reduceRef = useRef(false)
    const dragRef = useRef(null)
    const stepRef = useRef(null)

    useReveal(sectionRef)

    // Autoplay runs only while nothing holds it.
    const syncClock = () => {
        const clock = clockRef.current
        if (!clock) return
        if (holdsRef.current.size) clock.pause()
        else clock.resume()
    }
    const hold = (reason) => { holdsRef.current.add(reason); syncClock() }
    const release = (reason) => { holdsRef.current.delete(reason); syncClock() }

    const { contextSafe } = useGSAP(() => {
        const cards = cardsRef.current.slice(0, count)
        const deck = deckRef.current
        if (!cards.length || !deck) return

        const mm = gsap.matchMedia()
        mm.add(
            {
                // Always true, so the setup runs whatever the other two say.
                all: '(min-width: 0px)',
                reduce: '(prefers-reduced-motion: reduce)',
                fine: '(hover: hover) and (pointer: fine)',
            },
            ({ conditions }) => {
                const { reduce, fine } = conditions
                reduceRef.current = reduce

                gsap.set(cards, { transformOrigin: '50% 0%' })
                cards.forEach((card, i) => {
                    const depth = depthOf(i, activeRef.current, count)
                    gsap.set(card, { ...slot(depth), zIndex: count - depth })
                })

                if (reduce) {
                    if (barRef.current) gsap.set(barRef.current, { scaleX: (activeRef.current + 1) / count })
                    return
                }

                // Intro: the fanned cards deal in back-to-front, then the
                // front quote rises word by word.
                const front = cards[activeRef.current]
                const dealt = cards.filter((_, i) => depthOf(i, activeRef.current, count) <= DEPTH).reverse()
                const frontWords = front.querySelectorAll('[data-word]')
                const intro = gsap.timeline({ paused: true })
                    .from(dealt, { y: 70, rotation: 0, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 })
                    .from(frontWords, wordsIn(frontWords), '-=0.45')
                introRef.current = intro

                // Already on screen (restored scroll, late hydration): play now
                // rather than wait on a trigger that has already passed.
                if (deck.getBoundingClientRect().top < window.innerHeight * 0.85) intro.play()
                else ScrollTrigger.create({ trigger: deck, start: 'top 85%', once: true, onEnter: () => intro.play() })

                // Oversized quote mark drifts against the scroll.
                if (glyphRef.current) {
                    gsap.fromTo(glyphRef.current, { yPercent: 18 }, {
                        yPercent: -18,
                        ease: 'none',
                        scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
                    })
                }

                const cleanups = []

                if (multi && barRef.current) {
                    clockRef.current = gsap.fromTo(barRef.current, { scaleX: 0 }, {
                        scaleX: 1,
                        duration: AUTO_S,
                        ease: 'none',
                        paused: true,
                        onComplete: () => stepRef.current?.(1, -1, false),
                    })

                    // Only tick while the section is actually on screen.
                    const view = ScrollTrigger.create({
                        trigger: sectionRef.current,
                        start: 'top bottom',
                        end: 'bottom top',
                        onToggle: (self) => (self.isActive ? release('view') : hold('view')),
                    })
                    if (view.isActive) holdsRef.current.delete('view')
                    else holdsRef.current.add('view')
                    clockRef.current.play()
                    syncClock()
                    setAutoplay(true)
                    cleanups.push(() => {
                        clockRef.current = null
                        setAutoplay(false)
                    })
                }

                // Desktop: the deck leans toward the pointer.
                if (fine) {
                    gsap.set(deck, { transformPerspective: 1100 })
                    const tiltX = gsap.quickTo(deck, 'rotationX', { duration: 0.6, ease: 'power3.out' })
                    const tiltY = gsap.quickTo(deck, 'rotationY', { duration: 0.6, ease: 'power3.out' })
                    let rect = null
                    const onEnter = () => { rect = deck.getBoundingClientRect() }
                    const onMove = (event) => {
                        if (dragRef.current?.on) return
                        rect ??= deck.getBoundingClientRect()
                        tiltY(((event.clientX - rect.left) / rect.width - 0.5) * 6)
                        tiltX(-((event.clientY - rect.top) / rect.height - 0.5) * 6)
                    }
                    const onLeave = () => { rect = null; tiltX(0); tiltY(0) }
                    deck.addEventListener('pointerenter', onEnter)
                    deck.addEventListener('pointermove', onMove)
                    deck.addEventListener('pointerleave', onLeave)
                    cleanups.push(() => {
                        deck.removeEventListener('pointerenter', onEnter)
                        deck.removeEventListener('pointermove', onMove)
                        deck.removeEventListener('pointerleave', onLeave)
                    })
                }

                return () => cleanups.forEach((fn) => fn())
            }
        )
    }, { scope: sectionRef, dependencies: [count] })

    // Move the deck to `to`. `dir` is 1 for forward (the front card is thrown
    // off toward `side`) and -1 for back (the incoming card flies in from `side`).
    const go = contextSafe((to, { dir = 1, side = -1, user = false } = {}) => {
        const from = activeRef.current
        if (!multi || to === from) return
        const cards = cardsRef.current.slice(0, count)

        introRef.current?.progress(1)
        tlRef.current?.progress(1)
        activeRef.current = to
        setActive(to)
        if (user) setAnnounce(`Review ${to + 1} of ${count}, from ${items[to].name}`)

        if (reduceRef.current) {
            cards.forEach((card, i) => {
                const depth = depthOf(i, to, count)
                gsap.set(card, { ...slot(depth), zIndex: count - depth })
            })
            if (barRef.current) gsap.set(barRef.current, { scaleX: (to + 1) / count })
            return
        }

        const tl = gsap.timeline({ defaults: { duration: 0.75, ease: 'power3.out' } })
        cards.forEach((card, i) => {
            const depth = depthOf(i, to, count)
            const rest = slot(depth)

            if (dir > 0 && i === from) {
                gsap.set(card, { zIndex: count + 1 })
                tl.to(card, { xPercent: side * 75, rotation: side * 12, autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, 0)
                    .set(card, { ...rest, autoAlpha: 0, zIndex: count - depth })
                    .to(card, { autoAlpha: rest.autoAlpha, duration: 0.35 })
                return
            }
            if (dir < 0 && i === to) {
                gsap.set(card, { ...slot(0), xPercent: side * 75, rotation: side * 12, autoAlpha: 0, zIndex: count + 1 })
                tl.to(card, { ...slot(0), duration: 0.8 }, 0.05).set(card, { zIndex: count })
                return
            }
            gsap.set(card, { zIndex: count - depth })
            tl.to(card, rest, 0.1)
        })

        const words = cards[to].querySelectorAll('[data-word]')
        tl.from(words, wordsIn(words), 0.3)
        tlRef.current = tl

        const clock = clockRef.current
        if (clock) {
            clock.restart()
            syncClock()
        }
    })

    const step = (dir, side = -1, user = true) => {
        const to = (activeRef.current + dir + count) % count
        go(to, { dir, side, user })
    }
    useEffect(() => { stepRef.current = step })

    const jump = (to) => go(to, { dir: to > activeRef.current ? 1 : -1, user: true })

    const togglePause = () => {
        if (paused) release('user')
        else hold('user')
        setPaused(!paused)
    }

    // ── Swipe / drag: the front card follows the pointer, then either flies
    // off (past SWIPE_PX or on a quick flick) or springs back. Vertical
    // movement is left to the page (touch-action: pan-y).
    const onPointerDown = (event) => {
        if (!multi || event.button > 0) return
        dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lx: event.clientX, lt: event.timeStamp, v: 0, on: false }
    }

    const onPointerMove = contextSafe((event) => {
        const drag = dragRef.current
        if (!drag || drag.id !== event.pointerId) return
        const dx = event.clientX - drag.x
        const dy = event.clientY - drag.y

        if (!drag.on) {
            if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return }
            if (Math.abs(dx) < 8) return
            drag.on = true
            deckRef.current?.setPointerCapture?.(event.pointerId)
            introRef.current?.progress(1)
            tlRef.current?.progress(1)
            hold('drag')
        }

        const dt = event.timeStamp - drag.lt
        if (dt > 0) drag.v = (event.clientX - drag.lx) / dt
        drag.lx = event.clientX
        drag.lt = event.timeStamp
        gsap.set(cardsRef.current[activeRef.current], { x: dx, rotation: dx * 0.04 })
    })

    const onPointerUp = contextSafe((event) => {
        const drag = dragRef.current
        dragRef.current = null
        if (!drag?.on) return
        release('drag')

        const dx = event.clientX - drag.x
        const commit = event.type === 'pointerup' && (Math.abs(dx) > SWIPE_PX || Math.abs(drag.v) > FLING)
        if (commit) {
            if ((dx || drag.v) < 0) step(1, -1)
            else step(-1, -1)
            return
        }

        const card = cardsRef.current[activeRef.current]
        if (reduceRef.current) gsap.set(card, { x: 0, rotation: 0 })
        else gsap.to(card, { x: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)' })
    })

    const onKeyDown = (event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
        else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
    }

    if (!count) return null

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby="reviews-title" className="overflow-clip">
            <span
                ref={glyphRef}
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-[3%] select-none font-header text-[clamp(12rem,32vw,28rem)] font-semibold leading-none text-ink-strong opacity-[0.05]"
            >
                &ldquo;
            </span>

            <div className="relative grid grid-cols-1 items-center gap-[var(--section-gap)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 xl:gap-24">

                {/* ── Heading, social proof, names ── */}
                <div className="flex flex-col items-start gap-4">
                    <span data-reveal className="ef-eyebrow">Customer reviews</span>
                    <h2 data-reveal id="reviews-title" className="ef-title">
                        What they <span className="ef-title__accent">say</span>
                    </h2>
                    <p data-reveal className="ef-lead max-w-sm">Real words from the people who stock their kitchens with us.</p>

                    <div data-reveal className="mt-1 flex items-center gap-3">
                        <div className="flex -space-x-2" aria-hidden="true">
                            {items.slice(0, AVATARS).map((item, i) => (
                                <span
                                    key={item._id || i}
                                    className="grid size-9 place-items-center rounded-full text-[0.6875rem] font-semibold text-brand ring-2 ring-[var(--section-bg)]"
                                    style={{ background: tintAt(i) }}
                                >
                                    {initialsOf(item.name)}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-ink-muted">
                            <strong className="font-semibold text-ink-strong">{count}</strong>{' '}
                            {count === 1 ? 'customer' : 'customers'} in their own words
                        </p>
                    </div>

                    {multi && count <= MAX_CHIPS && (
                        <ul data-reveal className="mt-4 hidden list-none flex-wrap gap-2 p-0 lg:flex">
                            {items.map((item, i) => (
                                <li key={item._id || i}>
                                    <button
                                        type="button"
                                        onClick={() => jump(i)}
                                        aria-current={i === active ? 'true' : undefined}
                                        aria-label={`Show review by ${item.name}`}
                                        className={cn(
                                            'ef-focus inline-flex max-w-[12rem] items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-medium transition-colors duration-300 motion-reduce:transition-none',
                                            i === active
                                                ? 'bg-brand text-on-brand'
                                                : 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft hover:ring-line-strong'
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="grid size-7 shrink-0 place-items-center rounded-full text-[0.625rem] font-semibold text-brand"
                                            style={{ background: tintAt(i) }}
                                        >
                                            {initialsOf(item.name)}
                                        </span>
                                        <span className="truncate">{item.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Review deck ── */}
                <div
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Customer reviews"
                    className="min-w-0"
                    onPointerEnter={(event) => event.pointerType === 'mouse' && hold('hover')}
                    onPointerLeave={(event) => event.pointerType === 'mouse' && release('hover')}
                    onFocus={(event) => event.target.matches(':focus-visible') && hold('focus')}
                    onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && release('focus')}
                >
                    <div
                        ref={deckRef}
                        role={multi ? 'group' : undefined}
                        tabIndex={multi ? 0 : undefined}
                        aria-label={multi ? `Review ${active + 1} of ${count}. Use the arrow keys to browse.` : undefined}
                        onKeyDown={multi ? onKeyDown : undefined}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        className={cn(
                            'ef-focus grid rounded-[var(--radius-tile)] pt-10',
                            multi && 'cursor-grab touch-pan-y select-none active:cursor-grabbing'
                        )}
                    >
                        {items.map((item, i) => (
                            <ReviewCard
                                key={item._id || i}
                                item={item}
                                index={i}
                                count={count}
                                front={i === active}
                                setRef={(el) => { cardsRef.current[i] = el }}
                            />
                        ))}
                    </div>

                    {multi && (
                        <div data-reveal className="mt-7 flex items-center gap-4 sm:gap-6">
                            <span className="shrink-0 font-medium tabular-nums text-ink-strong" aria-hidden="true">
                                <span className="text-2xl tracking-[-0.02em] sm:text-3xl">{PAD(active + 1)}</span>
                                <span className="text-sm text-ink-muted"> / {PAD(count)}</span>
                            </span>

                            {/* Fills over AUTO_S while autoplaying; shows position otherwise. */}
                            <div className="relative h-[3px] min-w-0 flex-1 overflow-hidden rounded-full bg-line-strong" aria-hidden="true">
                                <div
                                    ref={barRef}
                                    className="absolute inset-0 origin-left rounded-full bg-brand"
                                    style={{ transform: `scaleX(${1 / count})` }}
                                />
                            </div>

                            <div className="flex shrink-0 gap-2">
                                {autoplay && (
                                    <button
                                        type="button"
                                        onClick={togglePause}
                                        aria-label={paused ? 'Play reviews' : 'Pause reviews'}
                                        className="ef-icon-btn min-h-11 min-w-11"
                                    >
                                        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                                    </button>
                                )}
                                <button type="button" onClick={() => step(-1)} aria-label="Previous review" className="ef-icon-btn min-h-11 min-w-11">
                                    <ArrowLeft aria-hidden="true" />
                                </button>
                                <button type="button" onClick={() => step(1)} aria-label="Next review" className="ef-icon-btn min-h-11 min-w-11">
                                    <ArrowRight aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {multi && (
                        <p className="mt-3 hidden text-[0.8125rem] text-ink-muted [@media(pointer:coarse)]:block">
                            Swipe the card to see more reviews
                        </p>
                    )}

                    <p className="sr-only" aria-live="polite" aria-atomic="true">{announce}</p>
                </div>
            </div>
        </Section>
    )
}

export default TestimonialClient
