'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Minus,
    Plus,
    RefreshCw,
    ShieldCheck,
    Star,
    StarHalf,
    Truck,
    Zap,
} from 'lucide-react'
import { WEBSITE_BUY_NOW, WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link, { useLinkStatus } from "next/link"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import cloudinaryLoader from '@/lib/cloudinaryLoader'
import ButtonLoading from "@/components/Application/ButtonLoading"
import { useDispatch, useSelector } from "react-redux"
import { addIntoCart, increaseQuantity, decreaseQuantity, removeFromCart } from "@/store/reducer/cartReducer"
import { showToast } from "@/lib/showToast"
import { Button } from "@/components/ui/button"
import ProductBox from "@/components/Application/Website/ProductBox"
import { formatINR } from "@/components/Application/Website/storefront/format"
import LazyHydrate from "@/components/Application/LazyHydrate"

// Split the heavy client-only islands out of the page's hydration chunk.
// ProductReveiw drags in react-hook-form, zod, tanstack-query and axios but
// renders nothing until its own client fetches resolve, so there is no SSR
// markup to lose.
const ProductReveiw = dynamic(() => import("@/components/Application/Website/ProductReveiw"), { ssr: false })
import { cn, decodeHTMLDeep, htmlToText } from "@/lib/utils"
import { MAX_CART_QTY } from "@/lib/cartConstants"

const MAX_QTY = MAX_CART_QTY

// Non-blocking pending indicator for variant <Link>s. Rendered as a child of a
// Link, it reads that link's navigation status and overlays a small spinner on
// just the clicked swatch/size while the new variant loads — so the rest of the
// page stays interactive instead of being hidden behind a fullscreen loader.
const NavSpinner = () => {
    const { pending } = useLinkStatus()
    if (!pending) return null
    return (
        <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/70 backdrop-blur-[1px]">
            <Loader2 className="size-4 animate-spin text-brand" />
        </span>
    )
}

// Renders 5 stars reflecting a real average (full / half / empty) instead of
// a hard-coded 5-star row, so an unrated product shows empty stars.
const RatingStars = ({ value = 0, size = 'size-4' }) => (
    <div className="flex items-center gap-0.5 text-gold">
        {Array.from({ length: 5 }).map((_, i) => {
            const position = i + 1
            if (value >= position) {
                return <Star key={i} className={cn(size, 'fill-gold text-gold')} />
            }
            if (value >= position - 0.5) {
                return <StarHalf key={i} className={cn(size, 'fill-gold text-gold')} />
            }
            return <Star key={i} className={cn(size, 'text-foreground/25')} />
        })}
    </div>
)

const ProductDetails = ({ product, variant, sizes, reviewCount, ratingAvg, relatedProducts = [] }) => {
    const dispatch = useDispatch()
    const router = useRouter()
    const cartStore = useSelector(store => store.cartStore)

    const media = variant?.media?.length ? variant.media : []
    const [activeIndex, setActiveIndex] = useState(0)
    const [qty, setQty] = useState(1)
    // Gates the cart-state UI so the server-rendered "Add to Cart" matches the
    // first client paint (the persisted cart only rehydrates after mount).
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Reset gallery + quantity whenever the resolved variant changes (e.g. the
    // shopper switched size and the server returned a new variant).
    useEffect(() => {
        setActiveIndex(0)
        setQty(1)
    }, [variant?._id])

    // The live cart line for the *currently selected* variant (or null). Derived
    // straight from the store so add / increase / decrease / remove anywhere —
    // including the cart page — is always reflected here without local state to
    // keep in sync. Keyed by variantId, so switching size re-evaluates.
    const cartLine = useMemo(
        () => cartStore.products.find(
            (p) => p.productId === product._id && p.variantId === variant?._id
        ) || null,
        [cartStore.products, product._id, variant?._id]
    )
    const inCart = mounted && Boolean(cartLine)
    const cartQty = cartLine?.qty || 0

    const activeImage = media[activeIndex]?.secure_url || imgPlaceholder.src

    const slideImage = (dir) => {
        if (media.length < 2) return
        setActiveIndex((prev) => (prev + dir + media.length) % media.length)
    }

    // Pre-add quantity selector (how many to add). Capped at the shared max.
    const handleQty = (actionType) => {
        setQty((prev) => {
            if (actionType === 'inc') return Math.min(prev + 1, MAX_QTY)
            return Math.max(prev - 1, 1)
        })
    }

    const cartKey = { productId: product._id, variantId: variant?._id }

    const handleAddToCart = () => {
        if (!variant?._id) return
        dispatch(addIntoCart({
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            url: product.slug,
            size: variant.size,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: media[0]?.secure_url || imgPlaceholder.src,
            qty: qty,
        }))
        showToast('success', qty > 1 ? `${qty} added to cart.` : 'Product added into cart.')
    }

    // Buy now checks out just this variant — at the quantity chosen here, or the
    // cart line's quantity once it is in the cart — and leaves the cart as is.
    const handleBuyNow = () => {
        if (!variant?._id) return
        router.push(WEBSITE_BUY_NOW(variant._id, inCart ? cartQty : qty))
    }

    // In-cart stepper: + / − adjust the cart line live. Dropping below 1 removes
    // the line entirely (the buy box reverts to "Add to Cart"), matching the
    // quick-commerce stepper pattern shoppers expect.
    const handleCartInc = () => {
        if (cartQty >= MAX_QTY) return
        dispatch(increaseQuantity(cartKey))
    }
    const handleCartDec = () => {
        if (cartQty <= 1) {
            dispatch(removeFromCart(cartKey))
            showToast('success', 'Removed from cart.')
            return
        }
        dispatch(decreaseQuantity(cartKey))
    }

    const inr = (n) => formatINR(Number(n || 0))
    const hasDiscount = variant?.mrp > variant?.sellingPrice
    const shortDescription = htmlToText(product?.description)

    const scrollToReviews = () => {
        if (typeof document !== 'undefined') {
            document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8rem)]">
            <div className="ef-container font-neue">

                <div className="mb-6 lg:mb-8">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={WEBSITE_SHOP}>Shop</BreadcrumbLink>
                            </BreadcrumbItem>
                            {product?.category?.name && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href={`${WEBSITE_SHOP}?category=${encodeURIComponent(product.category.slug)}`}>
                                            {product.category.name}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            )}
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="max-w-[180px] truncate sm:max-w-none">{product?.name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">

                    {/* ── GALLERY ─────────────────────────────────────────── */}
                    <div className="lg:sticky lg:top-28">
                        <div className="flex flex-col-reverse gap-3 xl:flex-row xl:gap-4">
                            <div className="flex gap-3 overflow-x-auto pb-1 xl:max-h-[620px] xl:w-[84px] xl:flex-col xl:overflow-y-auto xl:pb-0 no-scrollbar">
                                {media.length > 0 ? media.map((thumb, index) => (
                                    <button
                                        type="button"
                                        key={thumb._id || index}
                                        onClick={() => setActiveIndex(index)}
                                        aria-label={`View image ${index + 1}`}
                                        className={cn(
                                            'relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-well border-2 bg-surface-well transition xl:w-full',
                                            index === activeIndex
                                                ? 'border-brand'
                                                : 'border-transparent hover:border-line-strong'
                                        )}
                                    >
                                        <Image
                                            src={thumb?.secure_url || imgPlaceholder.src}
                                            alt={thumb?.alt || `${product?.name} thumbnail ${index + 1}`}
                                            fill
                                            sizes="84px"
                                            loader={cloudinaryLoader}
                                            className="object-cover object-center"
                                        />
                                    </button>
                                )) : null}
                            </div>

                            <div className="group relative flex-1">
                                <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-tile)] bg-surface-well">
                                    {/* fetchPriority must be passed explicitly — in Next 15
                                        `priority` alone emits the preload but not
                                        fetchpriority="high", so the LCP request still queued
                                        behind fonts/JS on throttled connections. */}
                                    <Image
                                        key={activeImage}
                                        src={activeImage}
                                        alt={media[activeIndex]?.alt || product?.name}
                                        fill
                                        priority
                                        fetchPriority="high"
                                        loader={cloudinaryLoader}
                                        sizes="(max-width: 1024px) 100vw, 55vw"
                                        className="object-cover object-center"
                                    />

                                    {hasDiscount && (
                                        <span className="ef-badge ef-badge--sale absolute left-4 top-4 z-10">
                                            {variant.discountPercentage}% off
                                        </span>
                                    )}

                                    {media.length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                aria-label="Previous image"
                                                onClick={() => slideImage(-1)}
                                                className="absolute left-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background/85 text-foreground/70 opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-background hover:text-foreground group-hover:opacity-100"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Next image"
                                                onClick={() => slideImage(1)}
                                                className="absolute right-3 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background/85 text-foreground/70 opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-background hover:text-foreground group-hover:opacity-100"
                                            >
                                                <ChevronRight className="size-4" />
                                            </button>
                                            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
                                                {media.map((_, index) => (
                                                    <span
                                                        key={index}
                                                        className={cn(
                                                            'size-1.5 rounded-full transition-colors',
                                                            index === activeIndex ? 'bg-brand' : 'bg-foreground/25'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── INFO PANEL ──────────────────────────────────────── */}
                    <div className="flex flex-col">
                        {product?.category?.name ? (
                            <Link
                                href={`${WEBSITE_SHOP}?category=${encodeURIComponent(product.category.slug)}`}
                                className="ef-eyebrow ef-focus w-fit transition-colors hover:text-brand-hover"
                            >
                                {product.category.name}
                            </Link>
                        ) : (
                            <p className="ef-eyebrow w-fit">Energyflow</p>
                        )}

                        <h1 className="mt-4 text-[clamp(2rem,1.4rem+2vw,3rem)] font-medium leading-[1.05] text-ink-strong">
                            {product?.name}
                        </h1>

                        <button
                            type="button"
                            onClick={scrollToReviews}
                            className="mt-3 flex w-fit items-center gap-2 text-left"
                        >
                            {reviewCount > 0 && <RatingStars value={ratingAvg} />}
                            <span className="text-sm text-ink-muted underline-offset-4 hover:underline">
                                {reviewCount > 0
                                    ? `${ratingAvg > 0 ? `${ratingAvg} · ` : ''}${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
                                    : 'No reviews yet · be the first'}
                            </span>
                        </button>

                        <div className="mt-5 flex flex-wrap items-end gap-3">
                            <span className="text-[1.875rem] font-semibold leading-none tracking-[-0.02em] text-ink-strong">{inr(variant?.sellingPrice)}</span>
                            {hasDiscount && (
                                <>
                                    <span className="text-base leading-none text-muted-foreground line-through">{inr(variant?.mrp)}</span>
                                    <span className="ef-badge ef-badge--sale">
                                        Save {inr(variant.mrp - variant.sellingPrice)}
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">Inclusive of all taxes</p>

                        {shortDescription && (
                            <p className="mt-5 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-body">
                                {shortDescription}
                            </p>
                        )}

                        <div className="my-6 h-px w-full bg-line-soft" />

                        {/* Size */}
                        {sizes?.length > 0 && (
                            <div className="mb-6">
                                <p className="mb-3 text-[0.875rem] text-ink-muted">
                                    Pack size: <span className="font-medium text-ink-strong">{variant?.size}</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map((size) => {
                                        const isSelected = size === variant?.size
                                        return (
                                            <Link
                                                key={size}
                                                href={`${WEBSITE_PRODUCT_DETAILS(product.slug)}?size=${encodeURIComponent(size)}`}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    'ef-focus relative inline-flex h-11 min-w-[3.5rem] items-center justify-center rounded-[var(--radius-control)] px-4 text-center text-[0.875rem] font-medium transition-colors',
                                                    isSelected
                                                        ? 'bg-brand text-on-brand'
                                                        : 'bg-surface-card text-ink-strong shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-brand'
                                                )}
                                            >
                                                {size}
                                                {!isSelected && <NavSpinner />}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Add to cart */}
                        {!variant?._id ? (
                            <Button
                                type="button"
                                variant="brand"
                                disabled
                                className="h-12 w-full rounded-[var(--radius-control)] text-[0.9375rem] font-medium"
                            >
                                Unavailable
                            </Button>
                        ) : !inCart ? (
                            /* ── Not in cart: pick a quantity, then add ──────────── */
                            <div className="flex flex-row items-stretch gap-3">
                                <div className="inline-flex h-12 shrink-0 items-center rounded-[var(--radius-control)] bg-surface-well px-1">
                                    <button
                                        type="button"
                                        aria-label="Decrease quantity"
                                        disabled={qty <= 1}
                                        className="flex h-full w-11 items-center justify-center text-foreground/80 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                        onClick={() => handleQty('desc')}
                                    >
                                        <Minus className="size-4" />
                                    </button>
                                    <span className="w-10 select-none text-center text-sm font-semibold tabular-nums">{qty}</span>
                                    <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        disabled={qty >= MAX_QTY}
                                        className="flex h-full w-11 items-center justify-center text-foreground/80 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                                        onClick={() => handleQty('inc')}
                                    >
                                        <Plus className="size-4" />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <ButtonLoading
                                        type="button"
                                        text="Add to cart"
                                        variant="brand"
                                        className="h-12 w-full rounded-[var(--radius-control)] text-[0.9375rem] font-medium"
                                        onClick={handleAddToCart}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* ── In cart: live stepper bound to the cart line ────── */
                            <div className="flex flex-row items-stretch gap-3">
                                <div className="inline-flex h-12 shrink-0 items-center rounded-[var(--radius-control)] bg-tint-honey px-1">
                                    <button
                                        type="button"
                                        aria-label={cartQty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                                        className="flex h-full w-11 items-center justify-center text-brand transition hover:text-brand-hover"
                                        onClick={handleCartDec}
                                    >
                                        <Minus className="size-4" />
                                    </button>
                                    <span className="w-10 select-none text-center text-sm font-semibold tabular-nums text-brand">{cartQty}</span>
                                    <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        disabled={cartQty >= MAX_QTY}
                                        className="flex h-full w-11 items-center justify-center text-brand transition hover:text-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
                                        onClick={handleCartInc}
                                    >
                                        <Plus className="size-4" />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <Button
                                        variant="brand"
                                        className="h-12 w-full rounded-[var(--radius-control)] text-[0.9375rem] font-medium"
                                        type="button"
                                        asChild
                                    >
                                        <Link href={WEBSITE_CART}>Go to cart</Link>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {variant?._id && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBuyNow}
                                className="mt-3 h-12 w-full rounded-[var(--radius-control)] border-brand text-[0.9375rem] font-medium text-brand hover:bg-brand hover:text-on-brand"
                            >
                                <Zap className="size-4" aria-hidden="true" /> Buy now
                            </Button>
                        )}

                        {inCart ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                                {cartQty} in your cart{cartQty >= MAX_QTY ? ` · max ${MAX_QTY} per order` : ' · use − / + to adjust'}
                            </p>
                        ) : qty >= MAX_QTY ? (
                            <p className="mt-2 text-xs text-muted-foreground">Maximum {MAX_QTY} units per order.</p>
                        ) : null}

                        {/* Trust badges */}
                        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                                { icon: Truck, title: 'Free Shipping', sub: 'On all prepaid orders' },
                                { icon: RefreshCw, title: 'Easy Returns', sub: 'Damaged or wrong items' },
                                { icon: ShieldCheck, title: 'Secure Checkout', sub: '100% protected' },
                            ].map(({ icon: Icon, title, sub }) => (
                                <div key={title} className="flex items-center gap-3 rounded-card bg-surface-card px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line-soft)]">
                                    <Icon className="size-5 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                                    <div className="leading-tight">
                                        <p className="text-[12px] font-semibold text-foreground">{title}</p>
                                        <p className="text-[11px] text-muted-foreground">{sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* ── Full-width Product Details ───────────────────────── */}
                <section className="mt-[var(--section-space)]">
                    <div className="mb-[var(--section-gap)] flex flex-col items-start gap-3">
                        <span className="ef-eyebrow">The Details</span>
                        <h2 className="ef-title ef-title--md">
                            Product details
                        </h2>
                    </div>
                    <div
                        className="ef-card w-full px-5 py-6 font-neue text-[0.9375rem] font-normal leading-[1.8] text-ink-body sm:px-8 [&_a]:text-brand [&_a]:underline [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{ __html: decodeHTMLDeep(product?.description) }}
                    />
                </section>

                {/* ── Full-width Shipping & Returns ────────────────────── */}
                <section className="mt-[var(--section-space)]">
                    <div className="mb-[var(--section-gap)] flex flex-col items-start gap-3">
                        <span className="ef-eyebrow">Good To Know</span>
                        <h2 className="ef-title ef-title--md">
                            Shipping &amp; returns
                        </h2>
                    </div>
                    <dl className="ef-card w-full divide-y divide-line-soft px-5 py-2 sm:px-7">
                        {[
                            { label: 'Delivery', text: 'Dispatched within 1–2 business days; delivered in 4–7 days.' },
                            { label: 'Shipping', text: 'Free shipping on all prepaid orders across India.' },
                            { label: 'Returns', text: 'Damaged, incorrectly sealed or wrong items reported within 7 days are replaced or refunded. Opened food packs can only be returned for a genuine quality issue.' },
                            { label: 'Refunds', text: 'Processed to the original payment method within 5–7 business days.' },
                        ].map(({ label, text }) => (
                            <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-6">
                                <dt className="shrink-0 pt-0.5 text-[0.875rem] font-medium text-ink-strong sm:w-28">
                                    {label}
                                </dt>
                                <dd className="font-neue text-[0.9375rem] leading-[1.75] text-ink-body">
                                    {text}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <div id="reviews" className="mt-[var(--section-space)] scroll-mt-28">
                    <LazyHydrate>
                        <ProductReveiw productId={product._id} />
                    </LazyHydrate>
                </div>

                {/* ── You May Also Like ────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <section className="mt-[var(--section-space)]">
                        <div className="mb-[var(--section-gap)] flex flex-col items-start gap-3">
                            <span className="ef-eyebrow">Curated For You</span>
                            <h2 className="ef-title ef-title--md">
                                You may also like
                            </h2>
                        </div>

                        <LazyHydrate>
                            <div className="grid grid-cols-2 gap-[var(--grid-gap)] sm:grid-cols-3 lg:grid-cols-4">
                                {relatedProducts.map((item) => (
                                    <ProductBox key={item._id} product={item} />
                                ))}
                            </div>
                        </LazyHydrate>
                    </section>
                )}
            </div>
        </section>
    )
}

export default ProductDetails
