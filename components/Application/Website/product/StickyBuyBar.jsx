'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUp, ShoppingBag, Zap } from 'lucide-react'
import cloudinaryLoader from '@/lib/cloudinaryLoader'
import { formatINR } from '@/components/Application/Website/storefront/format'
import { WEBSITE_CART } from '@/routes/WebsiteRoute'
import { useClaimBottomSlot } from '@/hooks/useBottomSlot'
import { Stepper } from './ProductBuyBox'

/**
 * Compact buy bar that slides in once the main call-to-action has scrolled
 * above the viewport, and out again when it returns. Full-width on phones,
 * a floating capsule on desktop.
 *
 * While shown it publishes its height as --ef-buybar-h on <html> so other
 * bottom-pinned UI (the newsletter teaser) can move clear; the variable is
 * removed when the bar hides or the page unmounts.
 */
const StickyBuyBar = ({ watchRef, product, variant, image, cart, onAdd }) => {
    const barRef = useRef(null)
    const thumbRef = useRef(null)
    const [visible, setVisible] = useState(false)

    // A scroll check rather than an IntersectionObserver: an observer never
    // fires when the page jumps from below the buttons straight to above them
    // (anchor links, restored scroll, the End key), leaving the bar hidden.
    useEffect(() => {
        const el = watchRef.current
        if (!el) return
        let frame = 0
        const check = () => {
            frame = 0
            // Only once the buttons are above the fold, not before reaching them.
            setVisible(el.getBoundingClientRect().bottom < 0)
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(check) }
        check()
        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('scroll', schedule)
            window.removeEventListener('resize', schedule)
        }
    }, [watchRef])

    // While shown, the site-wide mobile cart bar steps aside (one bar at a time).
    useClaimBottomSlot(visible)

    useEffect(() => {
        const root = document.documentElement
        const bar = barRef.current
        if (!visible || !bar) {
            root.style.removeProperty('--ef-buybar-h')
            return
        }
        const publish = () => {
            // Desktop bar floats and never covers the teaser's corner.
            const floating = window.matchMedia('(min-width: 1024px)').matches
            root.style.setProperty('--ef-buybar-h', floating ? '0px' : `${bar.offsetHeight}px`)
        }
        publish()
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null
        ro?.observe(bar)
        window.addEventListener('resize', publish)
        return () => {
            ro?.disconnect()
            window.removeEventListener('resize', publish)
            root.style.removeProperty('--ef-buybar-h')
        }
    }, [visible])

    const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    return (
        <div
            ref={barRef}
            className="ef-pd-bar"
            data-visible={visible ? '' : undefined}
            aria-hidden={!visible}
            inert={!visible || undefined}
            role="region"
            aria-label="Quick purchase"
        >
            <div className="mx-auto flex max-w-[var(--container-max)] items-center gap-3">
                <button
                    ref={thumbRef}
                    type="button"
                    onClick={backToTop}
                    aria-label="Back to top of the product"
                    className="ef-focus group relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface-well"
                >
                    <Image src={image.src} alt="" fill sizes="48px" loader={image.placeholder ? undefined : cloudinaryLoader} className="object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-[rgb(4_28_21/0.55)] text-[var(--palette-cream)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                        <ArrowUp className="size-4" aria-hidden="true" />
                    </span>
                </button>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-strong">{product.name}</p>
                    <p className="truncate text-xs text-ink-muted">
                        {variant?.size && <>{variant.size} · </>}
                        <span className="font-semibold text-ink-strong">{formatINR(variant?.sellingPrice)}</span>
                        {Number(variant?.mrp) > Number(variant?.sellingPrice) && (
                            <span className="ml-1.5 line-through">{formatINR(variant.mrp)}</span>
                        )}
                    </p>
                </div>

                {!cart.canBuy ? (
                    <span className="ef-btn ef-btn--outline ef-btn--sm pointer-events-none opacity-60">Unavailable</span>
                ) : cart.inCart ? (
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <Stepper
                                size="sm"
                                tone="cart"
                                value={cart.cartQty}
                                onDec={cart.decrease}
                                onInc={cart.increase}
                                incDisabled={cart.atMax}
                                decLabel={cart.cartQty <= 1 ? 'Remove from cart' : 'Decrease quantity'}
                            />
                        </div>
                        <Link href={WEBSITE_CART} className="ef-btn ef-btn--primary h-11 px-4 text-xs sm:px-5">
                            <span className="sm:hidden">Cart ({cart.cartQty})</span>
                            <span className="hidden sm:inline">Go to cart</span>
                            <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => cart.buyNow(1)} className="ef-btn ef-btn--accent hidden h-11 px-5 text-xs sm:inline-flex">
                            <Zap aria-hidden="true" /> Buy now
                        </button>
                        <button type="button" onClick={() => onAdd(1, thumbRef.current)} className="ef-btn ef-btn--primary h-11 px-4 text-xs sm:px-5">
                            <ShoppingBag aria-hidden="true" /> Add<span className="hidden sm:inline"> to cart</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default StickyBuyBar
