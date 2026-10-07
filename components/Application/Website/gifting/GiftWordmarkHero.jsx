'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ArrowRight, ChevronRight } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { formatProductName } from '@/lib/seo'
import { WEBSITE_HOME, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { formatINR } from '../storefront/format'
import { COLLECTION_ANCHOR, EnquireButton, jumpTo } from './GiftingSelection'
import { pickImage, priceOf } from './GiftingUi'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Wordmark size bounds (px). Below the floor the words wrap instead.
const MIN_PX = 40
const MAX_PX = 288

/**
 * The headline set edge to edge: measured once at a known size, then scaled
 * so the line fills its column exactly, at every width and for any wording
 * the admin types. Until that runs (or without JS) a CSS estimate from the
 * character count lands within a few percent, so the swap barely moves.
 */
const FitWordmark = ({ text }) => {
    const ref = useRef(null)

    useIsoLayoutEffect(() => {
        const el = ref.current
        const box = el?.parentElement
        if (!el || !box) return undefined

        let frame = 0
        const fit = () => {
            el.style.whiteSpace = 'nowrap'
            el.style.fontSize = '100px'
            const natural = el.getBoundingClientRect().width
            const available = box.clientWidth
            if (!natural || !available) return
            // A hair under exact, so rounding never tips it into a scrollbar.
            const size = ((100 * available) / natural) * 0.995
            if (size < MIN_PX) {
                el.style.whiteSpace = 'normal'
                el.style.fontSize = `${MIN_PX}px`
            } else {
                el.style.fontSize = `${Math.min(size, MAX_PX)}px`
            }
        }

        fit()
        const ro = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                cancelAnimationFrame(frame)
                frame = requestAnimationFrame(fit)
            })
            : null
        ro?.observe(box)
        // The display face may land after first paint and is wider than its
        // fallback: measure again once it has.
        document.fonts?.ready?.then(fit).catch(() => {})
        return () => {
            ro?.disconnect()
            cancelAnimationFrame(frame)
        }
    }, [text])

    return (
        <span
            ref={ref}
            className="inline-block whitespace-nowrap"
            style={{
                fontSize: `clamp(${MIN_PX}px, calc((min(100vw, var(--container-max)) - 2 * var(--website-gutter)) / ${Math.max(text.length, 4) * 0.64}), ${MAX_PX}px)`,
            }}
        >
            {text}
        </span>
    )
}

/**
 * The gift boxes hero, after the "Summertime" reference: the page's <h1>
 * set as a wordmark across the full width, a hairline caption row under it
 * (tagline ─── scroll cue), then a full-bleed photograph carrying a centred
 * pill, a short caption and the two paths in (shop a box / plan a bulk
 * order).
 *
 * hero     — content.hero (wordmark, tagline, scrollLabel, badge, caption, image)
 * products — the live gift boxes (photo fallback, "from" price, box count)
 * photos   — every box photo URL, for the automatic image
 */
const GiftWordmarkHero = ({ hero, products = [], photos = [] }) => {
    const rootRef = useRef(null)
    useReveal(rootRef, [products.length])

    const photo = pickImage(hero.image, photos)
    const lead = products.find((p) => p?.media?.some((m) => m?.secure_url))
    const alt = hero.image?.url ? photo?.alt : lead ? `${formatProductName(lead.name)} gift box` : ''

    const prices = products.map(priceOf).map(Number).filter((n) => Number.isFinite(n) && n > 0)
    const fromPrice = prices.length ? formatINR(Math.min(...prices)) : null
    const meta = [
        products.length > 0 && `${products.length} ${products.length === 1 ? 'box' : 'boxes'}`,
        fromPrice && `from ${fromPrice}`,
        'Free delivery',
    ].filter(Boolean).join(' · ')

    return (
        <section ref={rootRef} className="relative isolate bg-surface-page" aria-labelledby="gifting-title">
            {/* Top padding clears the fixed site header. */}
            <div className="ef-container pt-[5.75rem] sm:pt-[7rem]">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2" data-reveal>
                    <nav aria-label="Breadcrumb">
                        <ol className="flex flex-wrap items-center gap-1.5 text-[0.8125rem] text-ink-muted">
                            <li><Link href={WEBSITE_HOME} className="ef-focus rounded-sm transition-colors hover:text-brand">Home</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><Link href={WEBSITE_SHOP} className="ef-focus rounded-sm transition-colors hover:text-brand">Shop</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5 opacity-60" /></li>
                            <li><span aria-current="page" className="text-ink-strong">Gift Boxes</span></li>
                        </ol>
                    </nav>
                    <p className="text-[0.8125rem] tabular-nums text-ink-muted">{meta}</p>
                </div>

                <h1
                    id="gifting-title"
                    className="mt-[clamp(0.75rem,2.5vw,1.75rem)] font-header font-semibold uppercase leading-[0.84] text-ink-strong [overflow-wrap:anywhere]"
                >
                    <FitWordmark text={hero.wordmark} />
                </h1>

                <div className="flex items-center gap-3 pb-[clamp(1.25rem,3vw,2rem)] pt-[clamp(0.875rem,2vw,1.5rem)] sm:gap-5" data-reveal>
                    {hero.tagline && (
                        <p className="min-w-0 text-[0.8125rem] font-medium leading-snug text-ink-strong sm:text-[0.9375rem]">{hero.tagline}</p>
                    )}
                    <span aria-hidden="true" className="h-px min-w-6 flex-1 bg-line-strong" />
                    {products.length > 0 && hero.scrollLabel && (
                        <a
                            href={`#${COLLECTION_ANCHOR}`}
                            onClick={(e) => jumpTo(e, COLLECTION_ANCHOR)}
                            className="ef-focus inline-flex shrink-0 items-center gap-1.5 rounded-sm text-[0.8125rem] text-ink-muted transition-colors hover:text-brand"
                        >
                            <span className="max-sm:sr-only">{hero.scrollLabel}</span>
                            <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden="true" />
                        </a>
                    )}
                </div>
            </div>

            <div className="relative h-[clamp(24rem,66svh,46rem)] overflow-hidden bg-pine">
                {photo ? (
                    <Image
                        src={photo.src}
                        alt={alt || ''}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                        style={{ objectPosition: photo.position }}
                    />
                ) : (
                    <span aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--brand-panel-gradient), var(--palette-pine)' }} />
                )}
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-pine-deep/90 via-pine-deep/25 to-pine-deep/5" />

                <div className="ef-container ef-on-inverse absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[clamp(1.75rem,5vw,3.5rem)] text-center text-cream">
                    {hero.badge && (
                        <span className="inline-flex max-w-full items-center rounded-full border border-cream/70 px-4 py-1.5 text-[0.6875rem] font-semibold uppercase leading-tight sm:text-[0.75rem]">
                            {hero.badge}
                        </span>
                    )}
                    {hero.caption && (
                        <p className="max-w-[36rem] text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] leading-relaxed text-cream/90 [text-wrap:balance]">
                            {hero.caption}
                        </p>
                    )}
                    <div className="mt-1 grid w-full max-w-sm grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:max-w-none sm:justify-center">
                        {products.length > 0 && (
                            <a
                                href={`#${COLLECTION_ANCHOR}`}
                                onClick={(e) => jumpTo(e, COLLECTION_ANCHOR)}
                                className="ef-btn ef-btn--light max-sm:!px-3"
                            >
                                Shop boxes <ArrowDown aria-hidden="true" />
                            </a>
                        )}
                        <EnquireButton className={products.length > 0 ? 'ef-btn ef-btn--ghost-light max-sm:!px-3' : 'ef-btn ef-btn--light col-span-2'}>
                            Bulk order <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                        </EnquireButton>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftWordmarkHero
