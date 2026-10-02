'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowRight, ArrowUpRight, Gift, Plus } from 'lucide-react'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { useCartProduct } from '@/hooks/useCartProduct'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import CartQtyStepper from './storefront/CartQtyStepper'
import { discountPercent, formatINR } from './storefront/format'

gsap.registerPlugin(useGSAP)

const TONES = {
    inverse: 'ef-section--inverse',
    page: 'ef-section--page',
    sunken: 'ef-section--sunken',
}

const pad = (n) => String(n).padStart(2, '0')
const photoOf = (product) => product.media?.find((item) => item?.secure_url)?.secure_url || imgPlaceholder.src

// One line of the index. The whole row links to the box; the cart control
// sits above that link. On hover a cream fill sweeps in from the left and the
// type turns pine (desktop). Phones get a thumbnail instead of the cursor photo.
const GiftRow = ({ product, index, onEnter }) => {
    const { variant, inCart, qty, atMax, increase, decrease, canAdd, addToCart } = useCartProduct(product)
    const href = WEBSITE_PRODUCT_DETAILS(product)
    const name = formatProductName(product.name) || 'Gift box'
    const price = variant?.sellingPrice ?? product.sellingPrice
    const mrp = variant?.mrp ?? product.mrp
    const off = discountPercent(mrp, price)

    return (
        <li
            onMouseEnter={onEnter}
            className="group/row relative isolate border-t border-white/10 last:border-b"
        >
            {/* hover sweep */}
            <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-[var(--palette-cream)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover/row:scale-x-100 motion-reduce:transition-none"
            />

            <Link href={href} className="ef-focus absolute inset-0 z-0" aria-label={`${name}, ${formatINR(price)}`} />

            <div className="pointer-events-none relative grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-3 transition-[padding,color] duration-500 ease-[var(--ease-spring)] sm:gap-5 lg:grid-cols-[3rem_minmax(0,1fr)_7rem_8rem_auto] lg:py-6 lg:group-hover/row:px-6 lg:group-hover/row:text-[var(--palette-pine)] motion-reduce:transition-none">
                {/* number (desktop) / thumbnail (touch) */}
                <span className="hidden font-header text-sm font-semibold tabular-nums text-[var(--brand-amber)] lg:block lg:group-hover/row:text-[var(--palette-forest)]">
                    {pad(index + 1)}
                </span>
                <span className="relative size-14 overflow-hidden rounded-[var(--radius-sm)] bg-white/5 lg:hidden">
                    <Image src={photoOf(product)} alt="" fill sizes="56px" className="object-cover" />
                </span>

                <span className="min-w-0">
                    <span className="block truncate font-header text-[1.0625rem] font-semibold uppercase leading-tight sm:text-xl lg:text-[clamp(1.75rem,1rem+2vw,3rem)] lg:leading-none">
                        {name}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[0.8125rem] text-[var(--ink-on-inverse-muted)] lg:hidden">
                        <span className="font-semibold text-[var(--ink-on-inverse)]">{formatINR(price)}</span>
                        {variant?.size && <span>· {variant.size}</span>}
                        {off > 0 && <span className="text-[var(--brand-amber)]">· {off}% off</span>}
                    </span>
                </span>

                <span className="hidden text-sm text-[var(--ink-on-inverse-muted)] lg:block lg:group-hover/row:text-[rgb(11_61_46/0.7)]">
                    {variant?.size}{off > 0 && <> · {off}% off</>}
                </span>
                <span className="hidden text-right lg:block">
                    <span className="block font-header text-2xl font-semibold tabular-nums">{formatINR(price)}</span>
                    {Number(mrp) > Number(price) && (
                        <span className="text-xs text-[var(--ink-on-inverse-muted)] line-through lg:group-hover/row:text-[rgb(11_61_46/0.6)]">
                            <span className="sr-only">MRP </span>{formatINR(mrp)}
                        </span>
                    )}
                </span>

                <span className="pointer-events-auto relative z-10 flex items-center gap-2">
                    {inCart ? (
                        <CartQtyStepper qty={qty} atMax={atMax} onIncrease={increase} onDecrease={decrease} name={name} tone="soft" size="sm" />
                    ) : (
                        <button
                            type="button"
                            onClick={addToCart}
                            disabled={!canAdd}
                            aria-label={canAdd ? `Add to cart: ${name}` : `Unavailable: ${name}`}
                            title="Add to cart"
                            className="ef-focus flex size-11 items-center justify-center rounded-full bg-[var(--brand-amber)] text-[var(--brand-sun-ink)] transition-transform duration-300 hover:scale-110 disabled:opacity-40 motion-reduce:transition-none"
                        >
                            <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
                        </button>
                    )}
                    <ArrowUpRight
                        aria-hidden="true"
                        className="hidden size-7 -rotate-45 opacity-0 transition-[transform,opacity] duration-500 ease-[var(--ease-spring)] group-hover/row:rotate-0 group-hover/row:opacity-100 lg:block"
                    />
                </span>
            </div>
        </li>
    )
}

/**
 * "Gifts worth unboxing" — the Gift Boxes category as an editorial index on
 * the pine band. Each box is one line of big display type; on desktop a photo
 * of the hovered box follows the cursor, and the row fills cream. Phones get
 * compact rows with a thumbnail and an add button. Compact by design: one
 * header row and at most four lines.
 */
const GiftBoxesShowcase = ({ products = [], total = 0, fromPrice = null, categoryHref, tone = 'inverse' }) => {
    const listRef = useRef(null)
    const floatRef = useRef(null)
    const moveRef = useRef(null)
    const [active, setActive] = useState(0)
    const [hovering, setHovering] = useState(false)

    // Cursor-follow photo: eased x/y, desktop pointers only.
    useGSAP(() => {
        const el = floatRef.current
        if (!el) return
        const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' })
        const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' })
        moveRef.current = (px, py) => { x(px); y(py) }
    }, { scope: listRef })

    if (!products.length) return null
    const count = Number(total) || products.length
    const boxes = products.slice(0, 4)

    const onMove = (event) => {
        const rect = listRef.current?.getBoundingClientRect()
        if (!rect || !moveRef.current) return
        moveRef.current(event.clientX - rect.left, event.clientY - rect.top)
    }

    return (
        <section aria-labelledby="gift-edit-title" className={cn('ef-section ef-section--tight', TONES[tone] || TONES.inverse)}>
            <div className="ef-container flex flex-col gap-8 lg:gap-12">
                <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
                    <div className="flex min-w-0 flex-col items-start gap-3">
                        <span className="ef-eyebrow">Gift boxes · {pad(count)}</span>
                        <h2 id="gift-edit-title" className="ef-title !text-[clamp(2rem,1.3rem+2.8vw,3.5rem)]">
                            Gifts worth <span className="ef-title__accent">unboxing</span>
                        </h2>
                    </div>
                    <div className="flex max-w-sm flex-col items-start gap-4 md:items-end md:text-right">
                        <p className="m-0 text-[0.9375rem] leading-relaxed text-[var(--ink-on-inverse-muted)]">
                            Keepsake boxes of dry fruits in glass jars, ready to give
                            {fromPrice ? <>, from <strong className="font-semibold text-[var(--ink-on-inverse)]">{formatINR(fromPrice)}</strong></> : null}.
                        </p>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 md:justify-end">
                            <Link href={categoryHref} className="ef-btn ef-btn--accent ef-btn--sm">
                                Shop all <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                            </Link>
                            <Link
                                href={`${categoryHref}#enquire`}
                                className="ef-focus inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold text-[var(--ink-on-inverse)] underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-[var(--brand-amber)]"
                            >
                                <Gift className="size-4" aria-hidden="true" /> Bulk &amp; corporate
                            </Link>
                        </div>
                    </div>
                </header>

                <div
                    ref={listRef}
                    className="relative"
                    onMouseMove={onMove}
                    onMouseEnter={() => setHovering(true)}
                    onMouseLeave={() => setHovering(false)}
                >
                    <ul aria-label="Gift boxes" className="m-0 list-none p-0">
                        {boxes.map((product, index) => (
                            <GiftRow key={product._id} product={product} index={index} onEnter={() => setActive(index)} />
                        ))}
                    </ul>

                    {/* Cursor-follow photo — desktop pointers, motion allowed */}
                    <div
                        ref={floatRef}
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-0 z-20 hidden motion-reduce:!hidden lg:[@media(hover:hover)]:block"
                    >
                        <div
                            className={cn(
                                'relative -ml-32 -mt-44 h-[22rem] w-64 overflow-hidden rounded-[var(--radius-tile)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] transition-[opacity,transform] duration-500 ease-[var(--ease-spring)]',
                                hovering ? 'scale-100 rotate-[-4deg] opacity-100' : 'scale-75 rotate-0 opacity-0'
                            )}
                        >
                            {boxes.map((product, index) => (
                                <Image
                                    key={product._id}
                                    src={photoOf(product)}
                                    alt=""
                                    fill
                                    sizes="256px"
                                    className={cn(
                                        'object-cover transition-[opacity,transform] duration-500',
                                        index === active ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftBoxesShowcase
