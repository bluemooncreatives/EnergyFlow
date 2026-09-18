'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowRight, Check, Plus, Star } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'

gsap.registerPlugin(ScrollTrigger)

const DEAL_BANNER = {
    title: 'Gift Boxes, Ready To Send',
    copy: 'Get the best deal before close.',
    image: '/assets/images/banner/gift-box-deal.jpg',
    alt: 'A wooden gift tray of raisins, cashews, almonds and pistachios beside a ribboned box',
    href: WEBSITE_SHOP,
}

const formatPrice = (price) =>
    typeof price === 'number'
        ? price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
        : null

// Every card in this rail shares one deadline, so one interval drives them all.
// It runs to the end of the current month: the Product model carries no
// per-product deal expiry to read, and a window of days is what the four-cell
// layout is built to show. State starts null so the server HTML and the first
// client render agree — a live clock rendered on the server mismatches on
// hydration.
const useDealCountdown = () => {
    const [remaining, setRemaining] = useState(null)

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            const diff = Math.max(0, endOfMonth.getTime() - now.getTime())

            setRemaining({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            })
        }

        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [])

    return remaining
}

const CountdownCell = ({ value, label }) => (
    <div className="flex flex-1 flex-col items-center justify-center rounded-md border border-border px-1 py-2">
        <span className="text-base font-semibold tabular-nums leading-tight text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
    </div>
)

const Countdown = ({ remaining }) => (
    <div className="flex w-full gap-2">
        <CountdownCell value={remaining ? remaining.days : '--'} label="Days" />
        <CountdownCell value={remaining ? remaining.hours : '--'} label="Hours" />
        <CountdownCell value={remaining ? remaining.minutes : '--'} label="Mins" />
        <CountdownCell value={remaining ? remaining.seconds : '--'} label="Sec" />
    </div>
)

const DailyBestSellsSectionClient = ({ products = [] }) => {
    const sectionRef = useRef(null)
    const railRef = useRef(null)

    const remaining = useDealCountdown()

    const dispatch = useDispatch()
    const cartProducts = useSelector((store) => store.cartStore.products)

    const isInCart = (product) => {
        const variant = product?.defaultVariant
        return variant
            ? cartProducts.some((item) => item.productId === product._id && item.variantId === variant._id)
            : false
    }

    const handleAddToCart = (e, product) => {
        e.preventDefault()
        e.stopPropagation()

        const variant = product?.defaultVariant
        if (!variant) return

        dispatch(addIntoCart({
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            url: product.slug,
            size: variant.size,
            mrp: variant.mrp ?? product.mrp,
            sellingPrice: variant.sellingPrice ?? product.sellingPrice,
            media: product?.media?.[0]?.secure_url || imgPlaceholder.src,
            qty: 1,
        }))
        showToast('success', 'Product added into cart.')
    }

    useGSAP(() => {
        const columns = railRef.current?.children
        if (!columns?.length) return

        gsap.fromTo(columns,
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1, y: 0,
                duration: 0.8, ease: 'power3.out', stagger: 0.1,
                scrollTrigger: { trigger: railRef.current, start: 'top 85%', once: true },
            }
        )
    }, { scope: sectionRef, dependencies: [products.length] })

    if (!products.length) return null

    return (
        <section ref={sectionRef} className="website-gutter py-8 lg:py-14">
            <div className="website-content font-neue">

                <h2 className="mb-6 font-header text-2xl uppercase tracking-[0.02em] text-[var(--brand-primary-hover)] sm:text-3xl">
                    Daily Best Sells
                </h2>

                <div ref={railRef} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                    {/* ── Deal banner ── */}
                    <div className="relative min-h-[380px] overflow-hidden rounded-lg md:min-h-full">
                        <Image
                            src={DEAL_BANNER.image}
                            alt={DEAL_BANNER.alt}
                            fill
                            quality={82}
                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                            className="object-cover"
                        />

                        {/* The photograph is warm and light throughout, so the copy needs
                            its own dark ground rather than sitting straight on the image. */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 from-0% via-black/30 via-40% to-transparent to-72%" />

                        <div className="absolute inset-x-0 top-0 flex flex-col gap-5 px-6 pt-8">
                            <div className="flex flex-col gap-2">
                                <h3 className="font-header text-xl leading-snug text-white sm:text-2xl">
                                    {DEAL_BANNER.title}
                                </h3>
                                <p className="text-sm text-white/90">{DEAL_BANNER.copy}</p>
                            </div>

                            <div>
                                <Link
                                    href={DEAL_BANNER.href}
                                    className="inline-flex items-center gap-x-2 rounded-md bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--brand-primary-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
                                >
                                    <span>Shop Now</span>
                                    <ArrowRight className="size-4" strokeWidth={2.5} />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Deal cards ── */}
                    {products.map((product) => {
                        const href = WEBSITE_PRODUCT_DETAILS(product.slug)
                        const image = product?.media?.[0]
                        const hasDiscount = product?.mrp > product?.sellingPrice
                        const filledStars = Math.round(Number(product?.ratingAvg || 0))
                        const inCart = isInCart(product)

                        return (
                            <div
                                key={product._id}
                                className="group relative flex flex-col break-words rounded-lg border border-border bg-background transition duration-300 hover:border-[var(--brand-primary)]/40 hover:shadow-[var(--shadow-card-hover)]"
                            >
                                <div className="flex flex-auto flex-col gap-3 p-4">
                                    {/* Fixed image box: the source art varies in aspect ratio,
                                        so the cards would otherwise each set their own height. */}
                                    <Link
                                        href={href}
                                        aria-label={`View ${product?.name}`}
                                        className="mb-3 block h-[200px] w-full"
                                    >
                                        <Image
                                            src={image?.secure_url || imgPlaceholder.src}
                                            alt={image?.alt || product?.name || 'Product'}
                                            width={400}
                                            height={400}
                                            quality={82}
                                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                                            className="mx-auto h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </Link>

                                    {product?.category?.name && (
                                        <Link
                                            href={`${WEBSITE_SHOP}?category=${product.category.slug}`}
                                            className="text-muted-foreground"
                                        >
                                            <small>{product.category.name}</small>
                                        </Link>
                                    )}

                                    <div className="flex flex-col gap-2">
                                        <h3 className="truncate text-base font-semibold text-foreground">
                                            <Link href={href} title={product?.name}>{product?.name}</Link>
                                        </h3>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="font-semibold text-foreground">
                                                    {formatPrice(product?.sellingPrice)}
                                                </span>
                                                {hasDiscount && (
                                                    <span className="text-sm text-muted-foreground line-through">
                                                        {formatPrice(product?.mrp)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="flex items-center">
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <Star
                                                            key={index}
                                                            className={`size-3.5 ${index < filledStars
                                                                ? 'fill-[var(--brand-primary)] text-[var(--brand-primary)]'
                                                                : 'text-foreground/20'}`}
                                                        />
                                                    ))}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {product?.ratingAvg || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pushes the button and timer to the card foot so all
                                        three line up regardless of name wrapping. */}
                                    <div className="mt-auto flex flex-col gap-3 pt-1">
                                        {inCart ? (
                                            <Link
                                                href={WEBSITE_CART}
                                                className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md border border-[var(--brand-primary)] px-3 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)] hover:text-white"
                                            >
                                                <Check className="size-4" strokeWidth={3} />
                                                <span>Go To Cart</span>
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={!product?.defaultVariant}
                                                className="inline-flex w-full items-center justify-center gap-x-1.5 rounded-md bg-[var(--brand-primary)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary)]/30 disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                <Plus className="size-4" strokeWidth={3} />
                                                <span>Add to Cart</span>
                                            </button>
                                        )}

                                        <Countdown remaining={remaining} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                </div>
            </div>
        </section>
    )
}

export default DailyBestSellsSectionClient
