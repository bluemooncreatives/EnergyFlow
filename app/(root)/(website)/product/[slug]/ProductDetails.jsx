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
} from 'lucide-react'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from "@/routes/WebsiteRoute"
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
import LazyHydrate from "@/components/Application/LazyHydrate"

// Split the heavy client-only islands out of the page's hydration chunk.
// ProductReveiw drags in react-hook-form, zod, tanstack-query and axios but
// renders nothing until its own client fetches resolve, so there is no SSR
// markup to lose. SizeGuideModal is invisible until the shopper asks for it.
const ProductReveiw = dynamic(() => import("@/components/Application/Website/ProductReveiw"), { ssr: false })
const SizeGuideModal = dynamic(() => import("@/components/Application/Website/SizeGuideModal"), { ssr: false })
import { cn, decodeHTMLDeep, htmlToText, normalizeColor } from "@/lib/utils"
import { resolveColorStyle } from "@/lib/colorMap"
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
            <Loader2 className="size-4 animate-spin text-[var(--dark-red)]" />
        </span>
    )
}

// Renders 5 stars reflecting a real average (full / half / empty) instead of
// a hard-coded 5-star row, so an unrated product shows empty stars.
const RatingStars = ({ value = 0, size = 'size-4' }) => (
    <div className="flex items-center gap-0.5 text-[var(--dark-red)]">
        {Array.from({ length: 5 }).map((_, i) => {
            const position = i + 1
            if (value >= position) {
                return <Star key={i} className={cn(size, 'fill-[var(--dark-red)] text-[var(--dark-red)]')} />
            }
            if (value >= position - 0.5) {
                return <StarHalf key={i} className={cn(size, 'fill-[var(--dark-red)] text-[var(--dark-red)]')} />
            }
            return <Star key={i} className={cn(size, 'text-foreground/25')} />
        })}
    </div>
)

const ProductDetails = ({ product, variant, colors, colorEntries, sizes, variantOptions, reviewCount, ratingAvg, relatedProducts = [] }) => {
    const dispatch = useDispatch()
    const cartStore = useSelector(store => store.cartStore)

    const media = variant?.media?.length ? variant.media : []
    const [activeIndex, setActiveIndex] = useState(0)
    const [qty, setQty] = useState(1)
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
    // Latches true on first open and stays true so the dynamic chunk only
    // downloads on demand, but the dialog stays mounted to animate closed.
    const [sizeGuideRequested, setSizeGuideRequested] = useState(false)
    // Color swatch resolution uses CSS.supports (browser-only). Gate the
    // resolved fill behind a mount flag to avoid an SSR/client hydration
    // mismatch for CSS-named colors. The same flag gates the cart-state UI so
    // the server-rendered "Add to Cart" matches the first client paint (the
    // persisted cart only rehydrates after mount).
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Reset gallery + quantity whenever the resolved variant changes (e.g. the
    // shopper switched color/size and the server returned a new variant).
    useEffect(() => {
        setActiveIndex(0)
        setQty(1)
    }, [variant?._id])

    // The live cart line for the *currently selected* variant (or null). Derived
    // straight from the store so add / increase / decrease / remove anywhere —
    // including the cart page — is always reflected here without local state to
    // keep in sync. Keyed by variantId, so switching color/size re-evaluates.
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
            color: variant.color,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: media[0]?.secure_url || imgPlaceholder.src,
            qty: qty,
        }))
        showToast('success', qty > 1 ? `${qty} added to cart.` : 'Product added into cart.')
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

    // ── Variant availability matrix ───────────────────────────────────────
    const optionSet = useMemo(
        () => new Set((variantOptions || []).map((o) => `${o.color}|${o.size}`)),
        [variantOptions]
    )
    const isCombo = (color, size) => optionSet.has(`${normalizeColor(color)}|${size}`)

    // When switching color, keep the current size if that combo exists,
    // otherwise land on the first available size for the new color — so a
    // color click never dead-ends on a non-existent combination.
    const sizeForColor = (color) => {
        const c = normalizeColor(color)
        if ((variantOptions || []).some((o) => o.color === c && o.size === variant.size)) return variant.size
        return (variantOptions || []).find((o) => o.color === c)?.size || variant.size
    }

    const inr = (n) => Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    const hasDiscount = variant?.mrp > variant?.sellingPrice
    const shortDescription = htmlToText(product?.description)
    const swatches = colorEntries?.length ? colorEntries : (colors || []).map((name) => ({ name, hex: '' }))

    const scrollToReviews = () => {
        if (typeof document !== 'undefined') {
            document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <section className="website-gutter bg-[linear-gradient(180deg,rgba(62,0,13,0.03),transparent_18%)] py-8 lg:py-12">
            <div className="w-full font-neue">

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
                    <div className="lg:sticky lg:top-6">
                        <div className="flex flex-col-reverse gap-3 xl:flex-row xl:gap-4">
                            <div className="flex gap-3 overflow-x-auto pb-1 xl:max-h-[620px] xl:w-[84px] xl:flex-col xl:overflow-y-auto xl:pb-0 no-scrollbar">
                                {media.length > 0 ? media.map((thumb, index) => (
                                    <button
                                        type="button"
                                        key={thumb._id || index}
                                        onClick={() => setActiveIndex(index)}
                                        aria-label={`View image ${index + 1}`}
                                        className={cn(
                                            'relative aspect-[4/5] w-[72px] shrink-0 overflow-hidden rounded-[var(--radius-sm)] border bg-[var(--product-card-bg)] transition xl:w-full',
                                            index === activeIndex
                                                ? 'border-[var(--dark-red)] ring-1 ring-[var(--dark-red)]/30'
                                                : 'border-border/60 hover:border-foreground/40'
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
                                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-lg)] border border-border/60 bg-[var(--product-card-bg)]">
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
                                        <span className="absolute left-4 top-4 z-10 rounded-full bg-[var(--dark-red)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                                            -{variant.discountPercentage}%
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
                                                            index === activeIndex ? 'bg-[var(--dark-red)]' : 'bg-foreground/25'
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
                                className="w-fit text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--dark-red)] transition-colors hover:text-[var(--dark-red-2)]"
                            >
                                {product.category.name}
                            </Link>
                        ) : (
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--dark-red)]">Energyflow</p>
                        )}

                        <h1 className="font-header mt-2 text-[1.75rem] leading-[1.1] tracking-[-0.02em] text-foreground sm:text-[2rem] lg:text-[2.25rem]">
                            {product?.name}
                        </h1>

                        <button
                            type="button"
                            onClick={scrollToReviews}
                            className="mt-3 flex w-fit items-center gap-2 text-left"
                        >
                            <RatingStars value={ratingAvg} />
                            <span className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                                {ratingAvg > 0 ? `${ratingAvg} · ` : ''}{reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
                            </span>
                        </button>

                        <div className="mt-5 flex flex-wrap items-end gap-3">
                            <span className="text-[1.75rem] font-semibold leading-none text-foreground">{inr(variant?.sellingPrice)}</span>
                            {hasDiscount && (
                                <>
                                    <span className="text-base leading-none text-muted-foreground line-through">{inr(variant?.mrp)}</span>
                                    <span className="rounded-md bg-[var(--brand-cream)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--dark-red)]">
                                        Save {inr(variant.mrp - variant.sellingPrice)}
                                    </span>
                                </>
                            )}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">Inclusive of all taxes</p>

                        {shortDescription && (
                            <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-[var(--text-body)]">
                                {shortDescription}
                            </p>
                        )}

                        <div className="my-6 h-px w-full bg-border/60" />

                        {/* Color */}
                        {swatches.length > 0 && (
                            <div className="mb-6">
                                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Color: <span className="text-foreground">{variant?.color}</span>
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                    {swatches.map(({ name, hex }) => {
                                        const isSelected = normalizeColor(name) === normalizeColor(variant?.color)
                                        const style = mounted ? resolveColorStyle(name, hex) : null
                                        return (
                                            <Link
                                                key={name}
                                                href={`${WEBSITE_PRODUCT_DETAILS(product.slug)}?color=${encodeURIComponent(name)}&size=${encodeURIComponent(sizeForColor(name))}`}
                                                title={name}
                                                aria-label={`Color ${name}`}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    'relative flex size-9 items-center justify-center rounded-full border transition',
                                                    isSelected
                                                        ? 'border-[var(--dark-red)] ring-2 ring-[var(--dark-red)]/25 ring-offset-2 ring-offset-background'
                                                        : 'border-border/70 hover:border-foreground/50'
                                                )}
                                            >
                                                <span
                                                    className="size-7 rounded-full border border-black/10"
                                                    style={style || undefined}
                                                >
                                                    {!style && (
                                                        <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-foreground/60">
                                                            {name?.slice(0, 2)}
                                                        </span>
                                                    )}
                                                </span>
                                                {!isSelected && <NavSpinner />}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        {sizes?.length > 0 && (
                            <div className="mb-6">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                        Size: <span className="text-foreground">{variant?.size}</span>
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => { setSizeGuideRequested(true); setIsSizeGuideOpen(true) }}
                                        className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--dark-red)] underline-offset-4 hover:underline"
                                    >
                                        Size Guide
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map((size) => {
                                        const isSelected = size === variant?.size
                                        const available = isCombo(variant?.color, size)
                                        if (!available && !isSelected) {
                                            return (
                                                <span
                                                    key={size}
                                                    title={`${size} — unavailable in ${variant?.color}`}
                                                    className="relative min-w-[44px] cursor-not-allowed select-none rounded-[var(--radius-sm)] border border-border/50 px-3.5 py-2 text-center text-sm text-foreground/30"
                                                >
                                                    <span className="line-through">{size}</span>
                                                </span>
                                            )
                                        }
                                        return (
                                            <Link
                                                key={size}
                                                href={`${WEBSITE_PRODUCT_DETAILS(product.slug)}?color=${encodeURIComponent(variant.color)}&size=${encodeURIComponent(size)}`}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    'relative min-w-[44px] rounded-[var(--radius-sm)] border px-3.5 py-2 text-center text-sm font-medium transition',
                                                    isSelected
                                                        ? 'border-[var(--dark-red)] bg-[var(--dark-red)] text-white'
                                                        : 'border-border/70 hover:border-foreground/50 hover:bg-muted/40'
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
                                className="h-12 w-full rounded-[var(--radius-sm)] text-[12px] font-semibold uppercase tracking-[0.2em]"
                            >
                                Unavailable
                            </Button>
                        ) : !inCart ? (
                            /* ── Not in cart: pick a quantity, then add ──────────── */
                            <div className="flex flex-row items-stretch gap-3">
                                <div className="inline-flex h-12 shrink-0 items-center rounded-[var(--radius-sm)] border border-border/70">
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
                                        text="Add To Cart"
                                        variant="brand"
                                        className="h-12 w-full rounded-[var(--radius-sm)] text-[12px] font-semibold uppercase tracking-[0.2em]"
                                        onClick={handleAddToCart}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* ── In cart: live stepper bound to the cart line ────── */
                            <div className="flex flex-row items-stretch gap-3">
                                <div className="inline-flex h-12 shrink-0 items-center rounded-[var(--radius-sm)] border border-[var(--dark-red)]/40 bg-[var(--brand-cream)]/30">
                                    <button
                                        type="button"
                                        aria-label={cartQty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                                        className="flex h-full w-11 items-center justify-center text-[var(--dark-red)] transition hover:text-[var(--dark-red-2)]"
                                        onClick={handleCartDec}
                                    >
                                        <Minus className="size-4" />
                                    </button>
                                    <span className="w-10 select-none text-center text-sm font-semibold tabular-nums text-[var(--dark-red)]">{cartQty}</span>
                                    <button
                                        type="button"
                                        aria-label="Increase quantity"
                                        disabled={cartQty >= MAX_QTY}
                                        className="flex h-full w-11 items-center justify-center text-[var(--dark-red)] transition hover:text-[var(--dark-red-2)] disabled:cursor-not-allowed disabled:opacity-40"
                                        onClick={handleCartInc}
                                    >
                                        <Plus className="size-4" />
                                    </button>
                                </div>

                                <div className="flex-1">
                                    <Button
                                        variant="brand"
                                        className="h-12 w-full rounded-[var(--radius-sm)] text-[12px] font-semibold uppercase tracking-[0.2em]"
                                        type="button"
                                        asChild
                                    >
                                        <Link href={WEBSITE_CART}>Go To Cart</Link>
                                    </Button>
                                </div>
                            </div>
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
                                { icon: RefreshCw, title: 'Easy Returns', sub: '7-day return policy' },
                                { icon: ShieldCheck, title: 'Secure Checkout', sub: '100% protected' },
                            ].map(({ icon: Icon, title, sub }) => (
                                <div key={title} className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-border/50 bg-muted/20 px-3 py-2.5">
                                    <Icon className="size-5 shrink-0 text-[var(--dark-red)]" strokeWidth={1.75} />
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
                <section className="mt-10 lg:mt-14">
                    <div className="mb-6 lg:mb-8">
                        <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                            The Details
                        </p>
                        <h2 className="mt-1.5 font-neue text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]">
                            Product Details
                        </h2>
                    </div>
                    <div
                        className="w-full font-neue text-[0.95rem] font-normal leading-[1.85] text-[var(--text-body)] [&_a]:text-[var(--dark-red)] [&_a]:underline [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5"
                        dangerouslySetInnerHTML={{ __html: decodeHTMLDeep(product?.description) }}
                    />
                </section>

                {/* ── Full-width Shipping & Returns ────────────────────── */}
                <section className="mt-10 lg:mt-14">
                    <div className="mb-6 lg:mb-8">
                        <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                            Good To Know
                        </p>
                        <h2 className="mt-1.5 font-neue text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]">
                            Shipping &amp; Returns
                        </h2>
                    </div>
                    <dl className="w-full divide-y divide-border/50">
                        {[
                            { label: 'Delivery', text: 'Dispatched within 1–2 business days; delivered in 4–7 days.' },
                            { label: 'Shipping', text: 'Free shipping on all prepaid orders across India.' },
                            { label: 'Returns', text: 'Easy 7-day returns on unused items with tags intact.' },
                            { label: 'Refunds', text: 'Processed to the original payment method within 5–7 business days.' },
                        ].map(({ label, text }) => (
                            <div key={label} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
                                <dt className="shrink-0 pt-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-foreground/45 sm:w-24">
                                    {label}
                                </dt>
                                <dd className="font-neue text-[0.95rem] leading-[1.85] text-[var(--text-body)]">
                                    {text}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {sizeGuideRequested && (
                    <SizeGuideModal
                        open={isSizeGuideOpen}
                        onOpenChange={setIsSizeGuideOpen}
                        sizeGuide={product?.sizeGuide}
                    />
                )}

                <div id="reviews" className="mt-14 scroll-mt-24">
                    <LazyHydrate>
                        <ProductReveiw productId={product._id} />
                    </LazyHydrate>
                </div>

                {/* ── You May Also Like ────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <section className="mt-12 lg:mt-16">
                        <div className="mb-8 lg:mb-10">
                            <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                                Curated For You
                            </p>
                            <h2 className="mt-1.5 font-neue text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]">
                                You May Also Like
                            </h2>
                        </div>

                        <LazyHydrate>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
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
