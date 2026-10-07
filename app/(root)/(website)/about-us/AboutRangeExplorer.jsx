'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search, X } from 'lucide-react'
import CoverImage from '@/components/Application/Website/storefront/CoverImage'
import RailControls from '@/components/Application/Website/storefront/RailControls'
import Section from '@/components/Application/Website/storefront/Section'
import { tintAt } from '@/components/Application/Website/storefront/format'
import { useScrollRail } from '@/hooks/useScrollRail'
import { resolveCategoryArt } from '@/lib/categoryCover'
import { cn } from '@/lib/utils'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { AboutMetaRow } from './AboutUi'

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()

const RangeCard = ({ category, index }) => {
    const art = resolveCategoryArt(category)
    const count = category.productCount || 0
    return (
        <Link
            href={category.href}
            className="ef-tile ef-focus group relative block aspect-[3/4] shadow-elev-1"
            style={{ background: tintAt(index) }}
            aria-label={`Shop ${category.name}, ${count} ${count === 1 ? 'product' : 'products'}`}
        >
            {art.src ? (
                <CoverImage
                    src={art.src}
                    fallbackSrc={category.previewImage || undefined}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 64vw, 17.5rem"
                    className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                    style={{ objectPosition: art.position || 'center' }}
                />
            ) : (
                <span aria-hidden="true" className="absolute inset-0 -z-20 grid place-items-center font-header text-[5rem] font-semibold text-ink-strong/15">
                    {category.name.charAt(0)}
                </span>
            )}
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/80 via-pine-deep/10 to-transparent" />

            <span className="absolute right-3 top-3 inline-flex h-7 items-center rounded-full bg-pine-deep/25 px-3 text-[0.6875rem] font-semibold text-cream ring-1 ring-inset ring-cream/55 backdrop-blur">
                {count} {count === 1 ? 'product' : 'products'}
            </span>

            {/* Caption; on hover it hands over to a frosted card. */}
            <span className="absolute inset-x-3.5 bottom-3.5 text-[0.9375rem] font-semibold leading-snug text-cream transition-opacity duration-300 [text-wrap:balance] group-hover:opacity-0 group-focus-visible:opacity-0">
                {category.name}
            </span>
            <span
                aria-hidden="true"
                className="absolute inset-x-2 bottom-2 flex translate-y-3 items-end justify-between gap-3 rounded-card bg-surface-card/85 p-3 opacity-0 shadow-elev-2 backdrop-blur-md transition-[opacity,transform] duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
            >
                <span className="min-w-0">
                    <span className="block text-[0.6875rem] font-semibold uppercase text-ink-muted">Shop</span>
                    <span className="block text-[0.9375rem] font-semibold leading-snug text-ink-strong">{category.name}</span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                    <ArrowUpRight className="size-4" />
                </span>
            </span>
        </Link>
    )
}

/**
 * "Explore the pantry", after the sports-centre reference's facilities
 * panel: one rounded card holding a count pill and the headline, a search
 * field and "View all", then a row of category photos — each tagged with
 * its product count and captioned, a frosted card sliding up on hover.
 * Arrows and a note sit under the row.
 *
 * Typing filters the row as you go; Enter searches the whole shop (the
 * form is a plain GET to /shop, so it works without JavaScript too).
 */
const AboutRangeExplorer = ({ content, categories = [], number }) => {
    const rail = useScrollRail()
    const inputId = useId()
    const [query, setQuery] = useState('')

    const q = normalize(query)
    const shown = q ? categories.filter((category) => normalize(category.name).includes(q)) : categories

    // A new filter starts the row from its first card.
    const { railRef } = rail
    useEffect(() => {
        railRef.current?.scrollTo({ left: 0 })
    }, [q, railRef])

    if (!categories.length) return null

    return (
        <Section tone="sunken" aria-labelledby="range-title">
            <AboutMetaRow label={content.eyebrow} number={number} />

            <div className="rounded-[clamp(1.25rem,2.4vw,2rem)] bg-surface-card p-[clamp(1rem,2.6vw,2rem)] shadow-elev-2 ring-1 ring-inset ring-line-soft" data-reveal>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <span className="inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[0.75rem] font-semibold text-ink-strong ring-1 ring-inset ring-line-strong">
                            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                        </span>
                        <h2 id="range-title" className="m-0 font-header text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-medium leading-tight text-ink-strong">
                            {content.title}
                        </h2>
                    </div>

                    <div className="flex w-full items-center gap-2 lg:w-auto">
                        <form role="search" action={WEBSITE_SHOP} method="get" className="relative min-w-0 flex-1 lg:w-80 lg:flex-none">
                            <label htmlFor={inputId} className="sr-only">Search the range</label>
                            <input
                                id={inputId}
                                name="q"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); setQuery('') } }}
                                placeholder={content.searchPlaceholder || 'Search the range…'}
                                maxLength={80}
                                autoComplete="off"
                                className="h-11 w-full rounded-full border border-line-soft bg-surface-sunken pl-4 pr-20 text-[0.875rem] text-ink-strong transition-[border-color,box-shadow] placeholder:text-ink-muted focus:border-brand-bright focus:outline-none focus:ring-4 focus:ring-brand-bright/15 [&::-webkit-search-cancel-button]:hidden"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    className="ef-focus absolute right-11 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:text-ink-strong"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="ef-focus absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand"
                                aria-label="Search the shop"
                            >
                                <Search className="size-4" aria-hidden="true" />
                            </button>
                        </form>
                        <Link href={WEBSITE_SHOP} className="ef-btn ef-btn--primary shrink-0 rounded-full [--btn-h:2.75rem] max-sm:!px-4">
                            View all <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                <p role="status" className="sr-only">
                    {q ? `${shown.length} ${shown.length === 1 ? 'category matches' : 'categories match'} “${query.trim()}”` : ''}
                </p>

                {/* The rail stays mounted (the scroll hook is bound to it) and
                    simply hides while a search matches nothing. */}
                <ul
                    ref={rail.railRef}
                    className={cn('ef-rail mt-[clamp(1.25rem,2.5vw,2rem)] list-none p-0', !shown.length && 'hidden')}
                    style={{ '--rail-item': 'clamp(13rem, 62vw, 17.5rem)' }}
                    aria-label="Categories"
                >
                    {shown.map((category, i) => (
                        <li key={category.slug} className="min-w-0">
                            <RangeCard category={category} index={i} />
                        </li>
                    ))}
                </ul>
                {!shown.length && (
                    <div className="mt-[clamp(1.25rem,2.5vw,2rem)] flex flex-col items-start gap-3 rounded-tile bg-surface-sunken p-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[0.9375rem] text-ink-body">
                            No category is called “<span className="font-semibold text-ink-strong">{query.trim()}</span>”, but a product might be.
                        </p>
                        <Link href={`${WEBSITE_SHOP}?q=${encodeURIComponent(query.trim())}`} className="ef-btn ef-btn--outline ef-btn--sm shrink-0">
                            Search all products <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <RailControls rail={rail} label="categories" />
                    {content.note && <p className="max-w-lg text-[0.8125rem] leading-relaxed text-ink-muted sm:ml-auto sm:text-right">{content.note}</p>}
                </div>
            </div>
        </Section>
    )
}

export default AboutRangeExplorer
