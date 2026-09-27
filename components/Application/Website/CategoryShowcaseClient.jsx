'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import { StoreLink } from './storefront/StoreButton'
import { formatINR } from './storefront/format'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const PANEL_COUNT = 4
const GROW_ACTIVE = 2.8   // flex-grow of the hovered panel …
const GROW_REST = 0.8     // … and of the others while one is open

const pad = (n) => String(n).padStart(2, '0')
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// One category panel. The same markup serves both layouts:
//   desktop — [data-label] shows collapsed; GSAP swaps it for [data-details]
//   phones  — a swipeable card with [data-details] always shown (CSS only)
const Panel = ({ item, index, panelRef }) => {
    const from = formatINR(item.priceFrom)

    return (
        <li
            ref={panelRef}
            className="group/panel relative isolate h-[31rem] w-[84vw] shrink-0 snap-start overflow-hidden rounded-card bg-pine sm:w-[26rem] lg:h-full lg:w-auto lg:min-w-0 lg:flex-1 lg:basis-0"
        >
            {/* Photo (oversized so the pointer parallax never shows an edge) */}
            <div data-img className="absolute -inset-[4%] -z-10 will-change-transform">
                <Image
                    src={item.previewImage}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 84vw, 50vw"
                    className="object-cover"
                />
            </div>
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(4_26_20/0.92)_0%,rgb(4_26_20/0.45)_42%,rgb(4_26_20/0.05)_70%)]" />

            {/* Top row: index + count */}
            <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between text-[0.75rem] font-medium text-white/85">
                <span className="tabular-nums">{pad(index + 1)}</span>
                <span className="rounded-[var(--radius-control)] bg-white/15 px-2.5 py-1 backdrop-blur-sm">
                    {plural(item.count, 'product', 'products')}
                </span>
            </div>

            {/* Collapsed label (desktop only). Its link covers the panel, so a
                click anywhere opens the category, and keyboard focus on it opens
                the panel. */}
            <div data-label className="absolute inset-x-4 bottom-4 hidden text-white lg:block">
                <Link
                    href={item.href}
                    aria-label={`Shop ${item.name}`}
                    className="ef-focus block text-[1.125rem] font-medium leading-tight tracking-[-0.01em] after:absolute after:inset-0 after:content-['']"
                >
                    {item.name}
                </Link>
                {from && <span className="mt-1 block text-[0.8125rem] text-white/75">From {from}</span>}
            </div>

            {/* Expanded details */}
            <div
                data-details
                className="absolute inset-x-4 bottom-4 z-10 flex flex-col gap-4 text-white lg:invisible lg:inset-x-6 lg:bottom-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6 lg:opacity-0"
            >
                <div className="flex min-w-0 flex-col gap-3 lg:max-w-[20rem]">
                    <h3 data-d className="text-[1.625rem] font-medium leading-[1.1] tracking-[-0.02em] lg:text-[2rem]">
                        {item.name}
                    </h3>
                    <p data-d className="flex flex-wrap gap-x-3 gap-y-1 text-[0.875rem] text-white/80">
                        {from && <span>From <strong className="font-medium text-white">{from}</strong></span>}
                        {item.maxDiscount > 0 && <span>Up to <strong className="font-medium text-khaki">{item.maxDiscount}% off</strong></span>}
                    </p>
                    <Link
                        data-d
                        href={item.href}
                        className="ef-focus group/cta mt-1 inline-flex h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] bg-khaki px-5 text-[0.9375rem] font-medium text-brand-deep transition-colors hover:bg-[var(--brand-amber-hover)]"
                    >
                        Shop {item.name}
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1" aria-hidden="true" />
                    </Link>
                </div>

                {item.products.length > 0 && (
                    <div data-d className="w-full rounded-card bg-white/12 p-3 backdrop-blur-md shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)] lg:w-[15.5rem] lg:shrink-0">
                        <p className="px-1 pb-2 text-[0.6875rem] font-medium uppercase text-white/70">Popular picks</p>
                        <ul className="flex list-none flex-col gap-1 p-0">
                            {item.products.map((product) => (
                                <li key={product.slug} data-row>
                                    <Link
                                        href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                                        className="ef-focus group/row flex items-center gap-2.5 rounded-well p-1 transition-colors hover:bg-white/10"
                                    >
                                        <span className="relative size-10 shrink-0 overflow-hidden rounded-[calc(var(--radius-well)-3px)] bg-white/20">
                                            <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[0.8125rem] font-medium">{product.name}</span>
                                            <span className="block text-[0.75rem] text-white/70">
                                                {formatINR(product.price)}{product.size ? ` · ${product.size}` : ''}
                                            </span>
                                        </span>
                                        <ArrowUpRight className="size-3.5 shrink-0 text-white/60 transition-colors group-hover/row:text-white" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </li>
    )
}

// "Shop by category": four equal photo panels; hovering (or focusing) one
// widens it and reveals its data — price floor, best markdown, three popular
// products and a clear shop action. Phones get the same cards as a swipeable
// rail with the details always visible.
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
const CategoryShowcaseClient = ({ items = [], writeup }) => {
    const sectionRef = useRef(null)
    const listRef = useRef(null)
    const panelsRef = useRef([])
    useReveal(sectionRef, [items.length])

    const panels = items.slice(0, PANEL_COUNT)
    const more = items.slice(PANEL_COUNT)

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
                        flexGrow: (j) => (i < 0 ? 1 : j === i ? GROW_ACTIVE : GROW_REST),
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
                    gsap.fromTo(els,
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

    if (!panels.length) return null

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="categories-title">
            <SectionHeader
                id="categories-title"
                eyebrow="Categories"
                title="Shop by"
                accent="category"
                description="Everything in the Energyflow pantry, grouped the way you cook, snack and gift."
                action={<StoreLink href={WEBSITE_SHOP}>Shop everything</StoreLink>}
            />

            <ul
                ref={listRef}
                aria-label="Top categories"
                className="no-scrollbar flex list-none gap-[var(--grid-gap)] overflow-x-auto p-0 max-lg:-mx-[var(--website-gutter)] max-lg:snap-x max-lg:snap-mandatory max-lg:px-[var(--website-gutter)] max-lg:scroll-px-[var(--website-gutter)] lg:h-[clamp(28rem,36vw,34rem)] lg:overflow-visible"
            >
                {panels.map((item, i) => (
                    <Panel key={item.id} item={item} index={i} panelRef={(el) => { panelsRef.current[i] = el }} />
                ))}
            </ul>

            {more.length > 0 && (
                <nav data-reveal aria-label="More categories" className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="mr-1 text-[0.8125rem] text-ink-muted">More categories:</span>
                    {more.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className="ef-focus rounded-[var(--radius-control)] bg-surface-card px-3 py-1.5 text-[0.8125rem] font-medium text-ink-strong shadow-[inset_0_0_0_1px_var(--line-soft)] transition-colors hover:bg-brand hover:text-white"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            )}

            {/* The long-form range description stays on the page for search and
                for shoppers who want it, set small so the panels lead. */}
            {writeup && (
                <p data-reveal className="mt-[var(--section-gap)] max-w-4xl text-[0.875rem] leading-relaxed text-ink-muted">
                    {writeup}
                </p>
            )}
        </Section>
    )
}

export default CategoryShowcaseClient
