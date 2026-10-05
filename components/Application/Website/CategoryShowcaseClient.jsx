'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import { WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import { StoreLink } from './storefront/StoreButton'
import RailPager from './storefront/RailPager'
import { formatINR } from './storefront/format'
import { formatProductName } from '@/lib/seo'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const PANEL_COUNT = 4
const GROW_ACTIVE = 2.8   // flex-grow of the hovered panel …
const GROW_REST = 0.8     // … and of the others while one is open

// Clear space between the count chip and the cut edge, in px. Every curve in
// the notch uses the card's own corner radius (--radius-control, 8px), so the
// cut, the chip and the card corners all share one radius.
const NOTCH_GAP = 8

// SVG path for a W×H card with radius-R corners and a notch cut out of the
// top-right corner, nw wide and nh tall. Clockwise from the top-left:
//   top edge → convex curve down into the notch → notch side → concave
//   fillet → notch floor → convex corner → right edge → bottom → left edge.
// Arc sweep 1 = convex (clockwise on screen), 0 = the concave inner fillet.
const notchPath = (W, H, nw, nh, R, r) => {
    const x0 = W - nw // notch's left wall
    const y0 = nh     // notch's floor
    const f = Math.max(0, Math.min(r, nh / 2, (W - nw - R) / 2))
    const c = Math.max(0, Math.min(R, (H - nh) / 2))
    return [
        `M 0 ${R}`,
        `A ${R} ${R} 0 0 1 ${R} 0`,
        `H ${x0 - f}`,
        `A ${f} ${f} 0 0 1 ${x0} ${f}`,
        `V ${y0 - f}`,
        `A ${f} ${f} 0 0 0 ${x0 + f} ${y0}`,
        `H ${W - c}`,
        `A ${c} ${c} 0 0 1 ${W} ${y0 + c}`,
        `V ${H - R}`,
        `A ${R} ${R} 0 0 1 ${W - R} ${H}`,
        `H ${R}`,
        `A ${R} ${R} 0 0 1 0 ${H - R}`,
        'Z',
    ].join(' ')
}

// Keeps the card's clip-path cut exactly around the chip. The cards resize
// continuously (swipe width on phones, the flex-grow tween on desktop), so a
// ResizeObserver recomputes the path in px and writes it straight to the
// element — no React re-render per frame.
const useNotchClip = (panelRef, cardRef, chipRef) => {
    useEffect(() => {
        const panel = panelRef.current
        const card = cardRef.current
        const chip = chipRef.current
        if (!panel || !card || !chip) return

        const update = () => {
            const W = panel.clientWidth
            const H = panel.clientHeight
            if (!W || !H) return
            const R = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 12
            const nw = chip.offsetWidth + NOTCH_GAP
            const nh = chip.offsetHeight + NOTCH_GAP
            card.style.clipPath = `path('${notchPath(W, H, nw, nh, R, R)}')`
        }

        update()
        const ro = new ResizeObserver(update)
        ro.observe(panel)
        ro.observe(chip)
        return () => ro.disconnect()
    }, [panelRef, cardRef, chipRef])
}

// One category panel. The same markup serves both layouts:
//   desktop — [data-label] shows collapsed; GSAP swaps it for [data-details]
//   phones  — a swipeable card with [data-details] always shown (CSS only)
const Panel = ({ item, panelRef }) => {
    const from = formatINR(item.priceFrom)
    const liRef = useRef(null)
    const cardRef = useRef(null)
    const chipRef = useRef(null)
    useNotchClip(liRef, cardRef, chipRef)

    // The li keeps sizing, hover events and the GSAP reveal wipe (which
    // animates the li's own clip-path); the notch clip lives on the inner card
    // so the two never fight.
    const setLiRef = (el) => {
        liRef.current = el
        panelRef(el)
    }

    return (
        <li
            ref={setLiRef}
            data-category-panel
            className="group/panel relative h-[31rem] w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[26rem] sm:max-w-none lg:h-full lg:w-auto lg:min-w-0 lg:flex-1 lg:basis-0"
        >
            {/* Product count, sitting in the notch cut from the card's corner. */}
            <span
                ref={chipRef}
                className="pointer-events-none absolute right-0 top-0 z-20 inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--palette-pine)] px-4 font-header text-[0.9375rem] font-medium leading-none text-[var(--palette-cream)] dark:bg-[var(--brand-sun)] dark:text-[var(--palette-pine)]"
            >
                <span className="font-semibold tabular-nums">{item.count}</span>
                {item.count === 1 ? 'product' : 'products'}
            </span>

            <div ref={cardRef} data-card className="absolute inset-0 isolate overflow-hidden rounded-[var(--radius-control)] bg-pine">
                {/* Photo (oversized so the pointer parallax never shows an edge) */}
                <div data-img className="absolute -inset-[4%] -z-10 bg-[radial-gradient(circle_at_78%_18%,rgb(242_201_76/0.52),transparent_36%),radial-gradient(circle_at_12%_83%,rgb(140_122_59/0.68),transparent_44%),var(--palette-pine)] will-change-transform">
                    {item.previewImage && (
                        <Image
                            src={item.previewImage}
                            alt={item.alt || ''}
                            fill
                            sizes="(max-width: 1024px) 84vw, 50vw"
                            className="object-cover"
                            style={{ objectPosition: item.imagePosition || 'center' }}
                        />
                    )}
                </div>
                {/* Scrim. Phones always show the full details stack, which reaches much
                    higher up the photo, so the scrim climbs with it there. */}
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(4_26_20/0.96)_0%,rgb(4_26_20/0.82)_45%,rgb(4_26_20/0.35)_78%,rgb(4_26_20/0.1)_100%)] lg:bg-[linear-gradient(to_top,rgb(4_26_20/0.92)_0%,rgb(4_26_20/0.45)_42%,rgb(4_26_20/0.05)_70%)]" />

                {/* Collapsed label (desktop only). Its link covers the panel, so a
                    click anywhere opens the category, and keyboard focus on it opens
                    the panel. */}
                <div data-label className="absolute inset-x-4 bottom-4 hidden text-white lg:block">
                    <Link
                        href={item.href}
                        aria-label={`Shop ${item.name}`}
                        className="ef-focus block font-header text-[1.5rem] font-semibold leading-[1.1] after:absolute after:inset-0 after:content-['']"
                    >
                        {item.name}
                    </Link>
                    {from && <span className="mt-1.5 block text-[0.9375rem] text-white/80">From <strong className="font-semibold text-white">{from}</strong></span>}
                </div>

                {/* Expanded details */}
                <div
                    data-details
                    className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-4 text-white lg:invisible lg:inset-x-6 lg:bottom-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:opacity-0"
                >
                    <div className="flex min-w-0 flex-col gap-3 lg:max-w-[20rem]">
                        <h3 data-d className="text-[1.75rem] font-semibold leading-[1.05] lg:text-[2.25rem]">
                            {item.name}
                        </h3>
                        <p data-d className="flex flex-wrap gap-x-3 gap-y-1 text-[0.875rem] text-white/80">
                            {from && <span>From <strong className="font-medium text-white">{from}</strong></span>}
                            {item.maxDiscount > 0 && <span>Up to <strong className="font-medium text-khaki">{item.maxDiscount}% off</strong></span>}
                        </p>
                        <Link
                            data-d
                            href={item.href}
                            className="ef-btn ef-btn--accent mt-1 w-fit max-w-full"
                        >
                            <span className="truncate">Shop {item.name}</span>
                            <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>

                    {item.products.length > 0 && (
                        // Popular picks: a solid cream card (pine in dark mode)
                        // so it reads over any photo, rows ruled in pine like the
                        // brand reference, arrow boxed like the storefront CTAs.
                        <div
                            data-d
                            className="w-full overflow-hidden rounded-[var(--radius-control)] bg-[var(--palette-cream)] text-[var(--palette-pine)] shadow-[0_18px_40px_-16px_rgb(0_0_0/0.55)] dark:bg-[var(--palette-pine)] dark:text-[var(--palette-cream)] dark:shadow-[0_18px_40px_-16px_rgb(0_0_0/0.7),inset_0_0_0_1px_rgb(247_243_232/0.12)] lg:w-[17.5rem] lg:shrink-0"
                        >
                            <div className="flex items-center justify-between gap-3 border-b border-[rgb(11_61_46/0.14)] px-4 py-3 dark:border-[rgb(247_243_232/0.12)]">
                                <p className="flex items-center gap-2 font-header text-[0.8125rem] font-semibold uppercase tracking-[0em]">
                                    <span aria-hidden="true" className="size-2 rounded-full bg-[var(--palette-sunflower)] shadow-[0_0_0_1.5px_var(--palette-olive)]" />
                                    Popular picks
                                </p>
                                <span className="text-[0.75rem] font-medium tabular-nums opacity-65">
                                    Top {item.products.length}
                                </span>
                            </div>

                            <ul className="list-none divide-y divide-[rgb(11_61_46/0.1)] p-0 dark:divide-[rgb(247_243_232/0.1)]">
                                {item.products.map((product) => {
                                    const markdown = product.mrp > product.price
                                    return (
                                        <li key={product.slug} data-row>
                                            <Link
                                                href={WEBSITE_PRODUCT_DETAILS(product, item.slug)}
                                                className="ef-focus group/row flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[rgb(11_61_46/0.06)] dark:hover:bg-[rgb(247_243_232/0.06)]"
                                            >
                                                <span className="relative size-12 shrink-0 overflow-hidden rounded-[calc(var(--radius-control)-2px)] bg-[rgb(140_122_59/0.12)] ring-1 ring-[rgb(11_61_46/0.08)] dark:bg-[var(--palette-cream)] dark:ring-0">
                                                    <Image src={product.image} alt="" fill sizes="48px" className="object-cover transition-transform duration-500 group-hover/row:scale-[1.07] motion-reduce:transition-none" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[0.9375rem] font-semibold leading-snug">{formatProductName(product.name)}</span>
                                                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] leading-none">
                                                        <strong className="font-semibold tabular-nums">{formatINR(product.price)}</strong>
                                                        {markdown && (
                                                            <s className="tabular-nums opacity-70">{formatINR(product.mrp)}</s>
                                                        )}
                                                        {product.size && (
                                                            <span className="rounded-[4px] bg-[rgb(140_122_59/0.14)] px-1.5 py-[3px] text-[0.6875rem] font-semibold text-[var(--brand-olive-deep)] dark:bg-[rgb(242_201_76/0.16)] dark:text-[var(--palette-sunflower)]">
                                                                {product.size}
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="flex size-8 shrink-0 items-center justify-center rounded-[calc(var(--radius-control)-2px)] bg-[rgb(11_61_46/0.08)] transition-colors group-hover/row:bg-[var(--palette-sunflower)] group-hover/row:text-[var(--palette-pine)] dark:bg-[rgb(247_243_232/0.1)]"
                                                >
                                                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover/row:-translate-y-px group-hover/row:translate-x-px motion-reduce:transition-none" />
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </li>
    )
}

// "Shop by category": four panels per desktop page, with the same expansion
// and detail reveal on every page. Phones and tablets get one swipeable rail
// containing every card, with its details always visible.
//
// GSAP, desktop only (gsap.matchMedia):
//   • one flex-grow tween re-proportions all panels (debounced by a short
//     intent delay so sweeping across them doesn't thrash)
//   • a paused timeline per panel swaps the label for the details, staggers
//     the rows in and settles the photo's zoom; it plays on enter and
//     reverses (faster) on leave
//   • gsap.quickTo drives a pointer parallax on the open panel's photo
//   • ScrollTrigger reveals the panels with a clip-path wipe on first view
// Reduced motion keeps the same states, just without the movement.
const CategoryShowcaseClient = ({ items = [], writeup, tone = 'sunken' }) => {
    const sectionRef = useRef(null)
    const rail = useScrollRail('[data-category-panel]')
    const listRef = rail.railRef
    const trackRef = useRef(null)
    const pagesRef = useRef([])
    const panelsRef = useRef([])
    const [pageIndex, setPageIndex] = useState(0)
    useReveal(sectionRef, [items.length])

    const pages = Array.from({ length: Math.ceil(items.length / PANEL_COUNT) }, (_, i) =>
        items.slice(i * PANEL_COUNT, (i + 1) * PANEL_COUNT)
    )

    useEffect(() => {
        setPageIndex((i) => Math.min(i, Math.max(0, pages.length - 1)))
    }, [pages.length])

    // Move whole four-card compositions together. The small lift and fade on
    // the entering page gives the transition depth without disturbing the
    // flex-grow hover animation inside each composition.
    useEffect(() => {
        const viewport = listRef.current
        const track = trackRef.current
        if (!viewport || !track) return

        const desktop = window.matchMedia('(min-width: 1024px)')
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
        const sync = (animate = false) => {
            const isDesktop = desktop.matches
            const target = pagesRef.current[pageIndex]
            pagesRef.current.forEach((page, i) => {
                if (page) page.inert = isDesktop && i !== pageIndex
            })
            gsap.killTweensOf(track)
            if (!isDesktop) {
                gsap.set(track, { clearProps: 'transform' })
                return
            }
            if (animate && !reduce.matches && target) {
                gsap.fromTo(target,
                    { autoAlpha: 0.7, y: 24, scale: 0.985 },
                    { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: 'expo.out', clearProps: 'opacity,visibility,transform' }
                )
            }
            gsap.to(track, {
                x: -pageIndex * viewport.clientWidth,
                duration: animate && !reduce.matches ? 1.05 : 0,
                ease: 'expo.inOut',
                overwrite: true,
            })
        }

        sync(true)
        const resize = new ResizeObserver(() => sync(false))
        resize.observe(viewport)
        desktop.addEventListener('change', sync)
        return () => {
            resize.disconnect()
            desktop.removeEventListener('change', sync)
            gsap.killTweensOf(track)
        }
    }, [listRef, pageIndex, pages.length])

    useGSAP(() => {
        const list = listRef.current
        const els = panelsRef.current.filter(Boolean)
        if (!list || !els.length) return

        const mm = gsap.matchMedia()
        mm.add(
            { desktop: '(min-width: 1024px)', reduce: '(prefers-reduced-motion: reduce)' },
            (ctx) => {
                const { desktop, reduce } = ctx.conditions
                if (!desktop) return
                const t = reduce ? 0 : 1

                const q = (el, sel) => el.querySelector(sel)
                const qa = (el, sel) => el.querySelectorAll(sel)

                gsap.set(els, { flexGrow: 1 })
                els.forEach((el) => {
                    gsap.set(q(el, '[data-details]'), { autoAlpha: 1 })
                    gsap.set(qa(el, '[data-d]'), { autoAlpha: 0, y: 18 })
                    gsap.set(q(el, '[data-img]'), { scale: 1.08 })
                })

                const reveals = els.map((el) =>
                    gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
                        .to(q(el, '[data-label]'), { autoAlpha: 0, y: -10, duration: 0.25 * t }, 0)
                        .to(qa(el, '[data-d]'), { autoAlpha: 1, y: 0, duration: 0.55 * t, stagger: 0.07 * t }, 0.2 * t)
                        .fromTo(qa(el, '[data-row]'), { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.45 * t, stagger: 0.06 * t }, 0.36 * t)
                        .to(q(el, '[data-img]'), { scale: 1, duration: 1.1 * t, ease: 'expo.out' }, 0)
                )

                let active = -1
                let pending = null
                const setActive = (i) => {
                    if (i === active) return
                    if (active > -1) reveals[active].timeScale(1.7).reverse()
                    active = i
                    gsap.to(els, {
                        flexGrow: (j) => (i < 0 || Math.floor(j / PANEL_COUNT) !== Math.floor(i / PANEL_COUNT) ? 1 : j === i ? GROW_ACTIVE : GROW_REST),
                        duration: 0.9 * t,
                        ease: 'expo.out',
                        overwrite: 'auto',
                    })
                    if (i > -1) reveals[i].timeScale(1).play()
                }
                // Intent delay: only commit once the pointer settles on a panel.
                const request = (i, delay) => {
                    pending?.kill()
                    pending = gsap.delayedCall(delay, () => setActive(i))
                }

                const movers = els.map((el) => {
                    const img = q(el, '[data-img]')
                    return { x: gsap.quickTo(img, 'x', { duration: 0.9, ease: 'power3' }), y: gsap.quickTo(img, 'y', { duration: 0.9, ease: 'power3' }) }
                })

                const handlers = els.map((el, i) => ({
                    enter: () => request(i, 0.06),
                    focus: () => request(i, 0),
                    move: (e) => {
                        if (reduce || active !== i) return
                        const r = el.getBoundingClientRect()
                        movers[i].x(((e.clientX - r.left) / r.width - 0.5) * -22)
                        movers[i].y(((e.clientY - r.top) / r.height - 0.5) * -16)
                    },
                    leave: () => { movers[i].x(0); movers[i].y(0) },
                }))
                els.forEach((el, i) => {
                    el.addEventListener('pointerenter', handlers[i].enter)
                    el.addEventListener('focusin', handlers[i].focus)
                    el.addEventListener('pointermove', handlers[i].move)
                    el.addEventListener('pointerleave', handlers[i].leave)
                })
                const onListLeave = () => request(-1, 0.12)
                const onFocusOut = (e) => { if (!list.contains(e.relatedTarget)) request(-1, 0) }
                list.addEventListener('pointerleave', onListLeave)
                list.addEventListener('focusout', onFocusOut)

                if (!reduce) {
                    gsap.fromTo(els.slice(0, PANEL_COUNT),
                        { clipPath: 'inset(100% 0% 0% 0%)' },
                        {
                            clipPath: 'inset(0% 0% 0% 0%)',
                            duration: 1.1,
                            ease: 'expo.out',
                            stagger: 0.12,
                            clearProps: 'clipPath',
                            scrollTrigger: { trigger: list, start: 'top 82%', once: true },
                        }
                    )
                }

                return () => {
                    pending?.kill()
                    els.forEach((el, i) => {
                        el.removeEventListener('pointerenter', handlers[i].enter)
                        el.removeEventListener('focusin', handlers[i].focus)
                        el.removeEventListener('pointermove', handlers[i].move)
                        el.removeEventListener('pointerleave', handlers[i].leave)
                    })
                    list.removeEventListener('pointerleave', onListLeave)
                    list.removeEventListener('focusout', onFocusOut)
                }
            }
        )

        return () => mm.revert()
    }, { scope: sectionRef, dependencies: [items.length] })

    if (!items.length) return null

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby="categories-title">
            <SectionHeader
                id="categories-title"
                eyebrow="Categories"
                title="Shop by"
                accent="category"
                description="Everything in the Energyflow pantry, grouped the way you cook, snack and gift."
                action={<StoreLink href={WEBSITE_SHOP}>Shop everything</StoreLink>}
            />

            <RailPager rail={rail} label="categories" className="mb-4 lg:hidden" />

            <div
                ref={listRef}
                aria-label="Shop by category"
                className="no-scrollbar flex list-none gap-[var(--grid-gap)] overflow-x-auto p-0 max-lg:-mx-[var(--website-gutter)] max-lg:snap-x max-lg:snap-mandatory max-lg:px-[var(--website-gutter)] max-lg:scroll-px-[var(--website-gutter)] lg:h-[clamp(28rem,36vw,34rem)] lg:overflow-hidden"
            >
                <div ref={trackRef} className="contents lg:flex lg:h-full lg:w-full lg:will-change-transform">
                    {pages.map((page, pageNumber) => (
                        <div
                            key={page[0].id}
                            ref={(el) => { pagesRef.current[pageNumber] = el }}
                            className="contents lg:block lg:h-full lg:w-full lg:shrink-0"
                            role="group"
                            aria-label={`Category page ${pageNumber + 1} of ${pages.length}`}
                        >
                            <ul className="contents list-none p-0 lg:flex lg:h-full lg:gap-[var(--grid-gap)]">
                                {page.map((item, itemIndex) => (
                                    <Panel
                                        key={item.id}
                                        item={item}
                                        panelRef={(el) => { panelsRef.current[pageNumber * PANEL_COUNT + itemIndex] = el }}
                                    />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {pages.length > 1 && (
                <div data-reveal className="mt-5 hidden items-center justify-between gap-6 lg:flex">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                        <span role="status" aria-live="polite" aria-atomic="true" className="shrink-0 font-header text-sm font-semibold tabular-nums text-ink-strong">
                            {String(pageIndex + 1).padStart(2, '0')}
                            <span className="mx-2 text-ink-muted">/</span>
                            {String(pages.length).padStart(2, '0')}
                        </span>
                        <div className="flex h-1 min-w-0 max-w-52 flex-1 gap-1" aria-hidden="true">
                            {pages.map((page, i) => (
                                <span key={page[0].id} className="h-full flex-1 overflow-hidden rounded-full bg-line-strong">
                                    <span className={`block h-full origin-left rounded-full bg-brand transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${i <= pageIndex ? 'scale-x-100' : 'scale-x-0'}`} />
                                </span>
                            ))}
                        </div>
                        <span className="text-sm text-ink-muted">Explore all {items.length} categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" className="ef-icon-btn min-h-11 min-w-11" aria-label="Previous categories" disabled={pageIndex === 0} onClick={() => setPageIndex((i) => Math.max(0, i - 1))}>
                            <ArrowLeft aria-hidden="true" />
                        </button>
                        <button type="button" className="ef-icon-btn min-h-11 min-w-11" aria-label="Next categories" disabled={pageIndex === pages.length - 1} onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}>
                            <ArrowRight aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}

            {/* The long-form range description stays on the page for search and
                for shoppers who want it, set small so the panels lead. */}
            {writeup && (
                <p data-reveal className="mt-[var(--section-gap)] w-full text-[0.875rem] leading-relaxed text-ink-muted">
                    {writeup}
                </p>
            )}
        </Section>
    )
}

export default CategoryShowcaseClient
