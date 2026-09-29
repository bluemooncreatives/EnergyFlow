'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ChevronDown, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import { prefersReducedMotion, unitPriceLabel } from './productUtils'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Descriptions taller than this collapse behind "Read more".
const COLLAPSED_PX = 460

/**
 * "The details": a sticky spec sheet beside the full description. The spec
 * sheet is built only from real catalogue data (pack sizes, unit price,
 * category, SKU) — nothing is invented per product. A giant outlined product
 * name drifts across the section as it scrolls.
 *
 * Long descriptions collapse (the text stays in the DOM for search engines);
 * an empty description gets an honest fallback instead of a blank card.
 */
const ProductStory = ({ product, variant, variants, html }) => {
    const sectionRef = useRef(null)
    const bodyRef = useRef(null)
    const [overflowing, setOverflowing] = useState(false)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        const body = bodyRef.current
        if (!body) return
        const measure = () => setOverflowing(body.scrollHeight > COLLAPSED_PX + 80)
        measure()
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
        ro?.observe(body)
        return () => ro?.disconnect()
    }, [html])

    useGSAP(() => {
        if (prefersReducedMotion()) return
        const band = sectionRef.current?.querySelector('[data-outline]')
        if (!band) return
        gsap.fromTo(band, { xPercent: 4 }, {
            xPercent: -38,
            ease: 'none',
            scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
        })
    }, { scope: sectionRef })

    const sizes = variants.map((v) => v.size).filter(Boolean)
    const unit = unitPriceLabel(variant?.sellingPrice, variant?.size)
    const specs = [
        sizes.length > 0 && { label: sizes.length > 1 ? 'Pack sizes' : 'Pack size', value: sizes.join(' · ') },
        unit && { label: 'Unit price', value: unit },
        product.category?.name && {
            label: 'Category',
            value: product.category.slug
                ? <Link href={WEBSITE_CATEGORY(product.category.slug)} className="ef-link text-[0.9375rem]">{product.category.name}</Link>
                : product.category.name,
        },
        (variant?.sku || product.parentSku) && { label: 'SKU', value: <span className="font-mono text-[0.8125rem]">{variant?.sku || product.parentSku}</span> },
        { label: 'Ships from', value: 'India · delivered nationwide' },
    ].filter(Boolean)

    const collapsed = overflowing && !expanded

    return (
        <section ref={sectionRef} id="details" aria-labelledby="details-title" className="relative scroll-mt-28 overflow-hidden py-[var(--section-space)]">
            <div aria-hidden="true" className="pointer-events-none mb-[calc(var(--section-gap)*0.6)] overflow-hidden">
                <div data-outline className="ef-pd-outline w-max">
                    {product.name} <span className="text-[0.5em] align-middle">✺</span> {product.name}
                </div>
            </div>

            <div className="ef-container grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 xl:gap-24">
                <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
                    <div data-reveal className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">The details</span>
                        <h2 id="details-title" className="ef-title ef-title--md">
                            What’s in <span className="ef-title__accent">the pack</span>
                        </h2>
                    </div>

                    <dl data-reveal className="mt-8 border-t border-line-rule">
                        {specs.map(({ label, value }) => (
                            <div key={label} className="flex items-baseline justify-between gap-6 border-b border-line-soft py-3.5">
                                <dt className="shrink-0 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</dt>
                                <dd className="min-w-0 text-right text-[0.9375rem] font-medium text-ink-strong">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <div data-reveal className="min-w-0">
                    {html ? (
                        <>
                            <div
                                id="product-description"
                                className={cn('relative overflow-hidden transition-[max-height] duration-700 ease-[var(--ease-spring)]')}
                                style={{ maxHeight: collapsed ? `${COLLAPSED_PX}px` : 'none' }}
                            >
                                <div ref={bodyRef} className="ef-pd-prose" dangerouslySetInnerHTML={{ __html: html }} />
                                {collapsed && (
                                    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[var(--surface-page)]" />
                                )}
                            </div>
                            {overflowing && (
                                <button
                                    type="button"
                                    onClick={() => setExpanded((v) => !v)}
                                    aria-expanded={expanded}
                                    aria-controls="product-description"
                                    className="ef-cta mt-6"
                                >
                                    {expanded ? 'Show less' : 'Read more'}
                                    <span className="ef-cta__box">
                                        <ChevronDown className={cn('transition-transform duration-300', expanded && 'rotate-180')} aria-hidden="true" />
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-start gap-4 rounded-[var(--radius-tile)] bg-surface-sunken p-8">
                            <span className="ef-seal ef-seal--forest size-14" aria-hidden="true"><Leaf /></span>
                            <p className="ef-lead">
                                We’re still writing the full story of {product.name}. Every lot is quality checked before it’s packed —
                                questions about this product? Our team is happy to help.
                            </p>
                            <Link href="/contact" className="ef-link">Ask about this product</Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default ProductStory
