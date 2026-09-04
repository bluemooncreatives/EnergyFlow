'use client'

import Image from 'next/image'
import { memo, useState } from 'react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { WEBSITE_CART, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { ChevronLeft, ChevronRight, Eye, ShoppingBag, Star } from 'lucide-react'
import { BrandButton, BrandOutlineButton } from '@/components/Application/Website/BrandButton'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'

const ProductBox = ({ product, priority = false }) => {
    const dispatch = useDispatch()
    const cartProducts = useSelector((store) => store.cartStore.products)

    const hasDiscount = product?.mrp > product?.sellingPrice
    const discount = hasDiscount ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100) : 0
    const rating = Number(product?.ratingAvg || 0)
    const filledStars = Math.round(rating)
    const ratingCount = Number(product?.ratingCount || 0)

    const variant = product?.defaultVariant
    const isInCart = variant
        ? cartProducts.some((item) => item.productId === product._id && item.variantId === variant._id)
        : false

    const [isAdding, setIsAdding] = useState(false)

    const images = product?.media?.length > 0
        ? product.media
        : [{ secure_url: imgPlaceholder.src, alt: product?.name }]
    const showArrows = images.length > 1
    const [imgIndex, setImgIndex] = useState(0)
    const activeImage = images[imgIndex]

    const slideImage = (e, dir) => {
        e.preventDefault()
        e.stopPropagation()
        setImgIndex((prev) => (prev + dir + images.length) % images.length)
    }

    const handleAddToCart = () => {
        if (!variant) return

        setIsAdding(true)
        dispatch(addIntoCart({
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            url: product.slug,
            size: variant.size,
            color: variant.color,
            mrp: variant.mrp ?? product.mrp,
            sellingPrice: variant.sellingPrice ?? product.sellingPrice,
            media: product?.media?.[0]?.secure_url || imgPlaceholder.src,
            qty: 1,
        }))
        showToast('success', 'Product added into cart.')
        setIsAdding(false)
    }

    return (
        <div className='group relative flex flex-col overflow-hidden rounded-[var(--radius)] border border-border/60 bg-background transition duration-300 hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-[var(--shadow-card-hover)]'>
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--product-card-bg)]">
                <span className={`absolute right-3 top-3 z-20 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm ${hasDiscount ? 'bg-[var(--dark-red)] text-white' : 'bg-background/90 text-foreground/70'}`}>
                    {hasDiscount ? `Sale ${discount}%` : 'Hot'}
                </span>

                <Link
                    href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                    aria-label={`View ${product?.name}`}
                    className="absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-xs border border-border/40 bg-background/85 text-foreground/70 opacity-0 shadow-sm backdrop-blur-sm transition duration-200 hover:bg-background hover:text-foreground group-hover:opacity-100"
                >
                    <Eye className="size-4" />
                </Link>

                <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className="block h-full w-full">
                    <Image
                        src={activeImage?.secure_url || imgPlaceholder.src}
                        width={600}
                        height={750}
                        alt={activeImage?.alt || product?.name}
                        title={activeImage?.title || product?.name}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={priority}
                        className='h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105'
                    />
                </Link>

                {showArrows && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous image"
                            onClick={(e) => slideImage(e, -1)}
                            className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background/85 text-foreground/70 opacity-100 shadow-sm backdrop-blur-sm transition duration-200 hover:bg-background hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next image"
                            onClick={(e) => slideImage(e, 1)}
                            className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/40 bg-background/85 text-foreground/70 opacity-100 shadow-sm backdrop-blur-sm transition duration-200 hover:bg-background hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100"
                        >
                            <ChevronRight className="size-4" />
                        </button>

                        <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`size-1.5 rounded-full transition-colors ${index === imgIndex ? 'bg-[var(--dark-red)]' : 'bg-background/70'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-2 border-t border-border/60 px-3 py-3.5 text-center font-neue sm:gap-2 sm:px-4 sm:py-5">
                <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} className="block w-full">
                    <h4 title={product?.name} className="w-full truncate text-left text-[15px] font-semibold leading-[1.2] text-foreground transition-colors group-hover:text-[var(--dark-red)] sm:text-base">
                        {product?.name}
                    </h4>
                </Link>

                <div className='flex w-full flex-col items-center gap-1 sm:flex-row sm:justify-between sm:gap-2'>
                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                    key={index}
                                    className={`size-3 ${index < filledStars ? 'fill-[var(--dark-red)] text-[var(--dark-red)]' : 'text-foreground/20'}`}
                                />
                            ))}
                        </div>
                        <span className='text-[11px] text-muted-foreground'>({ratingCount})</span>
                    </div>

                    <div className='flex items-baseline gap-1.5 sm:gap-2'>
                        <span className='text-base font-semibold text-foreground sm:text-[18px]'>
                            {product?.sellingPrice?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                        {hasDiscount && (
                            <span className='text-[12px] text-stone-700 line-through'>
                                {product?.mrp?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-1 grid w-full grid-cols-1 gap-2 sm:mt-0 sm:grid-cols-2">
                    {isInCart ? (
                        <BrandOutlineButton asChild className="text-[13px] tracking-normal sm:text-base">
                            <Link href={WEBSITE_CART}>Go To Cart</Link>
                        </BrandOutlineButton>
                    ) : (
                        <BrandOutlineButton
                            type="button"
                            disabled={!variant || isAdding}
                            onClick={handleAddToCart}
                            className="text-[13px] tracking-normal sm:text-base"
                        >
                            <ShoppingBag className="size-3.5" />
                            Add To Cart
                        </BrandOutlineButton>
                    )}

                    <BrandButton asChild className="text-[13px] tracking-normal sm:text-base">
                        <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)} aria-label={`Buy Product: ${product?.name}`}>
                            Buy Product
                        </Link>
                    </BrandButton>
                </div>
            </div>
        </div>
    )
}

export default memo(ProductBox)
