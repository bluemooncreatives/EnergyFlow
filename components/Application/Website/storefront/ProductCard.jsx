'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Eye, Plus, ShoppingBag, Star, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useCartProduct } from '@/hooks/useCartProduct'
import { cn } from '@/lib/utils'
import { discountPercent, formatINR } from './format'

const DEFAULT_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1440px) 22vw, 300px'

// Rating row only when there is something to say — a wall of empty stars and
// "0 (0)" on a young catalogue reads as "everyone hated this".
export const Rating = ({ value, count, className }) => {
    const avg = Number(value) || 0
    const total = Number(count) || 0
    if (total <= 0 || avg <= 0) return null

    return (
        <span
            className={cn('inline-flex items-center gap-1 text-[12px] font-medium text-ink-body', className)}
            aria-label={`Rated ${avg.toFixed(1)} out of 5 from ${total} review${total === 1 ? '' : 's'}`}
        >
            <Star className="size-3.5 fill-amber text-amber" aria-hidden="true" />
            {avg.toFixed(1)}
            <span className="text-ink-muted">({total})</span>
        </span>
    )
}

export const Price = ({ price, mrp, className }) => {
    const now = formatINR(price)
    if (!now) return null
    const was = Number(mrp) > Number(price) ? formatINR(mrp) : null

    return (
        <span className={cn('flex min-w-0 flex-wrap items-baseline gap-x-1.5', className)}>
            <span className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink-strong">{now}</span>
            {was && (
                <span className="text-[12px] text-ink-muted line-through">
                    <span className="sr-only">MRP </span>{was}
                </span>
            )}
        </span>
    )
}

/**
 * The storefront product card — used by every product grid and rail.
 *
 * actions:
 *   "quick" — price, then a Buy now + round add button row (home grids, rails)
 *   "bar"   — full-width add button at the foot (deal cards)
 *   "full"  — Add to cart + Buy now pair (shop grid, related products)
 * gallery:  cycle through every product image with arrows + dots.
 * children: extra content pinned to the card foot (e.g. a countdown).
 */
const ProductCard = ({
    product,
    actions = 'quick',
    gallery = false,
    priority = false,
    sizes = DEFAULT_SIZES,
    className,
    children,
}) => {
    const { variant, inCart, canAdd, addToCart, buyNow } = useCartProduct(product)
    const [imgIndex, setImgIndex] = useState(0)

    if (!product) return null

    const href = WEBSITE_PRODUCT_DETAILS(product.slug)
    const name = product.name || 'Product'

    // Show what "Add" actually puts in the cart: the default variant's pack
    // and price, falling back to the product-level price.
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const packSize = variant?.size

    const media = Array.isArray(product.media) ? product.media.filter((m) => m?.secure_url) : []
    const images = media.length ? media : [{ secure_url: imgPlaceholder.src, alt: name }]
    const canSlide = gallery && images.length > 1
    const active = images[Math.min(imgIndex, images.length - 1)]

    const slide = (event, dir) => {
        event.preventDefault()
        event.stopPropagation()
        setImgIndex((i) => (i + dir + images.length) % images.length)
    }

    const addLabel = canAdd ? `Add ${name} to cart` : `${name} is currently unavailable`
    const buyLabel = canAdd ? `Buy ${name} now` : `${name} is currently unavailable`

    return (
        <article className={cn('ef-card ef-card--interactive group/card @container/card h-full', className)}>
            {/* ── Image well ── */}
            <div className="p-2 pb-0 @[15rem]/card:p-2.5 @[15rem]/card:pb-0">
                <div className="relative aspect-square overflow-hidden rounded-well bg-surface-well">
                    <Link href={href} className="ef-focus absolute inset-0 rounded-well" aria-label={`View ${name}`} tabIndex={-1}>
                        <Image
                            src={active?.secure_url || imgPlaceholder.src}
                            alt={active?.alt || name}
                            fill
                            sizes={sizes}
                            priority={priority}
                            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100"
                        />
                    </Link>

                    {off > 0 && (
                        <span className="ef-badge ef-badge--sale pointer-events-none absolute left-2.5 top-2.5 z-10">
                            {off}% off
                        </span>
                    )}

                    {actions === 'full' && (
                        <Link
                            href={href}
                            aria-label={`Quick view ${name}`}
                            className="ef-focus absolute right-2.5 top-2.5 z-10 flex size-9 items-center justify-center rounded-full bg-surface-card/90 text-brand shadow-elev-1 backdrop-blur-sm transition-opacity duration-200 hover:bg-surface-card focus-visible:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
                        >
                            <Eye className="size-4" aria-hidden="true" />
                        </Link>
                    )}

                    {canSlide && (
                        <>
                            <button
                                type="button"
                                aria-label={`Previous image of ${name}`}
                                onClick={(e) => slide(e, -1)}
                                className="ef-focus absolute left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card/90 text-brand shadow-elev-1 transition-opacity duration-200 focus-visible:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
                            >
                                <ChevronLeft className="size-4" aria-hidden="true" />
                            </button>
                            <button
                                type="button"
                                aria-label={`Next image of ${name}`}
                                onClick={(e) => slide(e, 1)}
                                className="ef-focus absolute right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-card/90 text-brand shadow-elev-1 transition-opacity duration-200 focus-visible:opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100"
                            >
                                <ChevronRight className="size-4" aria-hidden="true" />
                            </button>
                            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5" aria-hidden="true">
                                {images.map((img, i) => (
                                    <span
                                        key={img.secure_url + i}
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            i === imgIndex ? 'w-4 bg-brand' : 'w-1.5 bg-surface-card/80'
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-3 @[15rem]/card:px-4 @[15rem]/card:pb-4">
                {(product.category?.name || Number(product.ratingCount) > 0) && (
                <div className="flex min-h-[1.125rem] items-center justify-between gap-2">
                    {product.category?.name ? (
                        <Link
                            href={`${WEBSITE_SHOP}?category=${encodeURIComponent(product.category.slug)}`}
                            className="ef-focus truncate text-[12px] text-ink-muted transition-colors hover:text-brand"
                        >
                            {product.category.name}
                        </Link>
                    ) : <span />}
                    <Rating value={product.ratingAvg} count={product.ratingCount} className="shrink-0" />
                </div>
                )}

                <h3 className="text-[0.9375rem] font-medium leading-[1.3] tracking-[-0.005em] text-ink-strong">
                    <Link href={href} title={name} className="ef-focus ef-clamp-2 rounded-sm transition-colors hover:text-brand-hover">
                        {name}
                    </Link>
                </h3>

                {/* Price, then the quick actions on their own row — the same
                    structure on every card and at every width, so a long price
                    (MRP shown) can never push the actions somewhere else. The
                    block sits at the card foot so rows of cards line up. */}
                <div className="mt-auto flex flex-col gap-2.5">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                        <Price price={price} mrp={mrp} />
                        {packSize && (
                            <span className="shrink-0 rounded-full bg-surface-well px-2 py-0.5 text-[11px] font-medium leading-4 text-ink-body">
                                <span className="sr-only">Pack size </span>{packSize}
                            </span>
                        )}
                    </div>

                    {actions === 'quick' && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={buyNow}
                                disabled={!canAdd}
                                aria-label={buyLabel}
                                title={canAdd ? 'Buy now' : 'Unavailable'}
                                className="ef-focus flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-amber px-4 text-[0.8125rem] font-medium text-brand-deep shadow-elev-1 transition-[background-color,transform] hover:scale-[1.02] hover:bg-[#F5C161] disabled:pointer-events-none disabled:opacity-40"
                            >
                                <Zap className="size-3.5 shrink-0" aria-hidden="true" />
                                {canAdd ? 'Buy now' : 'Unavailable'}
                            </button>

                            {inCart ? (
                                <Link
                                    href={WEBSITE_CART}
                                    aria-label={`${name} is in your cart. View cart`}
                                    title="In cart — view cart"
                                    className="ef-focus flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-elev-1 transition-transform hover:scale-105"
                                >
                                    <Check className="size-[1.1rem]" strokeWidth={2.5} aria-hidden="true" />
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={addToCart}
                                    disabled={!canAdd}
                                    aria-label={addLabel}
                                    title={canAdd ? 'Add to cart' : 'Unavailable'}
                                    className="ef-focus flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-elev-1 transition-[background-color,transform] hover:scale-105 hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <Plus className="size-[1.1rem]" strokeWidth={2.5} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {actions === 'bar' && (
                    inCart ? (
                        <Link href={WEBSITE_CART} className="ef-btn ef-btn--outline ef-btn--sm ef-btn--block mt-2">
                            <Check aria-hidden="true" strokeWidth={2.5} /> In cart · View
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={addToCart}
                            disabled={!canAdd}
                            aria-label={addLabel}
                            className="ef-btn ef-btn--primary ef-btn--sm ef-btn--block mt-2"
                        >
                            <ShoppingBag aria-hidden="true" /> {canAdd ? 'Add to cart' : 'Unavailable'}
                        </button>
                    )
                )}

                {actions === 'full' && (
                    <div className="mt-2 grid grid-cols-1 gap-2 @[17rem]/card:grid-cols-2">
                        {inCart ? (
                            <Link href={WEBSITE_CART} className="ef-btn ef-btn--outline ef-btn--sm ef-btn--block">
                                <Check aria-hidden="true" strokeWidth={2.5} /> Go to cart
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={addToCart}
                                disabled={!canAdd}
                                aria-label={addLabel}
                                className="ef-btn ef-btn--outline ef-btn--sm ef-btn--block"
                            >
                                <ShoppingBag aria-hidden="true" /> Add to cart
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={buyNow}
                            disabled={!canAdd}
                            aria-label={buyLabel}
                            className="ef-btn ef-btn--primary ef-btn--sm ef-btn--block"
                        >
                            Buy now
                        </button>
                    </div>
                )}

                {children}
            </div>
        </article>
    )
}

export default memo(ProductCard)
