'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { Check, Eye, Plus, Star } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'

gsap.registerPlugin(ScrollTrigger)

// Each banner carries its own scrim: enough white behind the copy to keep it
// legible, faded out by ~60% so the photograph itself stays contrasty. A single
// wide scrim washed both images out, the jelly shot worst of all — it has
// subject matter edge to edge, where the nuts shot is already empty on the left.
const PROMO_BANNERS = [
    {
        title: 'Fruit Jellies',
        image: '/assets/images/banner/fruit-jellies.jpg',
        alt: 'Assorted real-fruit jelly cubes surrounded by fresh fruit',
        discount: '30%',
        href: WEBSITE_SHOP,
        scrim: 'from-white/90 from-0% via-white/40 via-32% to-transparent to-60%',
    },
    {
        title: 'Dry Fruits & Nuts',
        image: '/assets/images/banner/dry-fruits.jpg',
        alt: 'Almonds, cashews, walnuts and pecans on a warm background',
        discount: '25%',
        href: WEBSITE_SHOP,
        scrim: 'from-white/60 from-0% via-white/20 via-28% to-transparent to-52%',
    },
]

const formatPrice = (price) =>
    typeof price === 'number'
        ? price.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
        : null

const PopularProductsSectionClient = ({ products = [] }) => {
    const sectionRef = useRef(null)
    const bannersRef = useRef(null)
    const gridRef = useRef(null)

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
        const banners = bannersRef.current?.children
        if (banners?.length) {
            gsap.fromTo(banners,
                { autoAlpha: 0, y: 32 },
                {
                    autoAlpha: 1, y: 0,
                    duration: 0.85, ease: 'power3.out', stagger: 0.12,
                    scrollTrigger: { trigger: bannersRef.current, start: 'top 85%', once: true },
                }
            )
        }

        const cards = gridRef.current?.children
        if (cards?.length) {
            gsap.fromTo(cards,
                { autoAlpha: 0, y: 40 },
                {
                    autoAlpha: 1, y: 0,
                    duration: 0.75, ease: 'power3.out', stagger: 0.06,
                    scrollTrigger: { trigger: gridRef.current, start: 'top 85%', once: true },
                }
            )
        }
    }, { scope: sectionRef, dependencies: [products.length] })

    return (
        <section ref={sectionRef} className="website-gutter py-8 lg:py-14">
            <div className="website-content font-neue">

                {/* ── Promo banners ── */}
                <div ref={bannersRef} className="flex flex-col gap-4 md:flex-row md:gap-6">
                    {PROMO_BANNERS.map((banner) => (
                        <div key={banner.title} className="relative w-full overflow-hidden rounded-lg md:w-1/2">
                            <Image
                                src={banner.image}
                                alt={banner.alt}
                                width={735}
                                height={410}
                                quality={82}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="h-[220px] w-full object-cover sm:h-[240px]"
                            />

                            <div className={`absolute inset-0 bg-gradient-to-r ${banner.scrim}`} />

                            <div className="absolute inset-0 flex flex-col justify-center gap-5 px-8 py-10">
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-header text-xl font-bold text-[var(--brand-ink)] sm:text-2xl">
                                        {banner.title}
                                    </h3>
                                    <p className="text-sm text-[var(--text-body)]">
                                        Get Upto{' '}
                                        <span className="font-bold text-[var(--brand-primary)]">{banner.discount}</span>
                                        {' '}Off
                                    </p>
                                </div>

                                <div className="flex flex-wrap">
                                    <Link
                                        href={banner.href}
                                        className="inline-flex items-center gap-x-2 rounded-sm bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-[var(--brand-primary-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary)]/30"
                                    >
                                        Shop Now
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Popular products ── */}
                {products.length > 0 && (
                    <div className="mt-8 lg:mt-14">
                        <h2 className="mb-6 font-header text-2xl uppercase tracking-[0.02em] text-[var(--brand-primary-hover)] sm:text-3xl">
                            Popular Products
                        </h2>

                        <div ref={gridRef} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                            {products.map((product) => {
                                const href = WEBSITE_PRODUCT_DETAILS(product.slug)
                                const image = product?.media?.[0]
                                const hasDiscount = product?.mrp > product?.sellingPrice
                                const discount = hasDiscount
                                    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
                                    : 0
                                const filledStars = Math.round(Number(product?.ratingAvg || 0))
                                const inCart = isInCart(product)

                                return (
                                    <div
                                        key={product._id}
                                        className="group relative break-words rounded-lg border border-border bg-background transition duration-300 hover:border-[var(--brand-primary)]/40 hover:shadow-[var(--shadow-card-hover)]"
                                    >
                                        <div className="flex-auto p-4">
                                            <div className="relative flex justify-center text-center">
                                                {hasDiscount && (
                                                    <span className="absolute left-0 top-0 z-20 inline-block rounded bg-[var(--brand-primary)] p-1 text-sm font-semibold leading-none text-white">
                                                        {discount}%
                                                    </span>
                                                )}

                                                <Link href={href} aria-label={`View ${product?.name}`} className="block w-full">
                                                    <Image
                                                        src={image?.secure_url || imgPlaceholder.src}
                                                        alt={image?.alt || product?.name || 'Product'}
                                                        width={400}
                                                        height={400}
                                                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                                                        className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </Link>

                                                {/* Quick actions, revealed on hover like the rest of the storefront cards */}
                                                <div className="invisible absolute bottom-[15%] flex w-full justify-center gap-2 opacity-0 transition duration-300 group-hover:visible group-hover:opacity-100">
                                                    <Link
                                                        href={href}
                                                        aria-label={`View ${product?.name}`}
                                                        title="View product"
                                                        className="inline-flex size-[34px] items-center justify-center rounded-lg bg-white shadow transition-colors hover:bg-[var(--brand-primary)] hover:text-white"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>

                                                    {inCart ? (
                                                        <Link
                                                            href={WEBSITE_CART}
                                                            aria-label="Go to cart"
                                                            title="Go to cart"
                                                            className="inline-flex size-[34px] items-center justify-center rounded-lg bg-white shadow transition-colors hover:bg-[var(--brand-primary)] hover:text-white"
                                                        >
                                                            <Check className="size-4" />
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleAddToCart(e, product)}
                                                            disabled={!product?.defaultVariant}
                                                            aria-label={`Add ${product?.name} to cart`}
                                                            title="Add to cart"
                                                            className="inline-flex size-[34px] items-center justify-center rounded-lg bg-white shadow transition-colors hover:bg-[var(--brand-primary)] hover:text-white disabled:pointer-events-none disabled:opacity-50"
                                                        >
                                                            <Plus className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                {product?.category?.name && (
                                                    <Link
                                                        href={`${WEBSITE_SHOP}?category=${product.category.slug}`}
                                                        className="text-muted-foreground"
                                                    >
                                                        <small>{product.category.name}</small>
                                                    </Link>
                                                )}

                                                <div className="flex flex-col gap-2">
                                                    <h3 className="truncate text-base">
                                                        <Link href={href} title={product?.name}>{product?.name}</Link>
                                                    </h3>

                                                    <div className="flex flex-row items-center gap-3">
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
                                                        <div className="flex flex-row gap-1 text-sm text-muted-foreground">
                                                            <span>{product?.ratingAvg || 0}</span>
                                                            <span>({product?.ratingCount || 0})</span>
                                                        </div>
                                                    </div>
                                                </div>

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

                                                    {inCart ? (
                                                        <Link
                                                            href={WEBSITE_CART}
                                                            className="inline-flex items-center gap-x-1 rounded-sm border border-[var(--brand-primary)] px-2.5 py-1.5 text-sm font-medium text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-primary)] hover:text-white"
                                                        >
                                                            <Check className="size-3.5" strokeWidth={3} />
                                                            <span>In Cart</span>
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleAddToCart(e, product)}
                                                            disabled={!product?.defaultVariant}
                                                            className="inline-flex items-center gap-x-1 rounded-sm bg-[var(--brand-primary)] px-2.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-primary-hover)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-primary)]/30 disabled:pointer-events-none disabled:opacity-50"
                                                        >
                                                            <Plus className="size-3.5" strokeWidth={3} />
                                                            <span>Add</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

            </div>
        </section>
    )
}

export default PopularProductsSectionClient
