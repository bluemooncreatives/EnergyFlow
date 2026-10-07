'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Building2, ChevronDown, ShoppingBag, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { useReveal } from '@/hooks/useReveal'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { scrollToElement } from '@/lib/scroll'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from '../WishlistButton'
import CartQtyStepper from '../storefront/CartQtyStepper'
import { discountPercent, formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton } from './GiftingSelection'
import { SectionTag, pad, priceOf } from './GiftingUi'

const STAGE_ID = 'gift-stage'
const LIST_PREVIEW = 8
const MAX_PHOTOS = 5
const HOVER_DELAY = 110

const photosOf = (product) => {
    const media = (product.media || []).filter((m) => m?.secure_url).slice(0, MAX_PHOTOS)
    return media.length ? media : [{ _id: 'placeholder', secure_url: imgPlaceholder.src }]
}

// The chosen box, large: its photos, price and the buy actions. Keyed by the
// product, so its photo index resets and it fades in fresh.
const Stage = ({ product, index, count }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart, buyNow } = useCartProduct(product)
    const [photo, setPhoto] = useState(0)

    const name = formatProductName(product.name) || 'Gift box'
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const images = photosOf(product)
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const size = variant?.size || product.sizes?.[0]

    return (
        <div className="ef-tile relative h-full min-h-[27rem] bg-surface-well shadow-elev-2 duration-500 animate-in fade-in motion-reduce:animate-none sm:min-h-[34rem]">
            {images.map((img, i) => (
                <Image
                    key={img._id || i}
                    src={img.secure_url}
                    alt={i === photo ? (img.alt || `${name} gift box`) : ''}
                    fill
                    priority={index === 0 && i === 0}
                    sizes="(max-width: 768px) 94vw, (max-width: 1024px) 50vw, 36vw"
                    className={cn(
                        '-z-10 object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
                        i === photo ? 'opacity-100' : 'opacity-0'
                    )}
                />
            ))}

            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
                <div className="flex flex-wrap gap-1.5">
                    <span className="ef-badge ef-badge--inverse tabular-nums">{pad(index + 1)} / {pad(count)}</span>
                    {size && <span className="ef-badge ef-badge--soft">{size}</span>}
                    {off > 0 && <span className="ef-badge ef-badge--sale">{off}% off</span>}
                </div>
                <WishlistButton productId={product._id} name={product.name} />
            </div>

            {images.length > 1 && (
                <div className="absolute inset-x-0 top-14 flex justify-center gap-1.5 sm:top-16" role="group" aria-label={`${name} photos`}>
                    {images.map((img, i) => (
                        <button
                            key={img._id || i}
                            type="button"
                            onClick={() => setPhoto(i)}
                            aria-pressed={i === photo}
                            aria-label={`Show photo ${i + 1} of ${images.length}`}
                            className="ef-focus grid h-6 place-items-center rounded-full px-1"
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'block h-1.5 rounded-full shadow-elev-1 transition-[width,background-color] duration-300',
                                    i === photo ? 'w-6 bg-cream' : 'w-1.5 bg-cream/60'
                                )}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Frosted card over the photo: the box, its price, the actions. */}
            <div className="absolute inset-x-2 bottom-2 rounded-card bg-surface-card/90 p-3.5 shadow-elev-2 backdrop-blur-md sm:inset-x-3 sm:bottom-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="font-header text-[clamp(1.125rem,1rem+0.6vw,1.5rem)] font-semibold uppercase leading-tight text-ink-strong">
                            <Link href={href} className="ef-focus rounded-sm transition-colors hover:text-brand-bright">{name}</Link>
                        </h3>
                        {product.nickname && <p className="truncate text-[0.8125rem] italic text-olive-deep">“{product.nickname}”</p>}
                    </div>
                    <p className="shrink-0 text-right tabular-nums">
                        {formatINR(price) ? (
                            <>
                                <span className="block font-header text-[1.5rem] font-semibold leading-none text-ink-strong">{formatINR(price)}</span>
                                {Number(mrp) > Number(price) && (
                                    <span className="text-[0.8125rem] text-ink-muted line-through"><span className="sr-only">MRP </span>{formatINR(mrp)}</span>
                                )}
                            </>
                        ) : (
                            <span className="text-[0.8125rem] text-ink-muted">Price on request</span>
                        )}
                    </p>
                </div>
                {product.summary && <p className="ef-clamp-2 mt-2 text-[0.8125rem] leading-relaxed text-ink-body max-sm:hidden">{product.summary}</p>}

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    {inCart ? (
                        <CartQtyStepper qty={qty} atMax={atMax} onIncrease={increase} onDecrease={decrease} name={name} block className="!h-11" />
                    ) : (
                        <button
                            type="button"
                            className="ef-btn ef-btn--primary ef-btn--block [--btn-h:2.75rem]"
                            onClick={addToCart}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                        >
                            <ShoppingBag aria-hidden="true" /> Add to cart
                        </button>
                    )}
                    <button
                        type="button"
                        className="ef-btn ef-btn--accent [--btn-h:2.75rem] max-sm:!px-3.5"
                        onClick={buyNow}
                        disabled={!canAdd}
                        aria-label={canAdd ? `Buy now: ${name}` : `Unavailable: ${name}`}
                    >
                        <Zap aria-hidden="true" /> <span className="max-sm:sr-only">Buy now</span>
                    </button>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-3 text-[0.75rem] text-ink-muted">
                    <span>Per box{size ? ` · ${size}` : ''} · free delivery</span>
                    <Link href={href} className="ef-focus inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-ink-strong hover:text-brand-bright">
                        Details <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

/**
 * "Our boxes", after the reference's three-column collection block: the
 * pitch on the left (label, headline, bulk CTA, a footnote at the bottom),
 * the chosen box as a tall photo in the middle with its buy actions, and a
 * ruled index of every box with its price on the right. Pointing at a row
 * previews it; choosing one keeps it.
 *
 * Phones stack it as pitch → photo → index → footnote, and choosing a row
 * brings the photo back into view. Tablets put the photo beside the rest.
 */
const GiftCollectionIndex = ({ products = [], content, number }) => {
    const rootRef = useRef(null)
    const stageRef = useRef(null)
    const hoverRef = useRef(0)
    const [active, setActive] = useState(0)
    const [expanded, setExpanded] = useState(false)
    useReveal(rootRef, [products.length])

    useEffect(() => () => window.clearTimeout(hoverRef.current), [])

    const count = products.length
    if (!count) return null
    const current = products[Math.min(active, count - 1)]
    const listed = expanded ? products : products.slice(0, LIST_PREVIEW)
    // Keep the chosen box listed even when it sits past the preview cut.
    const hiddenActive = !expanded && active >= LIST_PREVIEW

    const choose = (index, { reveal = false } = {}) => {
        window.clearTimeout(hoverRef.current)
        setActive(index)
        if (!reveal) return
        const stage = stageRef.current
        if (stage && window.matchMedia('(max-width: 767px)').matches) {
            const rect = stage.getBoundingClientRect()
            if (rect.top < 72 || rect.top > window.innerHeight * 0.5) scrollToElement(stage)
        }
    }

    const preview = (event, index) => {
        if (event.pointerType !== 'mouse') return
        window.clearTimeout(hoverRef.current)
        hoverRef.current = window.setTimeout(() => setActive(index), HOVER_DELAY)
    }

    // A render helper, not a component: rows must keep their identity across
    // renders so a keyboard user's focus stays on the row they chose.
    const renderRow = (product, index) => {
        const selected = index === active
        return (
            <li key={product._id} className="border-b border-line-strong">
                <button
                    type="button"
                    aria-pressed={selected}
                    aria-controls={STAGE_ID}
                    onClick={() => choose(index, { reveal: true })}
                    onPointerEnter={(event) => preview(event, index)}
                    onPointerLeave={() => window.clearTimeout(hoverRef.current)}
                    className="ef-focus group relative flex w-full items-center gap-3 py-3.5 pl-1 pr-1 text-left sm:py-4"
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'absolute -bottom-px left-0 h-0.5 bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none',
                            selected ? 'w-full' : 'w-0'
                        )}
                    />
                    <span className={cn('w-6 shrink-0 text-[0.75rem] font-semibold tabular-nums', selected ? 'text-brand-bright' : 'text-ink-muted')}>
                        {pad(index + 1)}
                    </span>
                    <span className={cn('min-w-0 flex-1 truncate text-[0.9375rem] font-medium transition-colors sm:text-base', selected ? 'text-ink-strong' : 'text-ink-body group-hover:text-ink-strong')}>
                        {formatProductName(product.name)}
                    </span>
                    <span className="shrink-0 text-[0.8125rem] tabular-nums text-ink-muted">
                        {formatINR(priceOf(product)) || 'On request'}
                    </span>
                    <ArrowUpRight
                        aria-hidden="true"
                        className={cn(
                            'size-4 shrink-0 transition-[transform,color] duration-300',
                            selected ? 'rotate-45 text-brand-bright' : 'text-ink-muted group-hover:rotate-45'
                        )}
                    />
                </button>
            </li>
        )
    }

    return (
        <section
            ref={rootRef}
            id={COLLECTION_ANCHOR}
            className="ef-section ef-section--page scroll-mt-20"
            aria-labelledby="collection-title"
        >
            <div className="ef-container grid gap-x-[clamp(1.25rem,3vw,3rem)] gap-y-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
                {/* ── Pitch ── */}
                <div className="flex flex-col items-start gap-5 md:col-start-1 md:row-start-1" data-reveal>
                    <SectionTag number={number} eyebrow={content.eyebrow} />
                    <h2 id="collection-title" className="ef-title">
                        {content.title}
                        {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                    </h2>
                    <EnquireButton className="ef-btn ef-btn--primary">
                        Plan a bulk order <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                    </EnquireButton>
                </div>

                {/* ── Stage ── */}
                <div
                    ref={stageRef}
                    id={STAGE_ID}
                    className="min-w-0 scroll-mt-24 md:col-start-2 md:row-span-3 md:row-start-1 lg:row-span-2"
                    data-reveal
                >
                    <Stage key={current._id} product={current} index={Math.min(active, count - 1)} count={count} />
                </div>

                {/* ── Index ── */}
                <div className="min-w-0 md:col-start-1 md:row-start-2 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-end" data-reveal>
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-header text-[clamp(1.375rem,1.1rem+0.8vw,1.875rem)] font-medium leading-tight text-ink-strong">{content.listTitle}</h3>
                        <span className="shrink-0 text-[0.8125rem] tabular-nums text-ink-muted">{count} {count === 1 ? 'box' : 'boxes'}</span>
                    </div>
                    <ul className="mt-3 border-t border-line-strong" aria-label={content.listTitle}>
                        {listed.map((product, index) => renderRow(product, index))}
                        {hiddenActive && renderRow(current, active)}
                    </ul>
                    {count > LIST_PREVIEW && (
                        <button
                            type="button"
                            onClick={() => setExpanded((open) => !open)}
                            aria-expanded={expanded}
                            className="ef-focus mt-3 inline-flex items-center gap-1.5 rounded-sm text-[0.8125rem] font-semibold text-ink-strong hover:text-brand-bright"
                        >
                            {expanded ? 'Show fewer' : `Show all ${count} boxes`}
                            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {/* ── Footnote ── */}
                {(content.noteTitle || content.note) && (
                    <div className="max-w-sm md:col-start-1 md:row-start-3 lg:row-start-2 lg:self-end" data-reveal>
                        {content.noteTitle && <p className="text-[0.9375rem] font-semibold text-ink-strong">{content.noteTitle}</p>}
                        {content.note && <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-muted">{content.note}</p>}
                        <EnquireButton
                            productId={current._id}
                            className="ef-focus mt-3 inline-flex items-center gap-2 rounded-sm text-left text-[0.8125rem] text-ink-strong transition-colors hover:text-brand-bright"
                            aria-label={`Enquire about bulk orders of ${formatProductName(current.name)}`}
                        >
                            <Building2 className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
                            <span>Ordering {MIN_GIFT_QUANTITY}+ of this box? <strong className="font-semibold underline underline-offset-2">Get bulk pricing</strong></span>
                        </EnquireButton>
                    </div>
                )}
            </div>
        </section>
    )
}

export default GiftCollectionIndex
