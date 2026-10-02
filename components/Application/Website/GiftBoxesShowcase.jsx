'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Gift, ShoppingBag } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from './WishlistButton'
import CartQtyStepper from './storefront/CartQtyStepper'
import StoreButton from './storefront/StoreButton'
import { discountPercent, formatINR } from './storefront/format'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const OCCASIONS = ['Diwali', 'Weddings & shagun', 'Corporate gifting', 'Raksha Bandhan', 'Birthdays', 'Thank-yous']

const TONES = {
    inverse: 'ef-section--inverse',
    page: 'ef-section--page',
    sunken: 'ef-section--sunken',
}

const pad = (n) => String(n).padStart(2, '0')

// One gift box. Dark glass card: photo (with a slow parallax on desktop),
// index, pack size, wishlist, then name, price and add-to-cart. `featured`
// is the tall showpiece tile on desktop.
const GiftCard = ({ product, index, featured, priority }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart } = useCartProduct(product)
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const name = formatProductName(product.name) || 'Gift box'
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const image = product.media?.find((item) => item?.secure_url)

    return (
        <article
            className={cn(
                'group/gift relative flex h-full flex-col overflow-hidden rounded-[var(--radius-tile)] bg-white/[0.05]',
                'shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-spring)]',
                'hover:-translate-y-1 hover:shadow-[inset_0_0_0_1px_rgb(242_201_76/0.5),0_28px_60px_-28px_rgb(0_0_0/0.7)] motion-reduce:transition-none motion-reduce:hover:translate-y-0'
            )}
        >
            {/* ── Photo ── */}
            <div
                className={cn(
                    'relative overflow-hidden bg-[rgb(255_255_255/0.04)]',
                    featured ? 'aspect-[4/5] lg:aspect-auto lg:min-h-[26rem] lg:flex-1' : 'aspect-[4/5] lg:aspect-[16/11]'
                )}
            >
                <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
                    <div data-gift-parallax className="absolute inset-x-0 -inset-y-[6%]">
                        <Image
                            src={image?.secure_url || imgPlaceholder.src}
                            alt={image?.alt || name}
                            fill
                            priority={priority}
                            sizes={featured
                                ? '(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 32vw'
                                : '(max-width: 640px) 82vw, (max-width: 1024px) 50vw, 26vw'}
                            className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-spring)] group-hover/gift:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/gift:scale-100"
                        />
                    </div>
                </Link>

                {/* Legibility wash behind the overlays */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(11_61_46/0.55)] via-transparent to-[rgb(11_61_46/0.75)]" />

                <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-header text-[0.8125rem] font-semibold tabular-nums text-[var(--brand-sun)]" aria-hidden="true">
                            {pad(index + 1)}
                        </span>
                        {variant?.size && (
                            <span className="rounded-full bg-[rgb(11_61_46/0.6)] px-2.5 py-1 text-[11px] font-medium leading-none text-[var(--ink-on-inverse)] backdrop-blur-sm">
                                <span className="sr-only">Pack size </span>{variant.size}
                            </span>
                        )}
                        {off > 0 && <span className="ef-badge ef-badge--sale">{off}% off</span>}
                    </div>
                    <WishlistButton productId={product._id} name={product.name} className="pointer-events-auto" />
                </div>

                {/* "View" badge — slides in on hover / focus (desktop) */}
                <Link
                    href={href}
                    aria-label={`View ${name}`}
                    className={cn(
                        'ef-focus absolute bottom-4 right-4 hidden size-14 items-center justify-center rounded-full bg-[var(--brand-sun)] text-[var(--brand-sun-ink)] shadow-elev-2 lg:flex',
                        'translate-y-3 scale-75 opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-spring)]',
                        'group-hover/gift:translate-y-0 group-hover/gift:scale-100 group-hover/gift:opacity-100 focus-visible:translate-y-0 focus-visible:scale-100 focus-visible:opacity-100 motion-reduce:transition-none'
                    )}
                >
                    <ArrowUpRight className="size-6" aria-hidden="true" />
                </Link>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 font-header text-[1.1875rem] font-semibold uppercase leading-[1.1] text-[var(--ink-on-inverse)] sm:text-[1.3125rem]">
                        <Link href={href} className="ef-focus rounded-sm transition-colors hover:text-[var(--brand-sun)]">
                            {name}
                        </Link>
                    </h3>
                    <p className="flex shrink-0 flex-col items-end leading-tight">
                        <span className="font-header text-[1.25rem] font-semibold tabular-nums text-[var(--brand-sun)]">{formatINR(price)}</span>
                        {Number(mrp) > Number(price) && (
                            <span className="text-[12px] text-[var(--ink-on-inverse-muted)] line-through">
                                <span className="sr-only">MRP </span>{formatINR(mrp)}
                            </span>
                        )}
                    </p>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    {inCart ? (
                        <CartQtyStepper
                            qty={qty}
                            atMax={atMax}
                            onIncrease={increase}
                            onDecrease={decrease}
                            name={name}
                            tone="soft"
                            block
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={addToCart}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                            className="ef-btn ef-btn--accent ef-btn--sm ef-btn--block"
                        >
                            <ShoppingBag aria-hidden="true" /> {canAdd ? 'Add to cart' : 'Unavailable'}
                        </button>
                    )}
                    <Link href={href} className="ef-icon-btn size-11" aria-label={`View details: ${name}`}>
                        <ArrowUpRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </article>
    )
}

/**
 * "The gifting edit" — homepage band for the Gift Boxes category.
 *
 * Desktop: a sticky editorial column (headline, occasions, live numbers,
 * CTAs) beside a bento grid led by a tall featured box. Phones and tablets:
 * the same cards as a swipeable snap carousel with a counter and arrows.
 * A giant outlined wordmark drifts behind as the section scrolls; motion
 * stays off for reduced-motion users.
 */
const GiftBoxesShowcase = ({ products = [], total = 0, fromPrice = null, categoryHref, tone = 'inverse' }) => {
    const sectionRef = useRef(null)
    const rail = useScrollRail()
    useReveal(sectionRef)

    useGSAP(() => {
        const mm = gsap.matchMedia()
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            const outline = sectionRef.current?.querySelector('[data-gift-outline]')
            if (outline) {
                gsap.fromTo(outline, { xPercent: 0 }, {
                    xPercent: -30,
                    ease: 'none',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
                })
            }
        })
        // Photo parallax only where the cards sit in a grid; in the touch
        // carousel it would fight the horizontal swipe.
        mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
            gsap.utils.toArray(sectionRef.current?.querySelectorAll('[data-gift-parallax]') || []).forEach((layer) => {
                gsap.fromTo(layer, { yPercent: -4 }, {
                    yPercent: 4,
                    ease: 'none',
                    scrollTrigger: { trigger: layer.closest('article'), start: 'top bottom', end: 'bottom top', scrub: 0.8 },
                })
            })
        })
        return () => mm.revert()
    }, { scope: sectionRef })

    if (!products.length) return null

    const featuredLayout = products.length >= 3
    const count = Number(total) || products.length

    return (
        <section
            ref={sectionRef}
            aria-labelledby="gift-edit-title"
            className={cn('ef-section relative isolate overflow-hidden', TONES[tone] || TONES.inverse)}
        >
            {/* Decor: warm glows + the drifting outlined wordmark */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
                <span className="absolute -left-48 top-1/4 size-[36rem] rounded-full bg-[var(--brand-sun)] opacity-[0.08] blur-3xl" />
                <span className="absolute -right-40 -top-24 size-[30rem] rounded-full bg-[var(--palette-forest)] opacity-50 blur-3xl" />
            </div>
            <div aria-hidden="true" className="pointer-events-none mb-[calc(var(--section-gap)*0.6)] select-none overflow-hidden">
                <div
                    data-gift-outline
                    className="w-max whitespace-nowrap font-[family-name:var(--font-display)] text-[clamp(4rem,1.5rem+11vw,12.5rem)] font-bold uppercase leading-[0.9] text-transparent [-webkit-text-stroke:1.5px_rgb(247_243_232/0.16)]"
                >
                    Gift boxes <span className="text-[0.5em] align-middle">✺</span> Made to be given <span className="text-[0.5em] align-middle">✺</span> Gift boxes
                </div>
            </div>

            <div className="ef-container grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-14 xl:gap-20">
                {/* ── Editorial column ── */}
                <div className="flex min-w-0 flex-col gap-7 lg:sticky lg:top-28 lg:self-start">
                    <div data-reveal className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">The gifting edit</span>
                        <h2 id="gift-edit-title" className="ef-title">
                            Gifts worth <span className="ef-title__accent">unboxing</span>
                        </h2>
                        <p className="ef-lead max-w-md">
                            Dry fruit gift boxes in glass jars and keepsake packaging, ready to give for festivals,
                            weddings, teams and every thank-you.
                        </p>
                    </div>

                    <ul data-reveal aria-label="Made for" className="m-0 flex list-none flex-wrap gap-2 p-0">
                        {OCCASIONS.map((occasion) => (
                            <li
                                key={occasion}
                                className="rounded-full bg-white/[0.06] px-3.5 py-1.5 text-[0.8125rem] font-medium text-[var(--ink-on-inverse)] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]"
                            >
                                {occasion}
                            </li>
                        ))}
                    </ul>

                    <dl data-reveal className="m-0 grid grid-cols-3 border-y border-white/10">
                        {[
                            fromPrice ? { label: 'Starting at', value: formatINR(fromPrice) } : null,
                            { label: count === 1 ? 'Gift box' : 'Gift boxes', value: pad(count) },
                            { label: 'Delivered', value: 'Pan-India' },
                        ].filter(Boolean).map(({ label, value }, i) => (
                            <div key={label} className={cn('flex flex-col gap-1 py-4', i > 0 && 'border-l border-white/10 pl-4')}>
                                <dt className="text-[11px] font-semibold uppercase text-[var(--ink-on-inverse-muted)]">{label}</dt>
                                <dd className="m-0 font-header text-[clamp(1.25rem,1rem+0.8vw,1.75rem)] font-semibold leading-none tabular-nums text-[var(--brand-sun)]">{value}</dd>
                            </div>
                        ))}
                    </dl>

                    <div data-reveal className="flex flex-wrap gap-3">
                        <StoreButton href={categoryHref} variant="accent" arrow>Shop all gift boxes</StoreButton>
                        <StoreButton href="/contact" variant="ghost-light">
                            <Gift aria-hidden="true" /> Plan a bulk order
                        </StoreButton>
                    </div>
                </div>

                {/* ── Boxes: carousel on touch, bento grid on desktop ── */}
                <div className="min-w-0">
                    {rail.overflows && (
                        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
                            <div className="flex items-center gap-3">
                                <span className="text-[0.8125rem] font-medium text-[var(--ink-on-inverse)]">Swipe to explore</span>
                                <span role="status" aria-atomic="true" className="text-[0.8125rem] font-semibold tabular-nums text-[var(--brand-sun)]">
                                    {pad(rail.index + 1)} / {pad(rail.stops)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={rail.scrollPrev} disabled={!rail.canPrev} aria-label="Previous gift box" className="ef-icon-btn min-h-11 min-w-11">
                                    <ArrowLeft aria-hidden="true" />
                                </button>
                                <button type="button" onClick={rail.scrollNext} disabled={!rail.canNext} aria-label="Next gift box" className="ef-icon-btn min-h-11 min-w-11">
                                    <ArrowRight aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    <ul
                        ref={rail.railRef}
                        aria-label="Gift boxes"
                        className={cn(
                            'no-scrollbar m-0 flex list-none gap-4 overflow-x-auto overscroll-x-contain p-0 pb-2',
                            'snap-x snap-mandatory scroll-px-[var(--website-gutter)] -mx-[var(--website-gutter)] px-[var(--website-gutter)]',
                            'lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0',
                            featuredLayout && 'lg:grid-rows-[auto_auto]'
                        )}
                    >
                        {products.map((product, index) => (
                            <li
                                key={product._id}
                                data-reveal
                                className={cn(
                                    'w-[82%] shrink-0 snap-start sm:w-[56%] md:w-[44%] lg:w-auto',
                                    featuredLayout && index === 0 && 'lg:row-span-2',
                                    products.length === 1 && 'lg:col-span-2'
                                )}
                            >
                                <GiftCard
                                    product={product}
                                    index={index}
                                    featured={featuredLayout && index === 0}
                                    priority={false}
                                />
                            </li>
                        ))}
                    </ul>

                    {count > products.length && (
                        <p data-reveal className="mt-6 text-sm text-[var(--ink-on-inverse-muted)]">
                            Showing {products.length} of {count} gift boxes.{' '}
                            <Link href={categoryHref} className="ef-link">See them all</Link>
                        </p>
                    )}
                </div>
            </div>
        </section>
    )
}

export default GiftBoxesShowcase
