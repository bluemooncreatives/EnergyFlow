'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector } from 'react-redux'
import { ArrowRight } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { selectCartSummary } from '@/store/reducer/cartReducer'
import { useHydrated } from '@/hooks/useHydrated'
import { useBottomSlotTaken } from '@/hooks/useBottomSlot'
import { prefersReducedMotion } from '@/components/Application/Website/product/productUtils'
import { formatINR } from '@/components/Application/Website/storefront/format'
import { WEBSITE_CART, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Browsing pages, where a shopper adds things and needs a way on to the cart.
// Not the home page (kept clean), not the cart or checkout (they carry their
// own totals and buttons), not account pages.
const SHOW_ON = [WEBSITE_SHOP, '/category', '/product']
const showsOn = (path = '') => SHOW_ON.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

const MAX_THUMBS = 3
const TYPING = 'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable="true"]'

// True while a text field has focus. On phones the keyboard is up then, and a
// fixed bar would ride on top of it and cover what is being typed.
const useTyping = () => {
    const [typing, setTyping] = useState(false)
    useEffect(() => {
        let frame = 0
        const update = () => setTyping(Boolean(document.activeElement?.matches?.(TYPING)))
        // On focusout the next element is not focused yet; check a frame later.
        const onOut = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(update)
        }
        document.addEventListener('focusin', update)
        document.addEventListener('focusout', onOut)
        return () => {
            cancelAnimationFrame(frame)
            document.removeEventListener('focusin', update)
            document.removeEventListener('focusout', onOut)
        }
    }, [])
    return typing
}

/**
 * The bar's frame: slides in and out, holds nothing focusable while hidden,
 * and while shown publishes its footprint as --ef-cartbar-h on <html> so the
 * page foot and the newsletter teaser move clear. Hidden by CSS at desktop
 * widths, where it measures 0 and publishes nothing.
 */
export const CartBarShell = ({ visible, label, children }) => {
    const barRef = useRef(null)
    const typing = useTyping()
    const shown = visible && !typing

    useEffect(() => {
        const root = document.documentElement
        const bar = barRef.current
        if (!shown || !bar) {
            root.style.removeProperty('--ef-cartbar-h')
            return
        }
        const publish = () => {
            const height = bar.offsetHeight
            if (!height) {
                root.style.removeProperty('--ef-cartbar-h')
                return
            }
            const gap = parseFloat(getComputedStyle(bar).getPropertyValue('--ef-cartbar-gap')) || 0.75
            const rem = parseFloat(getComputedStyle(root).fontSize) || 16
            root.style.setProperty('--ef-cartbar-h', `${Math.ceil(height + gap * rem)}px`)
        }
        publish()
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null
        ro?.observe(bar)
        window.addEventListener('resize', publish)
        return () => {
            ro?.disconnect()
            window.removeEventListener('resize', publish)
            root.style.removeProperty('--ef-cartbar-h')
        }
    }, [shown])

    return (
        <div
            ref={barRef}
            className="ef-cartbar"
            data-visible={shown ? '' : undefined}
            aria-hidden={!shown}
            inert={!shown || undefined}
            role="region"
            aria-label={label}
        >
            {children}
        </div>
    )
}

// Overlapping photos of what is in the cart, the most recent first.
const Thumbs = ({ products }) => {
    const recent = products.slice(-MAX_THUMBS).reverse()
    const more = products.length - recent.length
    return (
        <span className="ef-cartbar__thumbs" aria-hidden="true">
            {recent.map((p) => (
                <span key={p.variantId} className="ef-cartbar__thumb">
                    <Image src={p.media || imgPlaceholder.src} alt="" fill sizes="34px" className="object-cover" />
                </span>
            ))}
            {more > 0 && <span className="ef-cartbar__thumb ef-cartbar__more">+{more}</span>}
        </span>
    )
}

/**
 * Site-wide mobile cart bar. Appears on browsing pages as soon as the cart
 * has something in it, updates live as items are added or quantities change,
 * and takes the shopper to the cart page. Steps aside while another bar holds
 * the bottom slot (the product page's buy bar), so only one is ever shown.
 */
const MobileCartBar = () => {
    const pathname = usePathname()
    const hydrated = useHydrated()
    const slotTaken = useBottomSlotTaken()
    const products = useSelector((store) => store.cartStore.products)
    const { units, subtotal, savings } = useSelector(selectCartSummary)
    const panelRef = useRef(null)
    const lastUnits = useRef(null)

    const visible = hydrated && units > 0 && showsOn(pathname) && !slotTaken

    // A small nudge when more lands in the cart, so the change is noticed
    // without a second toast.
    useEffect(() => {
        const previous = lastUnits.current
        lastUnits.current = units
        if (!visible || previous === null || units <= previous || prefersReducedMotion()) return
        panelRef.current?.animate?.(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }, { transform: 'scale(1)' }],
            { duration: 360, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
        )
    }, [units, visible])

    const itemsLabel = `${units} ${units === 1 ? 'item' : 'items'}`

    return (
        <CartBarShell visible={visible} label="Cart summary">
            <Link
                ref={panelRef}
                href={WEBSITE_CART}
                className="ef-cartbar__panel"
                aria-label={`View cart: ${itemsLabel}, total ${formatINR(subtotal)}`}
            >
                <Thumbs products={products} />
                <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-[0.75rem] font-medium opacity-85">
                        {itemsLabel}
                        {savings > 0 && <> · Save {formatINR(savings)}</>}
                    </span>
                    <span className="truncate text-[1.0625rem] font-semibold tabular-nums tracking-[-0.01em]">
                        {formatINR(subtotal)}
                    </span>
                </span>
                <span className="ef-cartbar__cta">
                    View cart <ArrowRight aria-hidden="true" />
                </span>
            </Link>
        </CartBarShell>
    )
}

export default MobileCartBar
