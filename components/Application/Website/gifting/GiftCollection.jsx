'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight, Building2, ShoppingBag, Zap } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { useReveal } from '@/hooks/useReveal'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import WishlistButton from '../WishlistButton'
import CartQtyStepper from '../storefront/CartQtyStepper'
import { discountPercent, formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton } from './GiftingSelection'
import styles from './gifting.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const pad = (n) => String(n).padStart(2, '0')

const GiftBoxRow = ({ product, index, total }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart, buyNow } = useCartProduct(product)
    const [active, setActive] = useState(0)

    const name = formatProductName(product.name) || 'Gift box'
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const media = (product.media || []).filter((m) => m?.secure_url)
    const images = media.length ? media : [{ _id: 'placeholder', secure_url: imgPlaceholder.src, alt: name }]
    const image = images[Math.min(active, images.length - 1)]

    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)
    const flip = index % 2 === 1

    return (
        <article className={cn(styles.row, flip && styles.rowFlip)} data-gift-row aria-labelledby={`gift-${product._id}`}>
            <div className={styles.media}>
                <span className={styles.mediaIndex} aria-hidden="true">{pad(index + 1)}</span>
                <div className={styles.mediaFrame} data-gift-frame>
                    <Link href={href} className="ef-focus absolute inset-0 z-[1]" aria-label={`View ${name}`} tabIndex={-1} />
                    <Image
                        src={image.secure_url}
                        alt={image.alt || name}
                        fill
                        sizes="(max-width: 1024px) 92vw, 48vw"
                        className={cn('object-cover', styles.mediaImg)}
                        data-gift-img
                    />
                    {off > 0 && (
                        <span className="ef-badge ef-badge--sale pointer-events-none absolute left-4 top-4 z-[2]">{off}% off</span>
                    )}
                    <div className="absolute right-4 top-4 z-[2]">
                        <WishlistButton productId={product._id} name={product.name} />
                    </div>
                </div>

                {images.length > 1 && (
                    <div className={styles.thumbs} role="group" aria-label={`${name} photos`}>
                        {images.slice(0, 5).map((img, i) => (
                            <button
                                key={img._id || i}
                                type="button"
                                className={cn('ef-focus', styles.thumb)}
                                aria-pressed={i === active}
                                aria-label={`Show photo ${i + 1} of ${Math.min(images.length, 5)}`}
                                onClick={() => setActive(i)}
                            >
                                <Image src={img.secure_url} alt="" fill sizes="60px" className="object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-col items-start gap-5">
                <p className={styles.rowCount} data-reveal>
                    Signature box {pad(index + 1)} / {pad(total)}
                </p>
                <h3 id={`gift-${product._id}`} className={styles.rowName} data-reveal>
                    <Link href={href} className="ef-focus rounded-sm">{name}</Link>
                </h3>

                {product.summary && (
                    <p className="ef-lead max-w-xl" data-reveal>{product.summary}</p>
                )}

                {product.sizes?.length > 0 && (
                    <div className="flex flex-col gap-2" data-reveal>
                        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                            {product.sizes.length === 1 ? 'Pack' : 'Available in'}
                        </span>
                        <div className={styles.sizes}>
                            {product.sizes.map((size) => <span key={size} className={styles.sizeChip}>{size}</span>)}
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" data-reveal>
                    {formatINR(price) ? (
                        <>
                            <span className={styles.priceNow}>
                                {product.sizes?.length > 1 && <span className="mr-1.5 text-[0.5em] align-middle text-ink-muted">from</span>}
                                {formatINR(price)}
                            </span>
                            {Number(mrp) > Number(price) && (
                                <span className="text-[0.9375rem] text-ink-muted line-through">
                                    <span className="sr-only">MRP </span>{formatINR(mrp)}
                                </span>
                            )}
                            <span className="text-[0.8125rem] text-ink-muted">per box, retail</span>
                        </>
                    ) : (
                        <span className="text-[0.9375rem] text-ink-muted">Price on request</span>
                    )}
                </div>

                <div className="flex w-full flex-col gap-3 sm:max-w-md" data-reveal>
                    <div className="grid grid-cols-2 gap-2.5">
                        {inCart ? (
                            <CartQtyStepper
                                qty={qty}
                                atMax={atMax}
                                onIncrease={increase}
                                onDecrease={decrease}
                                name={name}
                                block
                            />
                        ) : (
                            <button
                                type="button"
                                className="ef-btn ef-btn--primary"
                                onClick={addToCart}
                                disabled={!canAdd}
                                aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                            >
                                <ShoppingBag aria-hidden="true" /> Add to cart
                            </button>
                        )}
                        <button
                            type="button"
                            className="ef-btn ef-btn--accent"
                            onClick={buyNow}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Buy now: ${name}` : `Unavailable: ${name}`}
                        >
                            <Zap aria-hidden="true" /> Buy now
                        </button>
                    </div>
                    <EnquireButton
                        productId={product._id}
                        className="ef-btn ef-btn--outline w-full justify-between"
                        aria-label={`Enquire about bulk orders of ${name}`}
                    >
                        <span className="inline-flex items-center gap-2"><Building2 aria-hidden="true" /> Enquire for bulk / corporate</span>
                        <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                    </EnquireButton>
                </div>
            </div>
        </article>
    )
}

const GiftCollection = ({ products = [] }) => {
    const rootRef = useRef(null)
    useReveal(rootRef, [products.length])

    useGSAP(() => {
        const root = rootRef.current
        if (!root) return
        const mm = gsap.matchMedia()
        mm.add('(prefers-reduced-motion: no-preference)', () => {
            gsap.utils.toArray(root.querySelectorAll('[data-gift-row]')).forEach((row) => {
                const frame = row.querySelector('[data-gift-frame]')
                const img = row.querySelector('[data-gift-img]')
                if (!frame) return
                // The photo opens out of a smaller rounded window…
                gsap.fromTo(frame,
                    { clipPath: 'inset(14% 10% 14% 10% round 28px)' },
                    {
                        clipPath: 'inset(0% 0% 0% 0% round 28px)',
                        duration: 1.4,
                        ease: 'expo.out',
                        scrollTrigger: { trigger: row, start: 'top 82%', once: true },
                        onComplete: () => gsap.set(frame, { clearProps: 'clipPath' }),
                    })
                // …and keeps a slow parallax drift while it is on screen.
                if (img) {
                    gsap.fromTo(img, { yPercent: -6, scale: 1.14 }, {
                        yPercent: 6,
                        scale: 1.14,
                        ease: 'none',
                        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
                    })
                }
            })
        })
        return () => mm.revert()
    }, { scope: rootRef, dependencies: [products.length] })

    return (
        <section id={COLLECTION_ANCHOR} ref={rootRef} className="ef-section ef-section--page scroll-mt-20" aria-labelledby="collection-title">
            <div className="ef-container">
                <div className={styles.collectionHead}>
                    <div className="flex max-w-2xl flex-col items-start gap-3">
                        <span className="ef-eyebrow" data-reveal>The collection</span>
                        <h2 id="collection-title" className="ef-title" data-reveal>
                            Signature <span className="ef-title__accent">gift boxes</span>
                        </h2>
                    </div>
                    <p className="ef-lead max-w-md" data-reveal>
                        Order one for someone special, or a few hundred for the whole team. Every box can be
                        branded and packed to your brief.
                    </p>
                </div>

                <div className={styles.rows}>
                    {products.map((product, index) => (
                        <GiftBoxRow key={product._id} product={product} index={index} total={products.length} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default GiftCollection
