'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { formatProductName } from '@/lib/seo'
import { COLLECTION_ANCHOR, EnquireButton, jumpTo } from './GiftingSelection'
import { pickImage } from './GiftingUi'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

// Wordmark size bounds (px). Below the floor the words wrap instead. The
// ceiling also tracks the viewport height (MAX_SVH of it), so on short,
// wide screens the wordmark leaves the photo room inside the 100svh hero.
const MIN_PX = 40
const MAX_PX = 288
const MAX_SVH = 0.24

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
        // The row the wordmark shares with the side card (when it shows): the
        // wordmark gets the row's width less the card's minimum and the gap,
        // and the card grows into whatever the wordmark leaves.
        const box = el?.closest('[data-fit-row]') || el?.parentElement
        if (!el || !box) return undefined

        const reserved = () => {
            const aside = box.querySelector('[data-fit-aside]')
            if (!aside) return 0
            const style = getComputedStyle(aside)
            if (style.display === 'none') return 0
            return (parseFloat(style.minWidth) || 0) + (parseFloat(getComputedStyle(box).columnGap) || 0)
        }

        let frame = 0
        const fit = () => {
            el.style.whiteSpace = 'nowrap'
            el.style.fontSize = '100px'
            const natural = el.getBoundingClientRect().width
            const available = box.clientWidth - reserved()
            if (!natural || available <= 0) return
            // A hair under exact, so rounding never tips it into a scrollbar.
            const size = ((100 * available) / natural) * 0.995
            if (size < MIN_PX) {
                el.style.whiteSpace = 'normal'
                el.style.fontSize = `${MIN_PX}px`
            } else {
                const ceiling = Math.max(MIN_PX, Math.min(MAX_PX, window.innerHeight * MAX_SVH))
                el.style.fontSize = `${Math.min(size, ceiling)}px`
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
        // Height changes (the ceiling) don't resize the column: listen too.
        const onResize = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(fit)
        }
        window.addEventListener('resize', onResize)
        // The display face may land after first paint and is wider than its
        // fallback: measure again once it has.
        document.fonts?.ready?.then(fit).catch(() => {})
        return () => {
            ro?.disconnect()
            window.removeEventListener('resize', onResize)
            cancelAnimationFrame(frame)
        }
    }, [text])

    return (
        <span
            ref={ref}
            className="inline-block whitespace-nowrap [--fit-reserve:0px] lg:[--fit-reserve:calc(15rem+clamp(1.5rem,2.5vw,2.5rem))]"
            style={{
                fontSize: `clamp(${MIN_PX}px, min(calc((min(100vw, var(--container-max)) - 2 * var(--website-gutter) - var(--fit-reserve)) / ${Math.max(text.length, 4) * 0.64}), ${MAX_SVH * 100}svh), ${MAX_PX}px)`,
            }}
        >
            {text}
        </span>
    )
}

// Desktop card beside the wordmark: how many boxes there are and the
// then the two facts a buyer
// checks first and the way into bulk ordering. It takes the width the
// wordmark leaves, so the row is always filled edge to edge.
const SideCard = ({ products }) => {
    return (
        <aside
            data-fit-aside
            aria-label="The collection at a glance"
            className="hidden min-w-[15rem] flex-1 self-stretch lg:flex lg:flex-col lg:justify-between lg:gap-2 lg:rounded-tile lg:bg-surface-card lg:p-4 lg:shadow-elev-1 lg:ring-1 lg:ring-inset lg:ring-line-soft xl:p-5"
        >
            <p className="flex flex-col">
                <span className="font-header text-[clamp(1.125rem,0.9rem+0.5vw,1.375rem)] font-semibold leading-tight text-ink-strong">
                    {products.length > 0 ? `${products.length} signature ${products.length === 1 ? 'box' : 'boxes'}` : 'Boxes built to order'}
                </span>
            </p>

            <div className="flex flex-col gap-3 border-t border-line-soft pt-3">
                <EnquireButton className="ef-focus group inline-flex items-center justify-between gap-3 rounded-[var(--radius-control)] bg-brand px-3.5 py-2.5 text-left text-[0.8125rem] font-semibold uppercase text-on-brand transition-colors hover:bg-brand-hover">
                    Plan a bulk order
                    <ArrowUpRight className="size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </EnquireButton>
            </div>
        </aside>
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


    return (
        <section ref={rootRef} className="relative isolate flex h-[100svh] min-h-[34rem] flex-col bg-surface-page" aria-labelledby="gifting-title">
            {/* Top padding clears the fixed site header. */}
            <div className="ef-container shrink-0 pt-[5.75rem] sm:pt-[7rem]">
                <div data-fit-row className="flex items-end gap-[clamp(1.5rem,2.5vw,2.5rem)]">
                    <h1
                        id="gifting-title"
                        className="min-w-0 shrink-0 font-header font-semibold uppercase leading-[0.84] text-ink-strong [overflow-wrap:anywhere] max-lg:w-full"
                    >
                        <FitWordmark text={hero.wordmark} />
                    </h1>
                    <SideCard products={products} />
                </div>

                <div className="flex items-center gap-3 pb-[clamp(0.875rem,2.5svh,2rem)] pt-[clamp(0.75rem,2svh,1.5rem)] sm:gap-5" data-reveal>
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

            {/* The photo takes whatever height is left, so the hero is exactly one screen. */}
            <div className="relative min-h-[15rem] flex-1 overflow-hidden bg-pine">
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

                <div className="ef-container ef-on-inverse absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[clamp(1.25rem,5svh,3.5rem)] text-center text-cream">
                    {hero.badge && (
                        <span className="inline-flex max-w-full items-center rounded-full border border-cream/70 px-4 py-1.5 text-[0.6875rem] font-semibold uppercase leading-tight sm:text-[0.75rem]">
                            {hero.badge}
                        </span>
                    )}
                    {hero.caption && (
                        <p className="max-w-[36rem] text-[clamp(0.9375rem,0.85rem+0.4vw,1.125rem)] leading-relaxed text-cream/90 [text-wrap:balance] lg:max-w-full lg:truncate [@media(max-height:640px)]:hidden">
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
