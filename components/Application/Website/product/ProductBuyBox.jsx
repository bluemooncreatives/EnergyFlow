'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
    ArrowDown,
    ArrowRight,
    Check,
    Minus,
    PackageCheck,
    Plus,
    RefreshCw,
    Share2,
    ShieldCheck,
    ShoppingBag,
    Star,
    StarHalf,
    Truck,
    Zap,
} from 'lucide-react'
import { formatINR } from '@/components/Application/Website/storefront/format'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import { scrollToElement } from '@/lib/scroll'
import { WEBSITE_CART, WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import WishlistButton from '@/components/Application/Website/WishlistButton'
import AnimatedPrice from './AnimatedPrice'
import PackSizePicker from './PackSizePicker'
import { deliveryWindow, savingOf, unitPriceLabel } from './productUtils'

export const RatingStars = ({ value = 0, className = 'size-4' }) => (
    <span className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
            const position = i + 1
            if (value >= position) return <Star key={i} className={cn(className, 'fill-gold text-gold')} />
            if (value >= position - 0.5) return <StarHalf key={i} className={cn(className, 'fill-gold text-gold')} />
            return <Star key={i} className={cn(className, 'text-ink-strong/20')} />
        })}
    </span>
)

// Quantity stepper used both before adding (how many to add) and once the
// pack is in the cart (bound to the cart line). `tone` tells them apart.
export const Stepper = ({ value, onDec, onInc, decDisabled, incDisabled, decLabel = 'Decrease quantity', tone = 'well', size = 'lg' }) => (
    <div
        className={cn(
            'inline-flex shrink-0 items-center rounded-[var(--radius-control)] p-1',
            size === 'lg' ? 'h-[3.25rem]' : 'h-11',
            tone === 'cart' ? 'bg-tint-honey text-brand shadow-[inset_0_0_0_1px_var(--line-soft)]' : 'bg-surface-well text-ink-strong'
        )}
    >
        <button
            type="button"
            onClick={onDec}
            disabled={decDisabled}
            aria-label={decLabel}
            className="ef-focus flex h-full w-9 items-center justify-center rounded-[calc(var(--radius-control)-2px)] transition hover:bg-surface-card disabled:pointer-events-none disabled:opacity-35 sm:w-10"
        >
            <Minus className="size-4" aria-hidden="true" />
        </button>
        <span className="w-8 select-none text-center text-[0.9375rem] font-semibold tabular-nums sm:w-9" aria-live="polite">
            {value}
        </span>
        <button
            type="button"
            onClick={onInc}
            disabled={incDisabled}
            aria-label="Increase quantity"
            className="ef-focus flex h-full w-9 items-center justify-center rounded-[calc(var(--radius-control)-2px)] transition hover:bg-surface-card disabled:pointer-events-none disabled:opacity-35 sm:w-10"
        >
            <Plus className="size-4" aria-hidden="true" />
        </button>
    </div>
)

const TRUST = [
    { icon: Truck, title: 'Free shipping', sub: 'On prepaid orders' },
    { icon: RefreshCw, title: 'Easy returns', sub: 'Damaged or wrong items' },
    { icon: ShieldCheck, title: 'Secure checkout', sub: '100% protected' },
]

/**
 * Everything needed to decide and buy: name, rating, price (with unit price
 * and savings), pack size, quantity, add / buy, delivery estimate and trust.
 * The forwarded ref marks the call-to-action block; the sticky bar appears
 * once it scrolls out of view.
 */
const ProductBuyBox = forwardRef(function ProductBuyBox({
    product,
    variant,
    variants,
    onSelectVariant,
    cart,
    onAdd,
    reviewCount,
    ratingAvg,
    summary,
    hasDetails,
}, ctaRef) {
    const [qty, setQty] = useState(1)
    const [justAdded, setJustAdded] = useState(false)
    const [delivery, setDelivery] = useState(null)
    const addedTimer = useRef(null)

    // A new pack starts from one.
    useEffect(() => { setQty(1) }, [variant?._id])
    // Dates come from the shopper's own clock, so only after mount.
    useEffect(() => { setDelivery(deliveryWindow()) }, [])
    useEffect(() => () => clearTimeout(addedTimer.current), [])

    const name = product.name
    const words = name.split(/\s+/).filter(Boolean)
    const { amount: saved, percent } = savingOf(variant)
    const unit = unitPriceLabel(variant?.sellingPrice, variant?.size)

    const handleAdd = () => {
        if (!onAdd(qty)) return
        setJustAdded(true)
        clearTimeout(addedTimer.current)
        addedTimer.current = setTimeout(() => setJustAdded(false), 1800)
    }

    const handleShare = async () => {
        const url = window.location.href
        try {
            if (navigator.share) {
                await navigator.share({ title: name, text: `${name} on Energyflow`, url })
                return
            }
            await navigator.clipboard.writeText(url)
            showToast('success', 'Link copied to clipboard.')
        } catch (error) {
            // Closing the share sheet is not an error worth reporting.
            if (error?.name !== 'AbortError') showToast('error', 'Could not share this link. Copy it from the address bar.')
        }
    }

    const scrollTo = (id) => (event) => {
        event.preventDefault()
        scrollToElement(id)
    }

    return (
        <div className="flex flex-col">
            {/* Category + share */}
            <div className="ef-pd-in flex items-center justify-between gap-3" style={{ '--i': 0 }}>
                {product.category?.slug ? (
                    <Link href={WEBSITE_CATEGORY(product.category.slug)} className="ef-eyebrow ef-focus min-w-0 whitespace-normal leading-tight transition-colors hover:text-brand-hover">
                        {product.category.name}
                    </Link>
                ) : (
                    <span className="ef-eyebrow">Energyflow</span>
                )}
                <div className="flex shrink-0 items-center gap-2">
                    <WishlistButton productId={product._id} name={name} variant="icon" />
                    <button type="button" onClick={handleShare} className="ef-icon-btn size-10 shrink-0" aria-label={`Share ${name}`}>
                        <Share2 aria-hidden="true" className="!size-4" />
                    </button>
                </div>
            </div>

            <h1 className="ef-pd-title mt-5">
                {words.map((word, i) => (
                    <span key={`${word}-${i}`}>
                        <span className="ef-pd-word"><span style={{ '--i': i }}>{word}</span></span>
                        {i < words.length - 1 && ' '}
                    </span>
                ))}
            </h1>

            {/* Rating */}
            <div className="ef-pd-in mt-4" style={{ '--i': 1 }}>
                {reviewCount > 0 ? (
                    <a href="#reviews" onClick={scrollTo('reviews')} className="ef-focus group inline-flex items-center gap-2 rounded-sm text-sm">
                        <RatingStars value={ratingAvg} />
                        <span className="font-semibold text-ink-strong">{Number(ratingAvg).toFixed(1)}</span>
                        <span className="text-ink-muted underline-offset-4 group-hover:underline">
                            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
                        </span>
                        <span className="sr-only">Rated {Number(ratingAvg).toFixed(1)} out of 5</span>
                    </a>
                ) : (
                    <a href="#reviews" onClick={scrollTo('reviews')} className="ef-focus group inline-flex items-center gap-2 rounded-sm text-sm text-ink-muted">
                        <RatingStars value={0} />
                        <span className="underline-offset-4 group-hover:text-brand group-hover:underline">No reviews yet · write the first</span>
                    </a>
                )}
            </div>

            {/* Price */}
            <div className="ef-pd-in mt-6" style={{ '--i': 2 }}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <AnimatedPrice
                        value={variant?.sellingPrice}
                        className="font-header text-[clamp(2rem,1.6rem+1.2vw,2.75rem)] font-semibold leading-none tracking-[-0.02em] text-ink-strong tabular-nums"
                    />
                    {saved > 0 && (
                        <>
                            <span className="text-lg leading-none text-ink-muted line-through decoration-1">
                                <span className="sr-only">MRP </span>{formatINR(variant.mrp)}
                            </span>
                            <span className="ef-badge ef-badge--sale font-semibold">
                                Save {formatINR(saved)} · {percent}%
                            </span>
                        </>
                    )}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                    Inclusive of all taxes{unit ? <> · <span className="font-medium text-ink-body">{unit}</span></> : null}
                </p>
            </div>

            {summary && (
                <div className="ef-pd-in mt-5" style={{ '--i': 3 }}>
                    <p className="line-clamp-3 text-[0.9875rem] leading-relaxed text-ink-body">{summary}</p>
                    {hasDetails && (
                        <a href="#details" onClick={scrollTo('details')} className="ef-link mt-2 text-sm">
                            Read the full story <ArrowDown aria-hidden="true" />
                        </a>
                    )}
                </div>
            )}

            <div className="ef-pd-in my-7 h-px w-full bg-line-soft" style={{ '--i': 4 }} />

            {variants.length > 0 && (
                <div className="ef-pd-in mb-6" style={{ '--i': 5 }}>
                    <PackSizePicker variants={variants} selectedId={variant?._id} onSelect={onSelectVariant} />
                </div>
            )}

            {/* Call to action */}
            <div ref={ctaRef} className="ef-pd-in flex flex-col gap-3" style={{ '--i': 6 }}>
                {!cart.canBuy ? (
                    <>
                        <button type="button" disabled className="ef-btn ef-btn--primary ef-btn--lg ef-btn--block">
                            Currently unavailable
                        </button>
                        <p className="text-sm text-ink-muted">This pack can’t be ordered right now. Please check back soon.</p>
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-stretch gap-3">
                            {cart.inCart ? (
                                <Stepper
                                    tone="cart"
                                    value={cart.cartQty}
                                    onDec={cart.decrease}
                                    onInc={cart.increase}
                                    incDisabled={cart.atMax}
                                    decLabel={cart.cartQty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                                />
                            ) : (
                                <Stepper
                                    value={qty}
                                    onDec={() => setQty((q) => Math.max(1, q - 1))}
                                    onInc={() => setQty((q) => Math.min(MAX_CART_QTY, q + 1))}
                                    decDisabled={qty <= 1}
                                    incDisabled={qty >= MAX_CART_QTY}
                                />
                            )}

                            {cart.inCart ? (
                                <Link href={WEBSITE_CART} className="ef-btn ef-btn--primary ef-btn--lg grow basis-[12rem] overflow-hidden">
                                    {justAdded ? (
                                        <span key="added" className="inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <Check aria-hidden="true" strokeWidth={3} /> Added
                                        </span>
                                    ) : (
                                        <span key="go" className="inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            Go to cart <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <button type="button" onClick={handleAdd} className="ef-btn ef-btn--primary ef-btn--lg grow basis-[12rem]">
                                    <ShoppingBag aria-hidden="true" /> Add to cart
                                </button>
                            )}
                        </div>

                        <button type="button" onClick={() => cart.buyNow(qty)} className="ef-btn ef-btn--accent ef-btn--lg ef-btn--block">
                            <Zap aria-hidden="true" /> Buy it now
                        </button>

                        <p className="min-h-[1.25rem] text-xs text-ink-muted" aria-live="polite">
                            {cart.inCart
                                ? cart.atMax
                                    ? `${cart.cartQty} in your cart · that’s the maximum of ${MAX_CART_QTY} per order`
                                    : `${cart.cartQty} in your cart · use − / + to adjust`
                                : qty >= MAX_CART_QTY
                                    ? `Maximum ${MAX_CART_QTY} units per order.`
                                    : qty > 1
                                        ? `${qty} × ${formatINR(variant.sellingPrice)} = ${formatINR(qty * variant.sellingPrice)}`
                                        : null}
                        </p>
                    </>
                )}
            </div>

            {/* Delivery */}
            <div className="ef-pd-in mt-3 flex items-start gap-3.5 rounded-[var(--radius-card)] bg-tint-pistachio p-4" style={{ '--i': 7 }}>
                <span className="ef-seal ef-seal--pine size-11 shrink-0" aria-hidden="true">
                    <PackageCheck />
                </span>
                <div className="min-w-0 text-sm leading-snug">
                    <p className="font-semibold text-ink-strong">
                        {delivery ? <>Estimated delivery <span className="whitespace-nowrap">{delivery}</span></> : 'Delivered in 4–7 days'}
                    </p>
                    <p className="mt-1 text-ink-body">Packed fresh and dispatched within 1–2 business days, anywhere in India.</p>
                </div>
            </div>

            {/* Trust */}
            <ul className="ef-pd-in mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-[var(--radius-card)] bg-line-soft shadow-[inset_0_0_0_1px_var(--line-soft)]" style={{ '--i': 8 }}>
                {TRUST.map(({ icon: Icon, title, sub }) => (
                    <li key={title} className="flex flex-col items-center gap-1.5 bg-surface-card px-2 py-3.5 text-center">
                        <Icon className="size-5 text-brand-bright" strokeWidth={1.75} aria-hidden="true" />
                        <span className="text-xs font-semibold leading-tight text-ink-strong">{title}</span>
                        <span className="hidden text-[0.6875rem] leading-tight text-ink-muted sm:block">{sub}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
})

export default ProductBuyBox
