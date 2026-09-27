'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { useCartProduct } from '@/hooks/useCartProduct'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import RailControls from './storefront/RailControls'
import { Price } from './storefront/ProductCard'
import { StoreLink } from './storefront/StoreButton'
import { discountPercent } from './storefront/format'

// Harvest tints for the photo mats, cycled card by card.
const MATS = [
    'var(--tint-honey)',
    'var(--tint-almond)',
    'var(--tint-pistachio)',
    'var(--tint-berry)',
    'var(--tint-sage)',
    'var(--tint-oat)',
]

const rank = (n) => String(n).padStart(2, '0')

// "Harvest tag" card: the photo sits inset in the card, a rank medallion
// straddles the photo's edge, a discount reads as a round price sticker, and
// the actions sit below a notched, perforated line like a shop tag.
const BestsellerCard = ({ product, position }) => {
    const { variant, inCart, canAdd, addToCart, buyNow } = useCartProduct(product)
    const name = product.name || 'Product'
    const href = WEBSITE_PRODUCT_DETAILS(product.slug)
    const image = product.media?.find((m) => m?.secure_url) || { secure_url: imgPlaceholder.src }
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)

    return (
        <article className="group/best relative flex h-full flex-col overflow-hidden rounded-card bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            {/* Photo inset by a single border; the tint shows behind transparent images */}
            <div className="relative p-2.5 pb-0">
                <div
                    className="relative aspect-square overflow-hidden rounded-well"
                    style={{ backgroundColor: MATS[(position - 1) % MATS.length] }}
                >
                    <Image
                        src={image.secure_url}
                        alt={image.alt || name}
                        fill
                        sizes="(max-width: 640px) 70vw, 288px"
                        className="object-cover transition-transform duration-700 ease-out group-hover/best:scale-[1.05] motion-reduce:transition-none"
                    />
                </div>

                {off > 0 && (
                    <span className="absolute right-4 top-4 flex size-12 rotate-12 flex-col items-center justify-center rounded-full bg-amber leading-none text-brand-deep shadow-elev-1">
                        <span className="text-[0.9375rem] font-semibold">{off}%</span>
                        <span className="text-[0.5625rem] font-semibold uppercase">off</span>
                    </span>
                )}

                {/* Rank medallion, half on the mat, half on the body */}
                <span
                    aria-hidden="true"
                    className="absolute -bottom-5 left-5 flex size-11 items-center justify-center rounded-full bg-brand font-header text-[1.0625rem] text-white ring-4 ring-surface-card"
                >
                    {rank(position)}
                </span>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
                <p className="text-[0.75rem] font-medium text-cocoa">
                    Bestseller{variant?.size ? ` · ${variant.size}` : ''}
                </p>
                <h3 className="mt-1 text-[1rem] font-medium leading-[1.3] tracking-[-0.01em] text-ink-strong">
                    {/* The name's link covers the card; the actions sit above it. */}
                    <Link
                        href={href}
                        title={name}
                        className="ef-focus ef-clamp-2 rounded-sm transition-colors after:absolute after:inset-0 after:content-[''] hover:text-brand"
                    >
                        <span className="sr-only">Number {position}: </span>{name}
                    </Link>
                </h3>
                <Price price={price} mrp={mrp} className="mt-2" />

                {/* Perforation with side notches (the notches take the band colour) */}
                <div className="relative z-10 mt-auto pt-4">
                    <div className="relative border-t border-dashed border-line-strong">
                        <span aria-hidden="true" className="absolute -left-[1.4375rem] top-0 size-3.5 -translate-y-1/2 rounded-full bg-surface-sunken" />
                        <span aria-hidden="true" className="absolute -right-[1.4375rem] top-0 size-3.5 -translate-y-1/2 rounded-full bg-surface-sunken" />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={buyNow}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Buy ${name} now` : `${name} is currently unavailable`}
                            className="ef-focus inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-control)] bg-brand px-4 text-[0.8125rem] font-medium text-white transition-colors hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Zap className="size-3.5" aria-hidden="true" /> {canAdd ? 'Buy now' : 'Unavailable'}
                        </button>
                        {inCart ? (
                            <Link
                                href={WEBSITE_CART}
                                aria-label={`${name} is in your cart. View cart`}
                                title="In cart — view cart"
                                className="ef-focus flex size-10 shrink-0 items-center justify-center rounded-full bg-cocoa text-white"
                            >
                                <Check className="size-[1.1rem]" strokeWidth={2.5} aria-hidden="true" />
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={addToCart}
                                disabled={!canAdd}
                                aria-label={canAdd ? `Add ${name} to cart` : `${name} is currently unavailable`}
                                title="Add to cart"
                                className="ef-focus flex size-10 shrink-0 items-center justify-center rounded-full bg-cocoa text-white transition-colors hover:bg-cocoa-deep disabled:pointer-events-none disabled:opacity-40"
                            >
                                <Plus className="size-[1.1rem]" strokeWidth={2.5} aria-hidden="true" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}

const BestsellersSectionClient = ({ products = [] }) => {
    const sectionRef = useRef(null)
    const rail = useScrollRail()
    useReveal(sectionRef, [products.length])

    if (!products.length) return null

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="bestsellers-title">
            <SectionHeader
                id="bestsellers-title"
                eyebrow="Most reordered"
                title="Our"
                accent="bestsellers"
                description="Ranked by what our customers come back for, again and again."
                action={
                    <>
                        <StoreLink href={`${WEBSITE_SHOP}?bestseller=true`} className="mr-2">Shop all bestsellers</StoreLink>
                        <RailControls rail={rail} label="bestsellers" className="hidden sm:flex" />
                    </>
                }
            />

            {/* Native scroller: swipe on touch, arrows on desktop, snap on both.
                On small screens it bleeds to the viewport edge so the next card
                peeks in. The native scrollbar is hidden. */}
            <ol
                ref={rail.railRef}
                className="ef-rail no-scrollbar list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:px-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)]"
                style={{ '--rail-item': 'clamp(15rem, 70vw, 18rem)' }}
                aria-label="Bestselling products, ranked"
            >
                {products.map((product, i) => (
                    <li key={product._id} data-reveal className="min-w-0">
                        <BestsellerCard product={product} position={i + 1} />
                    </li>
                ))}
            </ol>
        </Section>
    )
}

export default BestsellersSectionClient
