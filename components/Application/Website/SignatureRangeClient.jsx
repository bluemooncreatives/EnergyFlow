'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import { StoreLink } from './storefront/StoreButton'
import { formatINR } from './storefront/format'
import { OilBottle } from './storefront/ProductIllustrations'
import bilonaGhee from '@/public/assets/images/marquee/bilona-ghee.webp'
import chocolates from '@/public/assets/images/marquee/chocolates.webp'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// The three lines Energyflow leads with. Each deep-links into a name search;
// `term` keys the live stats from getSignatureShowcase. Media kinds:
//   cutout — a transparent photo floating on the tile's tint
//   cover  — a full-bleed photograph
//   art    — a flat illustration, until a cutout exists for the line
const RANGES = [
    {
        key: 'ghee',
        term: 'ghee',
        eyebrow: 'A2 Gir cow · Bilona',
        title: 'Bilona Ghee',
        copy: 'Curd from A2 Gir cow milk, hand-churned and slow-simmered the traditional way. Grainy, aromatic and deeply rich.',
        href: `${WEBSITE_SHOP}?q=ghee`,
        cta: 'Shop ghee',
        enquire: 'Enquire about ghee',
        tint: 'var(--tint-honey)',
        media: { kind: 'cutout', src: bilonaGhee },
    },
    {
        key: 'oils',
        term: 'oil',
        eyebrow: 'Wood & expeller pressed',
        title: 'Cold Pressed Oils',
        copy: 'Pressed at low temperature. Never refined, bleached or deodorised.',
        href: `${WEBSITE_SHOP}?q=oil`,
        cta: 'Shop oils',
        enquire: 'Enquire about oils',
        tint: 'var(--tint-pistachio)',
        media: { kind: 'art', Art: OilBottle },
    },
    {
        key: 'chocolates',
        term: 'chocolate',
        eyebrow: 'Festive & corporate',
        title: 'Gift Chocolates',
        copy: 'Chocolate and dry fruit boxes for Diwali, weddings and teams.',
        href: `${WEBSITE_SHOP}?q=chocolate`,
        cta: 'Shop gifts',
        enquire: 'Plan a gift order',
        tint: 'var(--tint-almond)',
        media: { kind: 'cutout', src: chocolates },
    },
]

// Grid position of each tile, in order: featured (tall, left), wide (top
// right), then two compact tiles under it.
const SLOTS = ['featured', 'wide', 'compact', 'compact']

const SLOT_CLASSES = {
    featured: 'col-span-2 h-[clamp(24rem,68vw,30rem)] lg:row-span-2 lg:h-auto',
    wide: 'col-span-2 h-[clamp(15rem,42vw,18rem)] lg:h-auto',
    compact: 'col-span-1 h-[clamp(14.5rem,50vw,18rem)] lg:h-auto',
}

// Where a cutout / illustration floats, clear of the bottom panel. The wide
// tile moves its art to the right once it is wide enough for a side panel.
const MEDIA_CLASSES = {
    featured: 'inset-x-[12%] top-[10%] bottom-[34%]',
    wide: 'inset-x-[20%] top-[10%] bottom-[36%] @min-[30rem]/tile:left-auto @min-[30rem]/tile:right-[5%] @min-[30rem]/tile:bottom-[8%] @min-[30rem]/tile:w-[40%]',
    compact: 'inset-x-[10%] top-[15%] bottom-[36%]',
}

const IMAGE_SIZES = {
    featured: '(max-width: 1024px) 80vw, 36vw',
    wide: '(max-width: 1024px) 60vw, 22vw',
    compact: '(max-width: 1024px) 50vw, 24vw',
}

const TITLE_CLASSES = {
    featured: 'text-[clamp(1.625rem,1.1rem+1.9vw,2.75rem)]',
    wide: 'text-[clamp(1.25rem,1rem+0.9vw,1.75rem)]',
    compact: 'text-[clamp(0.9375rem,7.5cqi,1.375rem)]',
}

const MORE_LINKS = [
    { label: 'Freshly arrived', href: `${WEBSITE_SHOP}?freshlyArrived=true` },
    { label: 'Bestsellers', href: `${WEBSITE_SHOP}?bestseller=true` },
]

const pad = (n) => String(n).padStart(2, '0')
const countLabel = (count) => `${count} ${count === 1 ? 'product' : 'products'}`

// Live stats decide where a line leads: while it has nothing in the catalogue
// its tile becomes an enquiry rather than a search with no results. Without
// stats (lookup failed) the page-level availability check decides instead.
const resolveRange = (range, stats, availability) => {
    const live = stats?.[range.term]
    const inStock = live ? live.count > 0 : availability?.terms?.[range.term] !== false

    return {
        ...range,
        href: inStock ? range.href : '/contact',
        label: inStock ? range.cta : range.enquire,
        price: inStock ? live?.priceFrom ?? null : null,
        badge: live?.count ? countLabel(live.count) : inStock ? null : 'On request',
    }
}

const TileMedia = ({ media, slot }) => {
    if (media.kind === 'art') {
        const { Art } = media
        return <Art className="size-full drop-shadow-[0_18px_24px_rgba(8,58,47,0.14)]" />
    }

    const cover = media.kind === 'cover'
    return (
        <Image
            src={media.src}
            alt=""
            fill
            quality={82}
            sizes={cover ? IMAGE_SIZES.compact : IMAGE_SIZES[slot]}
            className={cover ? 'object-cover' : 'object-contain drop-shadow-[0_24px_28px_rgba(8,58,47,0.2)]'}
        />
    )
}

const RangeTile = ({ tile, slot, index, total }) => {
    const cover = tile.media.kind === 'cover'
    const price = formatINR(tile.price)

    return (
        <Link
            href={tile.href}
            data-sig-tile
            className={cn('ef-tile ef-focus group/tile @container/tile block', SLOT_CLASSES[slot])}
            style={{ background: tile.tint }}
            aria-label={`${tile.title}${price ? `, from ${price}` : ''} — ${tile.label}`}
        >
            {!cover && (
                <>
                    {/* soft light pooling behind the art */}
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-1/4 left-1/2 -z-10 aspect-square w-[90%] -translate-x-1/2 rounded-full bg-white/50 blur-3xl dark:bg-white/[0.04]"
                    />
                    {/* pointer-follow highlight (desktop, driven by GSAP) */}
                    <span
                        data-sig-glow
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 size-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.55),transparent)] opacity-0 dark:bg-[radial-gradient(closest-side,rgb(242_201_76/0.1),transparent)]"
                    />
                </>
            )}

            <div
                data-sig-media
                aria-hidden="true"
                className={cn('pointer-events-none absolute', cover ? 'inset-x-0 -inset-y-[6%]' : MEDIA_CLASSES[slot])}
            >
                <TileMedia media={tile.media} slot={slot} />
            </div>

            {cover && (
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(4_28_21/0.3)_0%,transparent_32%,transparent_52%,rgb(4_28_21/0.5)_100%)]"
                />
            )}

            <div data-sig-meta className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2 sm:inset-x-3.5 sm:top-3.5">
                {tile.badge ? <span className="ef-badge ef-badge--soft">{tile.badge}</span> : <span />}
                <span
                    aria-hidden="true"
                    className={cn(
                        'pt-1 text-[0.6875rem] font-semibold tabular-nums tracking-[0.08em]',
                        cover ? 'text-cream [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]' : 'text-ink-muted'
                    )}
                >
                    {pad(index + 1)}
                    <span className="hidden opacity-80 @min-[15rem]/tile:inline"> / {pad(total)}</span>
                </span>
            </div>

            {/* Frosted pine panel: pinned to the fixed palette so it reads the
                same on a tint, a photograph and in either theme. */}
            <div
                data-sig-panel
                className={cn(
                    'absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-3 rounded-[var(--radius-card)] bg-pine/80 p-3 text-cream ring-1 ring-inset ring-cream/12 backdrop-blur-md sm:inset-x-3.5 sm:bottom-3.5 sm:p-4',
                    slot === 'featured' && 'sm:p-5',
                    slot === 'wide' && '@min-[30rem]/tile:right-auto @min-[30rem]/tile:w-[min(25rem,56%)]'
                )}
            >
                <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="hidden truncate text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-cream/70 @min-[13rem]/tile:block">
                        {tile.eyebrow}
                    </span>
                    {/* size before leading: cn() drops a leading-* that precedes a text size */}
                    <span
                        className={cn(
                            TITLE_CLASSES[slot],
                            'font-header font-semibold uppercase leading-[0.95] text-balance break-words text-cream'
                        )}
                    >
                        {tile.title}
                    </span>
                    {slot === 'featured' && tile.copy && (
                        <span className="ef-clamp-2 mt-1 hidden max-w-[34rem] text-[0.875rem] leading-relaxed text-cream/78 @min-[28rem]/tile:block">
                            {tile.copy}
                        </span>
                    )}
                    {price && (
                        <span className={cn('mt-1 items-baseline gap-1.5', slot === 'compact' ? 'hidden @min-[14rem]/tile:flex' : 'flex')}>
                            <span className="text-[0.75rem] text-cream/70">From</span>
                            <span
                                data-sig-price
                                data-value={tile.price}
                                className={cn(
                                    slot === 'featured' ? 'text-[clamp(1.25rem,1rem+0.9vw,1.75rem)]' : 'text-[1.0625rem]',
                                    'font-header font-semibold tabular-nums leading-none text-sun'
                                )}
                            >
                                {price}
                            </span>
                        </span>
                    )}
                </div>

                <span
                    data-sig-arrow
                    aria-hidden="true"
                    className={cn(
                        'flex shrink-0 items-center justify-center rounded-full bg-sun text-pine shadow-[0_10px_22px_-8px_rgb(242_201_76/0.7)]',
                        slot === 'featured' ? 'size-11 sm:size-12' : 'size-9 sm:size-10',
                        // Narrow compact tiles (two-up on phones): the arrow rides the
                        // panel's top edge so the title keeps the full width.
                        slot === 'compact' && '@max-[14rem]/tile:absolute @max-[14rem]/tile:-top-4 @max-[14rem]/tile:right-2.5'
                    )}
                >
                    <ArrowUpRight className="size-[1.1rem] transition-transform duration-500 ease-[var(--ease-spring)] group-hover/tile:rotate-45 motion-reduce:transition-none" />
                </span>
            </div>
        </Link>
    )
}

// Tile motion. Everything is visible by default and hidden only here, so a
// slow bundle never blanks the grid; tiles already on screen when this runs
// (restored scroll, late hydration) are left alone rather than re-played.
//   · entrance — each tile wipes open from the bottom while its media settles
//     from a zoom, then the panel lifts in, the arrow springs and the price
//     counts up. Batched, so tiles stacked on a phone reveal as they arrive.
//   · parallax — media drifts against the scroll (desktop).
//   · pointer — media leans away from the cursor and a soft light follows it
//     (fine pointers only). quickTo keeps it on the GPU and off React.
const CLIP_HIDDEN = 'inset(100% 0% 0% 0% round 1rem)'
const CLIP_SHOWN = 'inset(0% 0% 0% 0% round 1rem)'
const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)'

const settlePrices = (root) =>
    root.querySelectorAll('[data-sig-price]').forEach((el) => {
        el.textContent = formatINR(el.dataset.value)
    })

const useSignatureMotion = (gridRef) => {
    useGSAP(() => {
        const grid = gridRef.current
        if (!grid) return
        const mm = gsap.matchMedia()

        mm.add(NO_REDUCED_MOTION, () => {
            const tiles = gsap.utils.toArray('[data-sig-tile]', grid)
            const pending = tiles.filter((tile) => tile.getBoundingClientRect().top > window.innerHeight * 0.9)
            if (!pending.length) return

            const parts = (tile) => ({
                media: tile.querySelector('[data-sig-media]'),
                meta: tile.querySelector('[data-sig-meta]'),
                panel: tile.querySelector('[data-sig-panel]'),
                arrow: tile.querySelector('[data-sig-arrow]'),
                price: tile.querySelector('[data-sig-price]'),
            })

            pending.forEach((tile) => {
                const { media, meta, panel, arrow } = parts(tile)
                gsap.set(tile, { clipPath: CLIP_HIDDEN })
                gsap.set(media, { scale: 1.22, transformOrigin: '50% 65%' })
                gsap.set(meta, { autoAlpha: 0, y: -10 })
                gsap.set(panel, { autoAlpha: 0, y: 32 })
                gsap.set(arrow, { scale: 0, rotate: -90 })
            })

            const reveal = (batch) => {
                const tl = gsap.timeline()
                batch.forEach((tile, i) => {
                    const { media, meta, panel, arrow, price } = parts(tile)
                    const at = i * 0.12

                    tl.to(tile, {
                        clipPath: CLIP_SHOWN,
                        duration: 1.25,
                        ease: 'expo.out',
                        // A lingering clip-path would crop the focus outline.
                        onComplete: () => gsap.set(tile, { clearProps: 'clipPath' }),
                    }, at)
                        .to(media, { scale: 1, duration: 1.7, ease: 'expo.out' }, at)
                        .to(meta, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, at + 0.5)
                        .to(panel, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power4.out' }, at + 0.4)
                        .to(arrow, { scale: 1, rotate: 0, duration: 0.8, ease: 'back.out(2.2)' }, at + 0.7)

                    if (price) {
                        const target = Number(price.dataset.value)
                        const counter = { value: 0 }
                        tl.to(counter, {
                            value: target,
                            duration: 1.2,
                            ease: 'power2.out',
                            onUpdate: () => { price.textContent = formatINR(Math.round(counter.value)) },
                            onComplete: () => { price.textContent = formatINR(target) },
                        }, at + 0.55)
                    }
                })
            }

            ScrollTrigger.batch(pending, { start: 'top 88%', once: true, onEnter: reveal })

            // If the media query flips mid-count, never leave a half-counted price.
            return () => settlePrices(grid)
        })

        mm.add(`${NO_REDUCED_MOTION} and (min-width: 1024px)`, () => {
            gsap.utils.toArray('[data-sig-media]', grid).forEach((media) => {
                gsap.fromTo(media, { yPercent: -4 }, {
                    yPercent: 4,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: media.closest('[data-sig-tile]'),
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 0.6,
                    },
                })
            })
        })

        mm.add(`${NO_REDUCED_MOTION} and (hover: hover) and (pointer: fine)`, () => {
            const detach = gsap.utils.toArray('[data-sig-tile]', grid).map((tile) => {
                const media = tile.querySelector('[data-sig-media]')
                const glow = tile.querySelector('[data-sig-glow]')
                const arrow = tile.querySelector('[data-sig-arrow]')
                // Covers have 3% spare on each side once scaled; the 2% lean stays inside it.
                const hoverScale = glow ? 1.04 : 1.06

                const lean = {
                    x: gsap.quickTo(media, 'x', { duration: 0.9, ease: 'power3' }),
                    y: gsap.quickTo(media, 'y', { duration: 0.9, ease: 'power3' }),
                }
                const light = glow && {
                    x: gsap.quickTo(glow, 'x', { duration: 0.5, ease: 'power3' }),
                    y: gsap.quickTo(glow, 'y', { duration: 0.5, ease: 'power3' }),
                }
                if (glow) gsap.set(glow, { xPercent: -50, yPercent: -50 })

                const onEnter = () => {
                    gsap.to(media, { scale: hoverScale, duration: 0.9, ease: 'power3.out', overwrite: 'auto' })
                    gsap.to(arrow, { scale: 1.08, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
                    if (glow) gsap.to(glow, { autoAlpha: 1, duration: 0.45, overwrite: 'auto' })
                }
                const onMove = (event) => {
                    const rect = tile.getBoundingClientRect()
                    const x = event.clientX - rect.left
                    const y = event.clientY - rect.top
                    lean.x((0.5 - x / rect.width) * rect.width * 0.04)
                    lean.y((0.5 - y / rect.height) * rect.height * 0.04)
                    light?.x(x)
                    light?.y(y)
                }
                const onLeave = () => {
                    lean.x(0)
                    lean.y(0)
                    gsap.to(media, { scale: 1, duration: 0.9, ease: 'power3.out', overwrite: 'auto' })
                    gsap.to(arrow, { scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
                    if (glow) gsap.to(glow, { autoAlpha: 0, duration: 0.45, overwrite: 'auto' })
                }

                tile.addEventListener('pointerenter', onEnter)
                tile.addEventListener('pointermove', onMove)
                tile.addEventListener('pointerleave', onLeave)
                return () => {
                    tile.removeEventListener('pointerenter', onEnter)
                    tile.removeEventListener('pointermove', onMove)
                    tile.removeEventListener('pointerleave', onLeave)
                }
            })

            return () => detach.forEach((fn) => fn())
        })
    }, { scope: gridRef })
}

const SignatureRangeClient = ({ tone = 'page', stats = null, availability = null, pick }) => {
    const sectionRef = useRef(null)
    const gridRef = useRef(null)
    useReveal(sectionRef)
    useSignatureMotion(gridRef)

    const tiles = [...RANGES.map((range) => resolveRange(range, stats, availability)), pick].filter(Boolean)

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby="signature-title">
            <SectionHeader
                id="signature-title"
                eyebrow="Our signature range"
                title="Made the slow way,"
                accent="worth gifting."
                description="The things we are known for: traditional bilona ghee, cold pressed oils and chocolates boxed for giving."
                action={<StoreLink href={WEBSITE_SHOP}>View all</StoreLink>}
            />

            <div
                ref={gridRef}
                className="grid grid-cols-2 gap-[var(--grid-gap)] lg:h-[clamp(34rem,20rem+18vw,42rem)] lg:grid-cols-4 lg:grid-rows-2"
            >
                {tiles.map((tile, i) => (
                    <RangeTile key={tile.key} tile={tile} slot={SLOTS[i]} index={i} total={tiles.length} />
                ))}
            </div>

            <div className="mt-[clamp(2.5rem,1.75rem+2vw,3.5rem)]">
                <h3 data-reveal className="mb-4 text-[length:var(--type-h3)] font-medium leading-tight text-ink-strong">
                    Not sure yet? Start here.
                </h3>
                <div className="grid gap-3 md:grid-cols-3">
                    {MORE_LINKS.map((link) => (
                        <StoreLink key={link.href} href={link.href} data-reveal className="h-14 w-full justify-between">
                            {link.label}
                        </StoreLink>
                    ))}
                    <StoreLink href="/contact" data-reveal className="ef-cta--accent h-14 w-full justify-between">
                        Plan a gift order
                    </StoreLink>
                </div>
            </div>
        </Section>
    )
}

export default SignatureRangeClient
