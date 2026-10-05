'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Check, ShoppingBag, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { useReveal } from '@/hooks/useReveal'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from '../WishlistButton'
import CartQtyStepper from '../storefront/CartQtyStepper'
import Section from '../storefront/Section'
import SectionHeader from '../storefront/SectionHeader'
import { discountPercent, formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton } from './GiftingSelection'
import { pad, photoOf, priceOf } from './GiftingUi'

const MAX_PHOTOS = 6
const PANEL_ID = 'gift-spotlight'
const tabId = (product) => `gift-tab-${product._id}`

const photosOf = (product) => {
    const media = (product.media || []).filter((m) => m?.secure_url).slice(0, MAX_PHOTOS)
    return media.length ? media : [{ _id: 'placeholder', secure_url: imgPlaceholder.src }]
}

// The spotlight: the chosen box's photos, story, highlights and buy actions.
// Keyed by the product, so its photo index resets and it fades in fresh.
const Spotlight = ({ product, index, count, onPrev, onNext }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart, buyNow } = useCartProduct(product)
    const [photo, setPhoto] = useState(0)
    const swipeRef = useRef(null)

    const name = formatProductName(product.name) || 'Gift box'
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const images = photosOf(product)
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const size = variant?.size || product.sizes?.[0]

    // Horizontal swipe on the photo (touch / pen) moves between boxes;
    // vertical scrolling is left alone.
    const onPointerDown = (event) => {
        if (event.pointerType === 'mouse') return
        swipeRef.current = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event) => {
        const start = swipeRef.current
        swipeRef.current = null
        if (!start || count < 2) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) (dx < 0 ? onNext : onPrev)()
    }

    return (
        <div className="ef-card rounded-tile p-2 shadow-elev-2 duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:p-2.5">
            {/* ── Stage ── */}
            <div
                className="ef-tile aspect-[4/3] touch-pan-y select-none bg-surface-well sm:aspect-[16/10]"
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
                onPointerCancel={() => { swipeRef.current = null }}
            >
                {images.map((img, i) => (
                    <Image
                        key={img._id || i}
                        src={img.secure_url}
                        alt={i === photo ? (img.alt || `${name} gift box`) : ''}
                        fill
                        priority={index === 0 && i === 0}
                        sizes="(max-width: 1024px) 94vw, 56vw"
                        className={cn(
                            'object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
                            i === photo ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                ))}

                <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-4 sm:top-4">
                    <span className="ef-badge ef-badge--inverse tabular-nums">{pad(index + 1)} / {pad(count)}</span>
                    {size && <span className="ef-badge ef-badge--soft">{size}</span>}
                    {off > 0 && <span className="ef-badge ef-badge--sale">{off}% off</span>}
                </div>
                <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                    <WishlistButton productId={product._id} name={product.name} />
                </div>

                {count > 1 && (
                    <div className="absolute bottom-3 right-3 flex gap-2 sm:bottom-4 sm:right-4">
                        <button type="button" className="ef-icon-btn !size-10 border-transparent shadow-elev-2" onClick={onPrev} aria-label="Previous gift box">
                            <ArrowLeft aria-hidden="true" />
                        </button>
                        <button type="button" className="ef-icon-btn !size-10 border-transparent shadow-elev-2" onClick={onNext} aria-label="Next gift box">
                            <ArrowRight aria-hidden="true" />
                        </button>
                    </div>
                )}
            </div>

            {images.length > 1 && (
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto" role="group" aria-label={`${name} photos`}>
                    {images.map((img, i) => (
                        <button
                            key={img._id || i}
                            type="button"
                            onClick={() => setPhoto(i)}
                            aria-pressed={i === photo}
                            aria-label={`Show photo ${i + 1} of ${images.length}`}
                            className={cn(
                                'ef-focus relative aspect-square w-14 shrink-0 overflow-hidden rounded-[var(--radius-well)] transition-opacity sm:w-16',
                                i === photo ? 'opacity-100 ring-2 ring-brand ring-offset-2 ring-offset-surface-card' : 'opacity-60 hover:opacity-100'
                            )}
                        >
                            <Image src={img.secure_url} alt="" fill sizes="64px" className="object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* ── Story ── */}
            <div className="grid gap-6 px-2.5 pb-3 pt-5 sm:px-4 sm:pb-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,17rem)] md:gap-8">
                <div className="flex min-w-0 flex-col gap-4">
                    <div>
                        <p className="text-[0.75rem] font-semibold uppercase text-ink-muted">Signature box {pad(index + 1)}</p>
                        <h3 className="mt-1.5 font-header text-[clamp(1.75rem,1.3rem+1.6vw,2.75rem)] font-semibold uppercase leading-[0.95] text-ink-strong">
                            <Link href={href} className="ef-focus rounded-sm transition-colors hover:text-brand-bright">{name}</Link>
                        </h3>
                        {product.nickname && <p className="mt-2 text-[0.9375rem] italic text-olive-deep">“{product.nickname}”</p>}
                    </div>
                    {product.summary && <p className="text-[0.9375rem] leading-relaxed text-ink-body">{product.summary}</p>}

                    {product.highlights?.length > 0 && (
                        <ul className="flex flex-col divide-y divide-line-soft border-y border-line-soft" aria-label="Why you'll love it">
                            {product.highlights.map((item) => (
                                <li key={item.title} className="flex items-start gap-3 py-3">
                                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-tint-pistachio text-brand-bright">
                                        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    <span className="text-[0.875rem] leading-relaxed text-ink-body">
                                        <strong className="font-semibold text-ink-strong">{item.title}</strong>
                                        {item.detail && <> · {item.detail}</>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* ── Buy ── */}
                <div className="flex flex-col gap-3 md:sticky md:top-28 md:self-start">
                    <div className="rounded-card bg-surface-sunken p-4">
                        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular-nums">
                            {formatINR(price) ? (
                                <>
                                    <span className="font-header text-[2.25rem] font-semibold leading-none text-ink-strong">{formatINR(price)}</span>
                                    {Number(mrp) > Number(price) && (
                                        <span className="text-[0.9375rem] text-ink-muted line-through"><span className="sr-only">MRP </span>{formatINR(mrp)}</span>
                                    )}
                                </>
                            ) : (
                                <span className="text-[0.9375rem] text-ink-muted">Price on request</span>
                            )}
                        </p>
                        <p className="mt-1.5 text-[0.75rem] text-ink-muted">
                            Per box{size ? ` · ${size}` : ''} · incl. taxes · free delivery
                        </p>
                    </div>

                    {inCart ? (
                        <CartQtyStepper qty={qty} atMax={atMax} onIncrease={increase} onDecrease={decrease} name={name} block className="!h-12" />
                    ) : (
                        <button
                            type="button"
                            className="ef-btn ef-btn--primary ef-btn--block"
                            onClick={addToCart}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                        >
                            <ShoppingBag aria-hidden="true" /> Add to cart
                        </button>
                    )}
                    <button
                        type="button"
                        className="ef-btn ef-btn--accent ef-btn--block"
                        onClick={buyNow}
                        disabled={!canAdd}
                        aria-label={canAdd ? `Buy now: ${name}` : `Unavailable: ${name}`}
                    >
                        <Zap aria-hidden="true" /> Buy now
                    </button>
                    <EnquireButton
                        productId={product._id}
                        className="ef-focus flex items-center justify-between gap-3 rounded-[var(--radius-control)] px-1 py-2 text-left text-[0.8125rem] text-ink-strong transition-colors hover:text-brand-bright"
                        aria-label={`Enquire about bulk orders of ${name}`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <Building2 className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
                            <span>Ordering {MIN_GIFT_QUANTITY}+? <strong className="font-semibold underline underline-offset-2">Get bulk pricing</strong></span>
                        </span>
                        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </EnquireButton>
                </div>
            </div>
        </div>
    )
}

/**
 * "Pick a box, make their day" — the collection as a box selector: a list of
 * every box (number, photo, name, nickname, size, price) beside a spotlight
 * of the chosen one. On phones the list becomes a swipeable strip above the
 * spotlight, and swiping the photo moves between boxes.
 */
const GiftCollection = ({ products = [] }) => {
    const rootRef = useRef(null)
    const tabRefs = useRef([])
    const [active, setActive] = useState(0)
    useReveal(rootRef, [products.length])

    if (!products.length) return null
    const count = products.length
    const current = products[Math.min(active, count - 1)]

    const select = (next, { focus = false } = {}) => {
        const index = (next + count) % count
        setActive(index)
        const tab = tabRefs.current[index]
        // Keep the chosen tab in view in the phone strip. Only the strip
        // scrolls (sideways); the page itself never moves.
        const strip = tab?.parentElement
        if (strip && strip.scrollWidth > strip.clientWidth) {
            const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            const inset = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0
            strip.scrollTo({ left: tab.offsetLeft - inset, behavior: reduce ? 'instant' : 'smooth' })
        }
        if (focus) tab?.focus({ preventScroll: true })
    }

    const onTabKey = (event, index) => {
        const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }
        if (keys[event.key]) { event.preventDefault(); select(index + keys[event.key], { focus: true }) }
        if (event.key === 'Home') { event.preventDefault(); select(0, { focus: true }) }
        if (event.key === 'End') { event.preventDefault(); select(count - 1, { focus: true }) }
    }

    return (
        <Section ref={rootRef} id={COLLECTION_ANCHOR} tone="page" className="scroll-mt-20" aria-labelledby="collection-title">
            <SectionHeader
                id="collection-title"
                eyebrow={`The signature collection · ${count} ${count === 1 ? 'box' : 'boxes'}`}
                title="Pick a box,"
                accent="make their day"
                description="Ready-to-gift boxes, delivered free across India. Choose one to see what's inside."
            />

            <div className={cn('grid items-start gap-5 lg:gap-8', count > 1 && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)]')}>
                {count > 1 && (
                    <div className="min-w-0 lg:sticky lg:top-28" data-reveal>
                        <p className="mb-3 hidden text-[0.75rem] font-semibold uppercase text-ink-muted lg:block">Choose a box</p>
                        <div
                            role="tablist"
                            aria-label="Gift boxes"
                            aria-orientation="vertical"
                            className="no-scrollbar relative flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 max-lg:-mx-[var(--website-gutter)] max-lg:scroll-px-[var(--website-gutter)] max-lg:px-[var(--website-gutter)] lg:flex-col lg:overflow-visible lg:pb-0"
                        >
                            {products.map((product, index) => {
                                const selected = index === active
                                const name = formatProductName(product.name)
                                const thumb = photoOf(product)
                                return (
                                    <button
                                        key={product._id}
                                        ref={(el) => { tabRefs.current[index] = el }}
                                        id={tabId(product)}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        aria-controls={PANEL_ID}
                                        tabIndex={selected ? 0 : -1}
                                        onClick={() => select(index)}
                                        onKeyDown={(event) => onTabKey(event, index)}
                                        className={cn(
                                            'ef-focus group flex w-[15.5rem] shrink-0 snap-start items-center gap-3 rounded-card p-2 text-left transition-[background-color,box-shadow] duration-300 sm:w-[18rem] lg:w-full lg:gap-4 lg:p-3',
                                            selected
                                                ? 'bg-surface-card shadow-elev-2 ring-2 ring-brand'
                                                : 'bg-surface-card/50 ring-1 ring-line-soft hover:bg-surface-card hover:ring-line-strong'
                                        )}
                                    >
                                        <span className={cn('hidden w-6 shrink-0 text-[0.75rem] font-semibold tabular-nums lg:block', selected ? 'text-brand-bright' : 'text-ink-muted')}>
                                            {pad(index + 1)}
                                        </span>
                                        <span className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-[var(--radius-well)] bg-surface-well lg:w-16">
                                            {thumb && <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-header text-[1rem] font-semibold uppercase leading-tight text-ink-strong lg:text-[1.125rem]">{name}</span>
                                            {product.nickname && <span className="block truncate text-[0.8125rem] italic text-ink-muted">“{product.nickname}”</span>}
                                            <span className="mt-1 block text-[0.8125rem] tabular-nums text-ink-body">
                                                <strong className="font-semibold text-ink-strong">{formatINR(priceOf(product))}</strong>
                                                {product.sizes?.length > 0 && <> · {product.sizes.join(' / ')}</>}
                                            </span>
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'ef-icon-btn hidden !size-10 transition-[transform,background-color,color,border-color] duration-300 lg:inline-flex',
                                                selected ? 'rotate-45 border-brand bg-brand text-on-brand' : 'group-hover:rotate-45'
                                            )}
                                        >
                                            <ArrowUpRight />
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="mt-4 hidden text-[0.8125rem] leading-relaxed text-ink-muted lg:block">
                            Every box ships free across India. Gifting {MIN_GIFT_QUANTITY} or more? Each box can be branded at volume pricing.
                        </p>
                    </div>
                )}

                <div id={PANEL_ID} role="tabpanel" aria-labelledby={count > 1 ? tabId(current) : undefined} className="min-w-0" data-reveal>
                    <Spotlight
                        key={current._id}
                        product={current}
                        index={active}
                        count={count}
                        onPrev={() => select(active - 1)}
                        onNext={() => select(active + 1)}
                    />
                </div>
            </div>
        </Section>
    )
}

export default GiftCollection
