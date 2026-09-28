'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Tuning. Speeds are px per 60fps frame.
const SCROLL_GAIN = 0.35   // extra speed per px the page scrolled that frame
const MAX_BOOST = 14
const MAX_SKEW = 7         // deg, showcase only
const DRAG_START_PX = 6    // movement before a press becomes a drag
const FRICTION = 0.94      // share of fling speed kept per frame
const MAX_FLING = 40

const EDGE_FADE = 'linear-gradient(to right, transparent, #000 6%, #000 94%, transparent)'
const TILTS = [-6, 5, -3, 7, -5]

export const usePrefersReducedMotion = () => {
    const [reduced, setReduced] = useState(false)

    useIsoLayoutEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setReduced(mq.matches)
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [])

    return reduced
}

// Ticker: a phrase followed by a small cut-out (or a dot) as the separator.
const TickerItem = ({ item }) => (
    <li data-marquee-item className="flex shrink-0 items-center">
        <span className="whitespace-nowrap text-[1.25rem] font-medium leading-none tracking-[-0.01em] sm:text-[1.75rem] sm:tracking-[-0.02em]">
            {item.label}
        </span>
        {item.image ? (
            <Image
                src={item.image}
                alt=""
                sizes="96px"
                draggable={false}
                className="mx-5 h-10 w-auto shrink-0 drop-shadow-[0_6px_10px_rgb(0_0_0/0.25)] sm:mx-7 sm:h-14"
            />
        ) : (
            <span aria-hidden="true" className="mx-5 size-2 shrink-0 rounded-full bg-amber sm:mx-7" />
        )}
    </li>
)

const Sparkle = () => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mx-[clamp(1.25rem,3vw,3.5rem)] size-[clamp(1.25rem,0.9rem+1.2vw,2.25rem)] shrink-0 text-amber"
    >
        <path fill="currentColor" d="M12 0c.9 6.4 5.6 11.1 12 12-6.4.9-11.1 5.6-12 12-.9-6.4-5.6-11.1-12-12C6.4 11.1 11.1 6.4 12 0Z" />
    </svg>
)

// Showcase: a large product cut-out and its name, linking into the shop.
const ShowcaseItem = ({ item, index }) => (
    <li data-marquee-item className="flex shrink-0 items-center">
        <Link
            href={item.href}
            draggable={false}
            className="ef-focus group/item flex items-center gap-[clamp(0.75rem,1.5vw,1.75rem)] rounded-[var(--radius-card)] px-2"
        >
            <Image
                src={item.image}
                alt=""
                sizes="(max-width: 640px) 160px, 280px"
                draggable={false}
                style={{ '--tilt': `${TILTS[index % TILTS.length]}deg` }}
                className="h-[clamp(4.5rem,2.5rem+7vw,9.5rem)] w-auto shrink-0 rotate-(--tilt) drop-shadow-[0_18px_22px_rgb(8_58_47/0.18)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover/item:rotate-0 group-hover/item:scale-[1.08] motion-reduce:transition-none"
            />
            <span className="whitespace-nowrap text-[clamp(2.25rem,1.2rem+4.2vw,6rem)] font-medium leading-none tracking-[-0.04em] text-ink-strong transition-colors duration-300 group-hover/item:text-brand">
                {item.label}
            </span>
            <span
                aria-hidden="true"
                className="flex size-[clamp(2.25rem,1.6rem+1.6vw,3.25rem)] shrink-0 -translate-x-2 items-center justify-center rounded-full bg-brand text-white opacity-0 transition duration-300 group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100 motion-reduce:transition-none"
            >
                <ArrowUpRight className="size-1/2" />
            </span>
        </Link>
        <Sparkle />
    </li>
)

// Infinite marquee. One set of `items` is repeated just enough times to cover
// the viewport plus one set to wrap into, and a GSAP ticker moves the track
// with the offset wrapped to a single set's width, so the loop never jumps.
//
//   • Scroll-linked: page scrolling speeds it up, and with `followScroll` the
//     direction follows the scroll direction (showcase also leans into it).
//   • Hover (mouse) and the `paused` prop ease it to a stop.
//   • Drag / swipe scrubs it with a fling on release; vertical swipes still
//     scroll the page (touch-action: pan-y), and a drag never fires a link.
//   • Keyboard focus on a link parks that item in view until focus leaves.
//     Only the first set is exposed; the repeats are aria-hidden and inert.
//   • Stops when off screen. Reduced motion gets one set as a plain
//     horizontally scrollable row.
//
// `items`: [{ label, image?, href? }] — `image` is a static image import;
// showcase items need `href` and `image`.
const Marquee = ({
    items = [],
    variant = 'ticker',
    label,
    speed = 1,
    reverse = false,
    followScroll = true,
    paused = false,
    className,
}) => {
    const viewportRef = useRef(null)
    const trackRef = useRef(null)
    const groupRef = useRef(null)
    const widthRef = useRef(0)
    const pausedRef = useRef(paused)
    const [copies, setCopies] = useState(2)
    const reduced = usePrefersReducedMotion()
    const showcase = variant === 'showcase'
    const Item = showcase ? ShowcaseItem : TickerItem

    useEffect(() => {
        pausedRef.current = paused
    }, [paused])

    // Track one set's width, and render enough sets to fill the viewport.
    useEffect(() => {
        const group = groupRef.current
        const viewport = viewportRef.current
        if (!group || !viewport || typeof ResizeObserver === 'undefined') return

        const measure = () => {
            const width = group.offsetWidth
            widthRef.current = width
            if (width) setCopies(Math.max(2, Math.ceil(viewport.offsetWidth / width) + 1))
        }
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(group)
        ro.observe(viewport)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (reduced) return
        const viewport = viewportRef.current
        const track = trackRef.current
        if (!viewport || !track) return

        const setX = gsap.quickSetter(track, 'x', 'px')
        const setSkew = showcase ? gsap.quickSetter(track, 'skewX', 'deg') : null
        const base = reverse ? 1 : -1

        let x = 0
        let direction = 1
        let boost = 0
        let throttle = 1
        let skew = 0
        let momentum = 0
        let lastScroll = window.scrollY
        let running = false
        const hold = { hover: false, focus: false }
        const drag = { id: null, axis: null, startX: 0, startY: 0, lastX: 0, lastT: 0, velocity: 0, moved: false }

        const wrap = (value) => (widthRef.current ? gsap.utils.wrap(-widthRef.current, 0, value) : 0)
        const ease = (from, to, rate, frames) => from + (to - from) * Math.min(1, rate * frames)

        const tick = (_time, deltaTime) => {
            const frames = Math.min(deltaTime, 64) / (1000 / 60)

            const scrollY = window.scrollY
            const scrolled = scrollY - lastScroll
            lastScroll = scrollY
            if (followScroll && scrolled) direction = scrolled > 0 ? 1 : -1
            boost = ease(boost, Math.min(Math.abs(scrolled) * SCROLL_GAIN, MAX_BOOST), 0.1, frames)
            throttle = ease(throttle, hold.hover || pausedRef.current ? 0 : 1, 0.08, frames)

            const dragging = drag.axis === 'x'
            if (!hold.focus) {
                if (!dragging) {
                    if (Math.abs(momentum) > 0.05) {
                        x += momentum * frames
                        momentum *= Math.pow(FRICTION, frames)
                    } else {
                        momentum = 0
                    }
                    x += base * direction * (speed + boost) * throttle * frames
                }
                x = wrap(x)
                setX(x)
            }

            if (setSkew) {
                const flow = base * direction * boost * throttle + (dragging ? drag.velocity : momentum)
                skew = ease(skew, gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, flow * 0.45), 0.12, frames)
                setSkew(Math.abs(skew) < 0.01 ? 0 : skew)
            }
        }

        const start = () => {
            if (running) return
            running = true
            lastScroll = window.scrollY
            gsap.ticker.add(tick)
        }
        const stop = () => {
            if (!running) return
            running = false
            gsap.ticker.remove(tick)
        }
        const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
        io.observe(viewport)

        // ── Hover ──
        const onPointerEnter = (e) => { if (e.pointerType === 'mouse') hold.hover = true }
        const onPointerLeave = (e) => { if (e.pointerType === 'mouse') hold.hover = false }

        // ── Drag / swipe ──
        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return
            Object.assign(drag, {
                id: e.pointerId, axis: null,
                startX: e.clientX, startY: e.clientY,
                lastX: e.clientX, lastT: e.timeStamp,
                velocity: 0, moved: false,
            })
        }
        const onPointerMove = (e) => {
            if (e.pointerId !== drag.id) return
            if (!drag.axis) {
                const dx = e.clientX - drag.startX
                const dy = e.clientY - drag.startY
                if (Math.hypot(dx, dy) < DRAG_START_PX) return
                drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
                if (drag.axis !== 'x') return
                drag.moved = true
                momentum = 0
                viewport.setPointerCapture(e.pointerId)
                viewport.dataset.dragging = ''
            }
            if (drag.axis !== 'x') return
            const step = e.clientX - drag.lastX
            const frames = Math.max(1, e.timeStamp - drag.lastT) / (1000 / 60)
            drag.velocity = drag.velocity * 0.6 + (step / frames) * 0.4
            drag.lastX = e.clientX
            drag.lastT = e.timeStamp
            x += step
        }
        const onPointerEnd = (e) => {
            if (e.pointerId !== drag.id) return
            if (drag.axis === 'x') {
                // A press held still before release is a stop, not a fling.
                const idle = e.timeStamp - drag.lastT > 80
                momentum = idle ? 0 : gsap.utils.clamp(-MAX_FLING, MAX_FLING, drag.velocity)
                delete viewport.dataset.dragging
            }
            if (viewport.hasPointerCapture?.(e.pointerId)) viewport.releasePointerCapture(e.pointerId)
            drag.id = null
            drag.axis = null
        }
        // A drag that ends over a link must not open it.
        const onClickCapture = (e) => {
            if (!drag.moved) return
            e.preventDefault()
            e.stopPropagation()
            drag.moved = false
        }
        const onDragStart = (e) => e.preventDefault()

        // ── Keyboard focus: park the focused item in view ──
        const onFocusIn = (e) => {
            const item = e.target.closest?.('[data-marquee-item]')
            if (!item || !e.target.matches?.(':focus-visible')) return
            hold.focus = true
            momentum = 0
            x = Math.min(24, 24 - item.offsetLeft)
            setX(x)
        }
        const onFocusOut = (e) => {
            if (!track.contains(e.relatedTarget)) hold.focus = false
        }

        const listeners = [
            ['pointerenter', onPointerEnter],
            ['pointerleave', onPointerLeave],
            ['pointerdown', onPointerDown],
            ['pointermove', onPointerMove],
            ['pointerup', onPointerEnd],
            ['pointercancel', onPointerEnd],
            ['click', onClickCapture, true],
            ['dragstart', onDragStart],
            ['focusin', onFocusIn],
            ['focusout', onFocusOut],
        ]
        listeners.forEach(([type, fn, capture]) => viewport.addEventListener(type, fn, capture))

        return () => {
            stop()
            io.disconnect()
            listeners.forEach(([type, fn, capture]) => viewport.removeEventListener(type, fn, capture))
            delete viewport.dataset.dragging
            gsap.set(track, { clearProps: 'transform' })
        }
    }, [reduced, showcase, speed, reverse, followScroll])

    const sets = reduced ? 1 : copies

    return (
        <div
            ref={viewportRef}
            className={cn(
                'relative',
                showcase ? 'py-6' : 'py-1',
                reduced ? 'no-scrollbar overflow-x-auto' : 'touch-pan-y overflow-hidden',
                !reduced && showcase && 'cursor-grab data-dragging:cursor-grabbing',
                className
            )}
            style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
        >
            <div ref={trackRef} className="relative flex w-max select-none will-change-transform">
                {Array.from({ length: sets }, (_, set) => (
                    <ul
                        key={set}
                        ref={set === 0 ? groupRef : undefined}
                        aria-label={set === 0 ? label : undefined}
                        aria-hidden={set > 0 || undefined}
                        inert={set > 0 || undefined}
                        className="m-0 flex shrink-0 list-none p-0"
                    >
                        {items.map((item, i) => (
                            <Item key={item.label} item={item} index={i} />
                        ))}
                    </ul>
                ))}
            </div>
        </div>
    )
}

export default Marquee
