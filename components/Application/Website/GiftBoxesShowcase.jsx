'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Gift, PackageCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from './WishlistButton'
import CartQtyStepper from './storefront/CartQtyStepper'
import { discountPercent, formatINR } from './storefront/format'

const TONES = {
    page: 'ef-section--page',
    sunken: 'ef-section--sunken',
}

// How long each box holds the stage before the next one, while autoplaying.
const SLIDE_MS = 6000

const PERKS = [
    { icon: Gift, label: 'Keepsake box' },
    { icon: PackageCheck, label: 'Glass jars' },
    { icon: Truck, label: 'Pan-India delivery' },
]

const pad = (n) => String(n).padStart(2, '0')
const photoOf = (product) => product.media?.find((item) => item?.secure_url)?.secure_url || imgPlaceholder.src

// Slowly turning circular seal over the photo. Decorative.
const Seal = () => (
    <span aria-hidden="true" className="absolute bottom-3 right-3 z-20 size-[4.5rem] sm:bottom-4 sm:right-4 sm:size-20">
        <svg viewBox="0 0 120 120" className="size-full animate-[spin_18s_linear_infinite] motion-reduce:animate-none">
            <defs>
                <path id="gift-seal-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
            </defs>
            <circle cx="60" cy="60" r="59" fill="var(--brand-sun)" />
            <text fill="var(--palette-pine)" fontSize="11.5" fontWeight="700" letterSpacing="0" style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                <textPath href="#gift-seal-path">Ready to gift ✺ Made to be given ✺</textPath>
            </text>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[var(--palette-pine)]">
            <Gift className="size-5 sm:size-6" strokeWidth={1.75} />
        </span>
    </span>
)

// Name, tagline, price and buy actions for the box on stage. Keyed by the
// product so the copy animates in fresh on every change.
const StageDetails = ({ product, index, count }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart } = useCartProduct(product)
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const name = formatProductName(product.name) || 'Gift box'
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)

    return (
        <div className="flex flex-col gap-5 duration-500 animate-in fade-in slide-in-from-bottom-3 motion-reduce:animate-none">
            <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-[rgb(247_243_232/0.7)]">
                <span className="font-header font-semibold tabular-nums text-[var(--brand-sun)]">{pad(index + 1)}</span>
                <span aria-hidden="true">/</span>
                <span className="tabular-nums">{pad(count)}</span>
                {variant?.size && <span className="ml-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] leading-none">{variant.size}</span>}
                {off > 0 && <span className="rounded-full bg-[var(--brand-sun)] px-2.5 py-1 text-[11px] font-semibold leading-none text-[var(--brand-sun-ink)]">Save {off}%</span>}
            </div>

            <div className="flex flex-col gap-3">
                <h3 className="m-0 font-header text-[clamp(2.25rem,1.5rem+3vw,4rem)] font-semibold uppercase leading-[0.92] text-[var(--palette-cream)]">
                    <Link href={href} className="ef-focus rounded-sm transition-colors hover:text-[var(--brand-sun)]">{name}</Link>
                </h3>
                {product.tagline && (
                    <p className="m-0 max-w-md text-[0.9375rem] leading-relaxed text-[rgb(247_243_232/0.75)]">{product.tagline}</p>
                )}
            </div>

            <p className="m-0 flex items-baseline gap-3">
                <span className="font-header text-[2rem] font-semibold leading-none tabular-nums text-[var(--brand-sun)]">{formatINR(price)}</span>
                {Number(mrp) > Number(price) && (
                    <span className="text-sm text-[rgb(247_243_232/0.6)] line-through">
                        <span className="sr-only">MRP </span>{formatINR(mrp)}
                    </span>
                )}
                <span className="text-xs text-[rgb(247_243_232/0.6)]">incl. taxes</span>
            </p>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                {inCart ? (
                    <CartQtyStepper qty={qty} atMax={atMax} onIncrease={increase} onDecrease={decrease} name={name} tone="soft" block className="sm:w-48" />
                ) : (
                    <button
                        type="button"
                        onClick={addToCart}
                        disabled={!canAdd}
                        aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                        className="ef-btn ef-btn--accent sm:min-w-48"
                    >
                        <ShoppingBag aria-hidden="true" /> {canAdd ? 'Add to cart' : 'Unavailable'}
                    </button>
                )}
                <div className="flex items-center gap-2.5">
                    <Link href={href} className="ef-btn ef-btn--ghost-light flex-1 sm:flex-none">
                        View box <ArrowUpRight aria-hidden="true" />
                    </Link>
                    <WishlistButton productId={product._id} name={product.name} className="size-12 shrink-0" />
                </div>
            </div>
        </div>
    )
}

/**
 * "Gifts worth unboxing" — the Gift Boxes category as a spotlight stage.
 *
 * A floating pine card holds one box at a time: a large photo with a slow
 * cinematic zoom and a turning "ready to gift" seal, beside its name,
 * tagline, price and buy actions. Thumbnail tabs underneath switch boxes and
 * show an autoplay progress bar. Autoplay pauses on hover, focus or when the
 * card is off screen, stops for good once the shopper picks a box, and never
 * runs for reduced-motion users. On phones the photo also swipes.
 */
const GiftBoxesShowcase = ({ products = [], total = 0, fromPrice = null, categoryHref, tone = 'page' }) => {
    const boxes = products.slice(0, 4)
    const baseId = useId()
    const stageRef = useRef(null)
    const tabRefs = useRef([])
    const swipeRef = useRef(null)
    const [active, setActive] = useState(0)
    const [autoplay, setAutoplay] = useState(false)
    const [paused, setPaused] = useState(false)
    const [visible, setVisible] = useState(false)

    // Autoplay only for motion-OK visitors with more than one box.
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        setAutoplay(!reduce && boxes.length > 1)
    }, [boxes.length])

    useEffect(() => {
        const el = stageRef.current
        if (!el || typeof IntersectionObserver === 'undefined') return
        const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
        io.observe(el)
        return () => io.disconnect()
    }, [])

    const go = useCallback((next, { user = false, focus = false } = {}) => {
        const index = (next + boxes.length) % boxes.length
        setActive(index)
        if (user) setAutoplay(false)
        if (focus) tabRefs.current[index]?.focus()
    }, [boxes.length])

    if (!boxes.length) return null
    const count = Number(total) || boxes.length
    const running = autoplay && !paused && visible
    const panelId = `${baseId}-stage`

    const onTabKey = (event, index) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1, { user: true, focus: true }) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1, { user: true, focus: true }) }
        if (event.key === 'Home') { event.preventDefault(); go(0, { user: true, focus: true }) }
        if (event.key === 'End') { event.preventDefault(); go(boxes.length - 1, { user: true, focus: true }) }
    }

    // Horizontal swipe on the photo (touch / pen); vertical scrolling is untouched.
    const onPointerDown = (event) => {
        if (event.pointerType === 'mouse') return
        swipeRef.current = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event) => {
        const start = swipeRef.current
        swipeRef.current = null
        if (!start) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(active + (dx < 0 ? 1 : -1), { user: true })
    }

    return (
        <section aria-labelledby="gift-edit-title" className={cn('ef-section ef-section--tight', TONES[tone] || TONES.page)}>
            <div className="ef-container flex flex-col gap-6 lg:gap-8">
                {/* ── Heading row ── */}
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
                    <div className="flex min-w-0 flex-col items-start gap-3">
                        <span className="ef-eyebrow">The gift box edit</span>
                        <h2 id="gift-edit-title" className="ef-title !text-[clamp(2rem,1.3rem+2.8vw,3.5rem)]">
                            Gifts worth <span className="ef-title__accent">unboxing</span>
                        </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                        {fromPrice && (
                            <p className="m-0 text-sm text-ink-body">
                                {count} {count === 1 ? 'box' : 'boxes'} from <strong className="font-semibold text-ink-strong">{formatINR(fromPrice)}</strong>
                            </p>
                        )}
                        <Link href={categoryHref} className="ef-link ef-focus">
                            Shop all gift boxes <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </header>

                {/* ── Stage ── */}
                <div
                    ref={stageRef}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocusCapture={() => setPaused(true)}
                    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}
                    className="relative isolate overflow-hidden rounded-[calc(var(--radius-tile)*1.5)] bg-[var(--palette-pine)] p-3 shadow-[0_40px_90px_-50px_rgb(11_61_46/0.8)] sm:p-4 lg:p-5"
                    style={{ backgroundImage: 'var(--brand-panel-gradient)' }}
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 -z-10 size-80 rounded-full bg-[var(--brand-sun)] opacity-[0.12] blur-3xl" />

                    <div
                        id={panelId}
                        role="tabpanel"
                        aria-labelledby={`${baseId}-tab-${active}`}
                        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] lg:items-center lg:gap-12"
                    >
                        {/* Photo */}
                        <div
                            className="relative touch-pan-y select-none"
                            onPointerDown={onPointerDown}
                            onPointerUp={onPointerUp}
                            onPointerCancel={() => { swipeRef.current = null }}
                        >
                            <div className="relative aspect-[9/10] overflow-hidden rounded-[var(--radius-tile)] bg-black/20 sm:aspect-[3/2] lg:aspect-[7/6] xl:aspect-[6/5]">
                                {boxes.map((product, index) => (
                                    <div
                                        key={product._id}
                                        aria-hidden={index !== active}
                                        className={cn(
                                            'absolute inset-0 transition-opacity duration-700 ease-out',
                                            index === active ? 'opacity-100' : 'opacity-0'
                                        )}
                                    >
                                        <Image
                                            src={photoOf(product)}
                                            alt={index === active ? `${formatProductName(product.name)} gift box` : ''}
                                            fill
                                            priority={index === 0}
                                            sizes="(max-width: 1024px) 92vw, 46vw"
                                            className={cn(
                                                'object-cover transition-transform ease-out motion-reduce:transition-none',
                                                index === active ? 'scale-[1.08] duration-[7000ms]' : 'scale-100 duration-700'
                                            )}
                                        />
                                    </div>
                                ))}
                                <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgb(11_61_46/0.45)] via-transparent to-transparent" />

                                {/* Phone dots */}
                                {boxes.length > 1 && (
                                    <div className="absolute bottom-4 left-4 flex gap-1.5 lg:hidden" aria-hidden="true">
                                        {boxes.map((product, index) => (
                                            <span
                                                key={product._id}
                                                className={cn('h-1.5 rounded-full transition-all duration-300', index === active ? 'w-6 bg-[var(--brand-sun)]' : 'w-1.5 bg-white/60')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Seal />
                        </div>

                        {/* Details */}
                        <div className="px-1 pb-1 sm:px-2 lg:py-6 lg:pr-6">
                            <StageDetails key={boxes[active]._id} product={boxes[active]} index={active} count={boxes.length} />

                            <ul className="m-0 mt-7 flex list-none flex-wrap gap-x-5 gap-y-2 border-t border-white/10 p-0 pt-5">
                                {PERKS.map(({ icon: Icon, label }) => (
                                    <li key={label} className="flex items-center gap-2 text-[0.8125rem] text-[rgb(247_243_232/0.75)]">
                                        <Icon className="size-4 text-[var(--brand-sun)]" aria-hidden="true" /> {label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* ── Box selector ── */}
                    {boxes.length > 1 && (
                        <div
                            role="tablist"
                            aria-label="Choose a gift box"
                            className="no-scrollbar mt-4 grid auto-cols-[minmax(6.5rem,1fr)] grid-flow-col gap-2 overflow-x-auto sm:mt-5 sm:auto-cols-[minmax(9.5rem,1fr)] lg:auto-cols-fr"
                        >
                            {boxes.map((product, index) => {
                                const selected = index === active
                                const price = product.defaultVariant?.sellingPrice ?? product.sellingPrice
                                return (
                                    <button
                                        key={product._id}
                                        ref={(el) => { tabRefs.current[index] = el }}
                                        id={`${baseId}-tab-${index}`}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        aria-controls={panelId}
                                        tabIndex={selected ? 0 : -1}
                                        onClick={() => go(index, { user: true })}
                                        onKeyDown={(event) => onTabKey(event, index)}
                                        className={cn(
                                            'ef-focus relative flex min-w-0 flex-col items-start gap-2 overflow-hidden rounded-[var(--radius-card)] p-2 pb-3 text-left transition-colors duration-300 sm:flex-row sm:items-center sm:gap-3 sm:pb-2 sm:pr-3',
                                            selected ? 'bg-white/[0.14]' : 'bg-white/[0.05] hover:bg-white/[0.1]'
                                        )}
                                    >
                                        <span className={cn('relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[var(--radius-sm)] transition-opacity sm:aspect-auto sm:size-12 sm:w-12', selected ? 'opacity-100' : 'opacity-70')}>
                                            <Image src={photoOf(product)} alt="" fill sizes="(max-width: 640px) 30vw, 48px" className="object-cover" />
                                        </span>
                                        <span className="min-w-0 px-0.5 sm:px-0">
                                            <span className={cn('line-clamp-2 text-[11px] font-semibold uppercase leading-tight sm:line-clamp-1 sm:text-[0.8125rem]', selected ? 'text-[var(--palette-cream)]' : 'text-[rgb(247_243_232/0.7)]')}>
                                                {formatProductName(product.name)}
                                            </span>
                                            <span className="block text-xs tabular-nums text-[rgb(247_243_232/0.6)]">{formatINR(price)}</span>
                                        </span>

                                        {/* progress / selected rule */}
                                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
                                            {selected && (
                                                <span
                                                    key={`${active}-${autoplay}`}
                                                    onAnimationEnd={() => go(active + 1)}
                                                    className="block h-full origin-left bg-[var(--brand-sun)]"
                                                    style={autoplay ? {
                                                        animation: `gift-progress ${SLIDE_MS}ms linear forwards`,
                                                        animationPlayState: running ? 'running' : 'paused',
                                                    } : undefined}
                                                />
                                            )}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <p className="m-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-ink-body">
                    <Sparkles className="size-4 text-brand" aria-hidden="true" />
                    Gifting for a team or an event?
                    <Link href={`${categoryHref}#enquire`} className="ef-link ef-focus">
                        Plan a bulk or corporate order <ArrowRight aria-hidden="true" />
                    </Link>
                </p>
            </div>

            <style>{`@keyframes gift-progress { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
        </section>
    )
}

export default GiftBoxesShowcase
