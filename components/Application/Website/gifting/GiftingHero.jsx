'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronRight, Gift } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_HOME, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton, jumpTo } from './GiftingSelection'
import { photoOf, priceOf } from './GiftingUi'

// Vertical rhythm that shrinks with the viewport height, so the whole hero
// always fits one screen.
const GAP = 'mt-[clamp(0.75rem,2.6svh,1.75rem)]'

// A photo tile in the hero bento, linking to its box. Tiles fill their grid
// cell (no aspect ratio), so the bento always takes exactly the space left.
const BoxTile = ({ product, priority, sizes, className, children }) => {
    const name = formatProductName(product.name)
    return (
        <Link
            href={WEBSITE_PRODUCT_DETAILS(product)}
            className={cn('ef-tile ef-focus group block min-h-0 bg-surface-well shadow-elev-2', className)}
            aria-label={`View ${name}`}
            data-reveal
        >
            <Image
                src={photoOf(product)}
                alt={`${name} gift box`}
                fill
                priority={priority}
                sizes={sizes}
                className="-z-10 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
            {children}
        </Link>
    )
}

/**
 * The gift boxes hero: exactly one screen tall (100svh) at every size, on the
 * storefront's page-hero band. Breadcrumb, the page's <h1>, the two paths
 * (shop a box / plan a bulk order) and a ruled row of facts; beside them on
 * desktop, below them on phones, a bento of the boxes that fills whatever
 * height is left, with a sunflower tile into bulk ordering.
 *
 * Type and spacing scale with the viewport height as well as its width, and
 * the optional bits (eyebrow, the lead's second sentence) step aside on short
 * screens, so nothing is ever cut off below the fold.
 */
const GiftingHero = ({ products = [], eyebrow }) => {
    const rootRef = useRef(null)
    useReveal(rootRef, [products.length])

    const boxes = products.filter(photoOf)
    const [lead, second] = boxes
    const prices = products.map(priceOf).map(Number).filter((n) => Number.isFinite(n) && n > 0)
    const fromPrice = prices.length ? Math.min(...prices) : null
    const leadPrice = lead && formatINR(priceOf(lead))

    const stats = [
        fromPrice && { value: formatINR(fromPrice), label: 'Gift boxes from' },
        { value: `${MIN_GIFT_QUANTITY}+`, label: 'Boxes for bulk pricing' },
        { value: 'Pan-India', label: 'Free delivery' },
    ].filter(Boolean)

    return (
        <section
            ref={rootRef}
            className="relative isolate flex h-[100svh] min-h-[36rem] flex-col overflow-hidden bg-surface-sunken"
            aria-labelledby="gifting-title"
        >
            <span aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 -z-10 size-[34rem] rounded-full bg-tint-pistachio opacity-70 blur-3xl" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-40 -z-10 size-[28rem] rounded-full bg-tint-almond opacity-60 blur-3xl" />

            {/* Top padding clears the fixed site header. */}
            <div className="ef-container flex min-h-0 flex-1 flex-col gap-[clamp(1rem,3svh,2.5rem)] pb-[clamp(1rem,3svh,2rem)] pt-[5.25rem] sm:pt-[6.25rem] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-14">
                {/* ── Copy ── */}
                <div className="flex min-w-0 shrink-0 flex-col items-start lg:justify-center">
                    <nav aria-label="Breadcrumb" data-reveal>
                        <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-muted">
                            <li><Link href={WEBSITE_HOME} className="ef-focus rounded-sm transition-colors hover:text-brand">Home</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><Link href={WEBSITE_SHOP} className="ef-focus rounded-sm transition-colors hover:text-brand">Shop</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><span aria-current="page" className="text-ink-strong">Gift Boxes</span></li>
                        </ol>
                    </nav>

                    {eyebrow && (
                        <span className={cn('ef-eyebrow max-sm:hidden [@media(max-height:700px)]:hidden', GAP)} data-reveal>{eyebrow}</span>
                    )}

                    <h1
                        id="gifting-title"
                        className={cn(
                            'ef-title !leading-[0.95]',
                            '!text-[clamp(1.875rem,min(9.4vw,5.4svh),2.75rem)] sm:!text-[clamp(2.25rem,min(6vw,7svh),4rem)] lg:!text-[clamp(2.25rem,min(4.6vw,8.6svh),5.5rem)]',
                            'mt-[clamp(0.625rem,2svh,1.25rem)]'
                        )}
                        data-reveal
                    >
                        Dry fruit gift boxes, <span className="ef-title__accent">made to be given</span>
                    </h1>

                    <p className={cn('ef-lead max-w-xl', GAP)} data-reveal>
                        Premium dry fruits in glass jars, packed in keepsake boxes.
                        <span className="max-sm:hidden [@media(max-height:720px)]:hidden"> Send one to someone special, or a few hundred to your whole team with your brand on every box.</span>
                    </p>

                    <div className={cn('grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3', GAP)} data-reveal>
                        {products.length > 0 && (
                            <a
                                href={`#${COLLECTION_ANCHOR}`}
                                onClick={(e) => jumpTo(e, COLLECTION_ANCHOR)}
                                className="ef-btn ef-btn--primary ef-btn--lg max-sm:!px-3 max-sm:[--btn-h:3rem]"
                            >
                                <span className="sm:hidden">Shop boxes</span>
                                <span className="max-sm:hidden">Shop the boxes</span>
                                <ArrowDown aria-hidden="true" />
                            </a>
                        )}
                        <EnquireButton className={cn('ef-cta justify-between', !products.length && 'col-span-2')}>
                            <span><span className="sm:hidden">Bulk order</span><span className="max-sm:hidden">Plan a bulk order</span></span>
                            <span className="ef-cta__box" aria-hidden="true"><ArrowRight /></span>
                        </EnquireButton>
                    </div>

                    <dl className={cn('grid w-full max-w-xl grid-cols-3 divide-x divide-line-rule border-y border-line-rule', GAP)} data-reveal>
                        {stats.map(({ value, label }) => (
                            <div key={label} className="flex flex-col-reverse gap-1 px-3 py-[clamp(0.5rem,1.6svh,1rem)] first:pl-0 sm:px-4">
                                <dt className="text-[0.75rem] leading-snug text-ink-muted">{label}</dt>
                                <dd className="font-header text-[clamp(1.125rem,min(1rem+1vw,4svh),1.875rem)] font-semibold leading-none text-ink-strong">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* ── Bento: fills the height that is left ── */}
                {lead && (
                    <div className="grid min-h-[9rem] flex-1 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-[var(--grid-gap)] sm:grid-rows-2 lg:min-h-0">
                        <BoxTile
                            product={lead}
                            priority
                            sizes="(max-width: 1024px) 60vw, 32vw"
                            className="h-full sm:row-span-2"
                        >
                            <span className="ef-badge ef-badge--soft absolute left-3 top-3 sm:left-4 sm:top-4">Signature box</span>
                            <span className="ef-card absolute inset-x-2 bottom-2 flex-row items-center gap-3 p-2.5 shadow-elev-2 sm:inset-x-4 sm:bottom-4 sm:p-3">
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-header text-[clamp(0.9375rem,0.8rem+0.5vw,1.125rem)] font-semibold uppercase leading-tight text-ink-strong">
                                        {formatProductName(lead.name)}
                                    </span>
                                    <span className="block truncate text-[0.8125rem] text-ink-muted [@media(max-height:700px)]:hidden">
                                        {[lead.nickname && `“${lead.nickname}”`, leadPrice].filter(Boolean).join(' · ')}
                                    </span>
                                </span>
                                <span className="ef-icon-btn max-sm:!size-9 transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand" aria-hidden="true">
                                    <ArrowUpRight />
                                </span>
                            </span>
                        </BoxTile>

                        {second && (
                            <BoxTile product={second} sizes="(max-width: 1024px) 36vw, 20vw" className="h-full max-sm:hidden">
                                <span className="ef-badge ef-badge--soft absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate">
                                    {formatProductName(second.name)}
                                </span>
                            </BoxTile>
                        )}

                        <EnquireButton
                            className={cn(
                                'ef-tile ef-focus group flex h-full min-h-0 flex-col justify-between gap-2 bg-sun p-3.5 text-left text-sun-ink shadow-elev-2 sm:p-5',
                                !second && 'sm:row-span-2'
                            )}
                            aria-label="Plan a bulk or corporate order"
                            data-reveal
                        >
                            <span className="ef-seal ef-seal--pine !size-10 sm:!size-14"><Gift aria-hidden="true" /></span>
                            <span>
                                <span className="block font-header text-[clamp(1.375rem,min(2.6vw,4.6svh),2.75rem)] font-semibold leading-none">
                                    {MIN_GIFT_QUANTITY}+ boxes?
                                </span>
                                <span className="mt-1.5 flex items-end justify-between gap-2 text-[0.8125rem] font-medium leading-snug">
                                    Get volume pricing &amp; branding
                                    <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                                </span>
                            </span>
                        </EnquireButton>
                    </div>
                )}
            </div>
        </section>
    )
}

export default GiftingHero
