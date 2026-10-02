'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Building2, Check, ShoppingBag, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from '../WishlistButton'
import CartQtyStepper from '../storefront/CartQtyStepper'
import RailControls from '../storefront/RailControls'
import RailPager from '../storefront/RailPager'
import Section from '../storefront/Section'
import SectionHeader from '../storefront/SectionHeader'
import { discountPercent, formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton } from './GiftingSelection'
import { pad } from './GiftingUi'

const MAX_PHOTOS = 5

const GiftCard = ({ product, index }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart, buyNow } = useCartProduct(product)
    const [photo, setPhoto] = useState(0)
    const [hovering, setHovering] = useState(false)

    const name = formatProductName(product.name) || 'Gift box'
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const media = (product.media || []).filter((m) => m?.secure_url).slice(0, MAX_PHOTOS)
    const images = media.length ? media : [{ _id: 'placeholder', secure_url: imgPlaceholder.src }]
    // A mouse hovering an untouched card previews its second photo.
    const shown = hovering && photo === 0 && images.length > 1 ? 1 : photo

    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const size = variant?.size || product.sizes?.[0]

    return (
        <article className="ef-card ef-card--interactive h-full p-2" aria-labelledby={`gift-${product._id}`}>
            <div
                className="ef-tile aspect-[4/4.2] bg-surface-well"
                onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHovering(true) }}
                onPointerLeave={() => setHovering(false)}
            >
                <Link href={href} className="ef-focus absolute inset-0 rounded-[inherit]" aria-label={`View ${name}`} tabIndex={-1}>
                    {images.map((img, i) => (
                        <Image
                            key={img._id || i}
                            src={img.secure_url}
                            alt={i === shown ? (img.alt || `${name} gift box`) : ''}
                            fill
                            priority={index === 0 && i === 0}
                            sizes="(max-width: 768px) 84vw, (max-width: 1280px) 46vw, 30vw"
                            className={cn(
                                'object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none',
                                i === shown ? 'opacity-100' : 'opacity-0'
                            )}
                        />
                    ))}
                </Link>

                <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {size && <span className="ef-badge ef-badge--soft">{size}</span>}
                    {off > 0 && <span className="ef-badge ef-badge--sale">{off}% off</span>}
                </div>
                <div className="absolute right-3 top-3">
                    <WishlistButton productId={product._id} name={product.name} />
                </div>

                {images.length > 1 && (
                    <div className="absolute inset-x-0 bottom-2 flex justify-center" role="group" aria-label={`${name} photos`}>
                        {images.map((img, i) => (
                            <button
                                key={img._id || i}
                                type="button"
                                className="ef-focus grid size-6 place-items-center rounded-full"
                                aria-pressed={i === shown}
                                aria-label={`Show photo ${i + 1} of ${images.length}`}
                                onClick={() => setPhoto(i)}
                            >
                                <span className={cn(
                                    'block h-1.5 rounded-full shadow-elev-1 transition-[width,background-color] duration-300 motion-reduce:transition-none',
                                    i === shown ? 'w-5 bg-surface-card' : 'w-1.5 bg-surface-card/60'
                                )} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-4 px-2.5 pb-2.5 pt-4">
                <div>
                    <p className="text-[0.75rem] font-semibold uppercase text-ink-muted">
                        Signature box {pad(index + 1)}{product.sizes?.length > 1 ? ` · ${product.sizes.join(' / ')}` : ''}
                    </p>
                    <h3 id={`gift-${product._id}`} className="mt-1.5 font-header text-[clamp(1.5rem,1.2rem+0.9vw,1.875rem)] font-semibold uppercase leading-none text-ink-strong">
                        <Link href={href} className="ef-focus rounded-sm transition-colors hover:text-brand-bright">{name}</Link>
                    </h3>
                    {product.nickname && <p className="mt-1.5 text-[0.875rem] italic text-olive-deep">“{product.nickname}”</p>}
                </div>

                {product.summary && <p className="ef-clamp-2 text-[0.875rem] leading-relaxed text-ink-body">{product.summary}</p>}

                {product.highlights?.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Highlights">
                        {product.highlights.map((item) => (
                            <li
                                key={item.title}
                                title={item.detail || undefined}
                                className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-tint-pistachio px-2 py-1 text-[0.75rem] font-medium text-ink-strong"
                            >
                                <Check className="size-3.5 text-brand-bright" strokeWidth={3} aria-hidden="true" /> {item.title}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-auto flex flex-col gap-3 border-t border-line-soft pt-4">
                    <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 tabular-nums">
                        {formatINR(price) ? (
                            <>
                                <span className="font-header text-[1.75rem] font-semibold leading-none text-ink-strong">{formatINR(price)}</span>
                                {Number(mrp) > Number(price) && (
                                    <span className="text-[0.875rem] text-ink-muted line-through"><span className="sr-only">MRP </span>{formatINR(mrp)}</span>
                                )}
                                <span className="text-[0.75rem] text-ink-muted">per box, incl. taxes</span>
                            </>
                        ) : (
                            <span className="text-[0.875rem] text-ink-muted">Price on request</span>
                        )}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        {inCart ? (
                            <CartQtyStepper qty={qty} atMax={atMax} onIncrease={increase} onDecrease={decrease} name={name} block className="!h-12" />
                        ) : (
                            <button
                                type="button"
                                className="ef-btn ef-btn--primary !px-3"
                                onClick={addToCart}
                                disabled={!canAdd}
                                aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                            >
                                <ShoppingBag aria-hidden="true" /> Add to cart
                            </button>
                        )}
                        <button
                            type="button"
                            className="ef-btn ef-btn--accent !px-3"
                            onClick={buyNow}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Buy now: ${name}` : `Unavailable: ${name}`}
                        >
                            <Zap aria-hidden="true" /> Buy now
                        </button>
                    </div>

                    <EnquireButton
                        productId={product._id}
                        className="ef-focus flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-surface-sunken px-3 py-2.5 text-left text-[0.8125rem] text-ink-strong transition-colors hover:bg-tint-pistachio"
                        aria-label={`Enquire about bulk orders of ${name}`}
                    >
                        <span className="inline-flex items-center gap-2">
                            <Building2 className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
                            <span>Ordering {MIN_GIFT_QUANTITY}+? <strong className="font-semibold">Get bulk pricing</strong></span>
                        </span>
                        <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </EnquireButton>
                </div>
            </div>
        </article>
    )
}

// Last stop on the rail: the way into a custom / branded order.
const BulkPromo = () => (
    <aside className="ef-tile flex h-full min-h-[26rem] flex-col justify-between gap-8 bg-sun p-6 text-sun-ink sm:p-8" aria-label="Bulk and corporate orders">
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 -z-10 size-72 rounded-full border-[1.75rem] border-pine/10" />
        <div className="flex flex-col items-start gap-4">
            <span className="ef-seal ef-seal--pine !size-14"><Building2 aria-hidden="true" /></span>
            <p className="font-header text-[clamp(2.25rem,1.7rem+2vw,3.25rem)] font-semibold uppercase leading-[0.95]">Need 50? Or&nbsp;500?</p>
            <p className="max-w-xs text-[0.9375rem] leading-relaxed">
                Branded sleeves, message cards and a mix built around your budget, with one clear quote at volume pricing.
            </p>
        </div>
        <EnquireButton className="ef-btn ef-btn--pine self-start">
            Plan a bulk order <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
        </EnquireButton>
    </aside>
)

/**
 * "The signature collection" — every gift box on a swipeable rail of cards
 * (photos, highlights, price, cart and bulk actions), ending on a sunflower
 * bulk-order tile.
 */
const GiftCollection = ({ products = [] }) => {
    const rootRef = useRef(null)
    const rail = useScrollRail()
    useReveal(rootRef, [products.length])

    return (
        <Section ref={rootRef} id={COLLECTION_ANCHOR} tone="page" className="scroll-mt-20" aria-labelledby="collection-title">
            <SectionHeader
                id="collection-title"
                eyebrow={`The signature collection · ${products.length} ${products.length === 1 ? 'box' : 'boxes'}`}
                title="Pick a box,"
                accent="make their day"
                description="Ready-to-gift boxes, delivered free across India. Buy one today, or brand a few hundred."
                action={<RailControls rail={rail} label="gift boxes" className="hidden sm:flex" />}
            />

            <RailPager rail={rail} label="gift boxes" className="mb-4 sm:hidden" />

            <ol
                ref={rail.railRef}
                className="ef-rail no-scrollbar list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:px-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)]"
                style={{ '--rail-item': 'clamp(17.5rem, 84vw, 26rem)' }}
                aria-label="Gift boxes"
            >
                {products.map((product, index) => (
                    <li key={product._id} className="min-w-0" data-reveal>
                        <GiftCard product={product} index={index} />
                    </li>
                ))}
                <li className="min-w-0" data-reveal>
                    <BulkPromo />
                </li>
            </ol>
        </Section>
    )
}

export default GiftCollection
