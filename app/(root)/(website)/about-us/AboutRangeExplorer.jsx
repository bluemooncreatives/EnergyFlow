'use client'

import { useId, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search, X } from 'lucide-react'
import CoverImage from '@/components/Application/Website/storefront/CoverImage'
import Section from '@/components/Application/Website/storefront/Section'
import { tintAt } from '@/components/Application/Website/storefront/format'
import { resolveCategoryArt } from '@/lib/categoryCover'
import { cn } from '@/lib/utils'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { ABOUT_TITLE, AboutMetaRow, AboutPager, PhotoTag } from './AboutUi'

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()

const productsLabel = (count) => `${count} ${count === 1 ? 'product' : 'products'}`

// The stage opens with a couple of categories already to its left.
const START = 2

// One easing for every moving part of the stage, so the track, the tiles
// growing and shrinking and the details all land together.
const MOVE = 'duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0'

// Stage geometry (desktop). --lead is how many small tiles sit left of the
// large card; the track slides so the picked category always lands there.
const STAGE_VARS =
    '[--s:clamp(8.5rem,10.5vw,12rem)] [--b:clamp(17rem,25vw,25rem)] [--h:clamp(22rem,32vw,30rem)] [--g:var(--grid-gap)] [--lead:1] xl:[--lead:2]'

// A category's photo, or its initial on a tint when it has none.
const Art = ({ category, index, sizes }) => {
    const art = resolveCategoryArt(category)
    return art.src ? (
        <CoverImage
            src={art.src}
            fallbackSrc={category.previewImage || undefined}
            alt=""
            fill
            sizes={sizes}
            className="-z-20 object-cover"
            style={{ objectPosition: art.position || 'center' }}
        />
    ) : (
        <span
            aria-hidden="true"
            className="absolute inset-0 -z-20 grid place-items-center font-header text-[5rem] font-semibold text-ink-strong/15"
            style={{ background: tintAt(index) }}
        >
            {category.name.charAt(0)}
        </span>
    )
}

// The large card's "Buy now" bar: shops the picked category.
const ShopBar = ({ category, className }) => (
    <Link href={category.href} className={cn('ef-cta ef-cta--accent shadow-elev-2', className)} aria-label={`Shop ${category.name}`}>
        Shop now
        <span className="ef-cta__box"><ArrowUpRight aria-hidden="true" /></span>
    </Link>
)

// What the details column says about the picked category.
const Details = ({ category, className }) => (
    <div className={cn('flex min-w-0 flex-col items-start', className)}>
        <h3 className="font-header text-[clamp(1.5rem,1.2rem+1vw,2.25rem)] font-medium leading-[1.05] text-ink-strong [overflow-wrap:anywhere] [text-wrap:balance]">
            {category.name}
        </h3>
        <p className="mt-2.5 max-w-[17rem] text-[0.875rem] leading-relaxed text-ink-body">
            {productsLabel(category.productCount || 0)} in this aisle, packed fresh in Delhi and delivered free across India.
        </p>
        <dl className="mt-4 flex items-center gap-5">
            <div>
                <dt className="sr-only">Products</dt>
                <dd className="flex items-baseline gap-1.5">
                    <span className="font-header text-[1.375rem] font-semibold leading-none tabular-nums text-ink-strong">{category.productCount || 0}</span>
                    <span className="text-[0.75rem] text-ink-muted">on the shelf</span>
                </dd>
            </div>
            {category.year && (
                <div className="border-l border-line-soft pl-5">
                    <dt className="sr-only">Stocked since</dt>
                    <dd className="flex items-baseline gap-1.5">
                        <span className="text-[0.75rem] text-ink-muted">since</span>
                        <span className="font-header text-[1.375rem] font-semibold leading-none tabular-nums text-ink-strong">{category.year}</span>
                    </dd>
                </div>
            )}
        </dl>
    </div>
)

/**
 * "Explore the pantry", after the skincare-shop reference, set straight on
 * the section: a filter row of category chips with the search, the
 * headline, then a stage. On desktop every category sits on one sliding track: the
 * picked one grows into the large card (count badge, "Shop now" bar), the
 * ones before it shrink to small tiles on the left over the "03 / 07"
 * pager, the ones after it line up on the right under its details. Arrows,
 * chips, the arrow keys, a swipe or a click on a small tile slide the track
 * and the tiles resize as they pass the centre.
 *
 * Phones get the large card, its details and the pager.
 *
 * Typing filters the categories as you go; Enter searches the whole shop
 * (the form is a plain GET to /shop, so it works without JavaScript too).
 */
const AboutRangeExplorer = ({ content, categories = [], number, tone = 'sunken' }) => {
    const inputId = useId()
    const touchRef = useRef(null)
    const [query, setQuery] = useState('')
    const [active, setActive] = useState(START)

    const q = normalize(query)
    const shown = q ? categories.filter((category) => normalize(category.name).includes(q)) : categories

    if (!categories.length) return null

    const count = shown.length
    const current = Math.max(0, Math.min(active, count - 1))
    const picked = shown[current]
    const step = (by) => setActive(Math.max(0, Math.min(current + by, count - 1)))

    // A new search lands on its first match; clearing it goes back to the opening view.
    const search = (value) => {
        setQuery(value)
        setActive(normalize(value) ? 0 : START)
    }

    const onKeyDown = (event) => {
        if (event.target instanceof HTMLInputElement) return
        if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
        if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
    }
    const onTouchStart = (event) => { touchRef.current = event.touches[0].clientX }
    const onTouchEnd = (event) => {
        if (touchRef.current == null) return
        const dx = event.changedTouches[0].clientX - touchRef.current
        touchRef.current = null
        if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1)
    }

    return (
        <Section tone={tone} aria-labelledby="range-title">
            <AboutMetaRow label={content.eyebrow} number={number} />

            <div
                onKeyDown={onKeyDown}
                data-reveal
            >
                {/* Filter row: category chips, then the search and "View all" */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-[0.75rem] font-semibold text-ink-strong max-sm:hidden">Filter</span>
                        <div
                            role="group"
                            aria-label="Categories"
                            className="no-scrollbar -mx-[var(--website-gutter)] flex min-w-0 gap-1.5 overflow-x-auto px-[var(--website-gutter)] sm:mx-0 sm:px-0"
                        >
                            {shown.map((category, i) => (
                                <button
                                    key={category.slug}
                                    type="button"
                                    onClick={() => setActive(i)}
                                    aria-pressed={i === current}
                                    className={cn(
                                        'ef-focus shrink-0 rounded-[var(--radius-control)] px-3 py-2 text-[0.75rem] font-medium leading-tight transition-colors duration-200 motion-reduce:transition-none',
                                        i === current
                                            ? 'bg-brand text-on-brand shadow-elev-1'
                                            : 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft hover:ring-line-strong'
                                    )}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex w-full shrink-0 items-center gap-2 lg:w-auto">
                        <form role="search" action={WEBSITE_SHOP} method="get" className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
                            <label htmlFor={inputId} className="sr-only">Search the range</label>
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                            <input
                                id={inputId}
                                name="q"
                                type="search"
                                value={query}
                                onChange={(e) => search(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); search('') } }}
                                placeholder={content.searchPlaceholder || 'Search the range…'}
                                maxLength={80}
                                autoComplete="off"
                                className="h-11 w-full rounded-[var(--radius-control)] border border-line-soft bg-surface-card pl-10 pr-10 text-[0.875rem] text-ink-strong transition-[border-color,box-shadow] placeholder:text-ink-muted focus:border-brand-bright focus:outline-none focus:ring-4 focus:ring-brand-bright/15 [&::-webkit-search-cancel-button]:hidden"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => search('')}
                                    className="ef-focus absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-[var(--radius-control)] text-ink-muted hover:text-ink-strong"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4" aria-hidden="true" />
                                </button>
                            )}
                        </form>
                        <Link href={WEBSITE_SHOP} className="ef-btn ef-btn--primary shrink-0 [--btn-h:2.75rem] max-sm:!px-4">
                            View all <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                {/* Headline beside the note */}
                <div className="mt-[clamp(1.5rem,3vw,2.5rem)] grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-10">
                    <h2 id="range-title" className={cn(ABOUT_TITLE, 'max-w-[16ch]')}>
                        {content.title}
                    </h2>
                    {content.note && <p className="ef-lead max-w-md lg:justify-self-end">{content.note}</p>}
                </div>

                <p role="status" className="sr-only">
                    {q ? `${count} ${count === 1 ? 'category matches' : 'categories match'} “${query.trim()}”` : ''}
                    {picked ? ` Showing ${picked.name}, ${current + 1} of ${count}.` : ''}
                </p>

                {picked ? (
                    <>
                        {/* Desktop: the sliding stage */}
                        <div
                            className={cn('relative mt-[clamp(1.5rem,3vw,2.5rem)] h-[var(--h)] overflow-hidden max-lg:hidden', STAGE_VARS)}
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                        >
                            <ul
                                className={cn('absolute inset-y-0 left-0 m-0 flex list-none items-end gap-[var(--g)] p-0 transition-transform', MOVE)}
                                style={{ transform: `translateX(calc((var(--lead) - ${current}) * (var(--s) + var(--g))))` }}
                                aria-label="Categories"
                            >
                                {shown.map((category, i) => {
                                    const isActive = i === current
                                    const before = i < current
                                    return (
                                        <li
                                            key={category.slug}
                                            className={cn('ef-tile relative shrink-0 bg-pine-deep transition-[width,height,margin,box-shadow]', MOVE, isActive ? 'shadow-elev-2' : 'shadow-elev-1')}
                                            style={{
                                                width: isActive ? 'var(--b)' : 'var(--s)',
                                                height: isActive ? 'var(--h)' : 'var(--s)',
                                                // Tiles to the left float level with the large card's middle,
                                                // leaving the pager room underneath.
                                                marginBottom: before ? 'calc((var(--h) - var(--s)) / 2)' : 0,
                                            }}
                                            aria-current={isActive ? 'true' : undefined}
                                        >
                                            <Art category={category} index={i} sizes="25rem" />
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'absolute inset-0 -z-10 bg-gradient-to-t to-transparent transition-opacity',
                                                    MOVE,
                                                    isActive ? 'from-pine-deep/45 via-transparent opacity-100' : 'from-pine-deep/85 via-pine-deep/10 opacity-100'
                                                )}
                                            />

                                            {isActive ? (
                                                <div key="active" className="absolute inset-0 animate-[fade-in_0.5s_ease-out_0.25s_both] motion-reduce:animate-none">
                                                    <PhotoTag className="absolute left-4 top-4 tabular-nums">{productsLabel(category.productCount || 0)}</PhotoTag>
                                                    <ShopBar category={category} className="absolute bottom-4 left-4" />
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setActive(i)}
                                                    className="ef-focus group absolute inset-0 flex items-end p-3 text-left"
                                                    aria-label={`Show ${category.name}`}
                                                >
                                                    <span className="font-header text-[0.8125rem] font-semibold leading-tight text-cream [overflow-wrap:anywhere] [text-wrap:balance]">
                                                        {category.name}
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-cream text-pine opacity-0 transition-[opacity,transform] duration-300 group-hover:rotate-45 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                                                    >
                                                        <ArrowUpRight className="size-3.5" />
                                                    </span>
                                                </button>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>

                            {/* Details, over the tiles to the right of the large card */}
                            <div
                                className="pointer-events-none absolute top-0 h-[calc(var(--h)-var(--s)-var(--g))] w-[calc(2*var(--s)+var(--g))] overflow-hidden"
                                style={{ left: 'calc(var(--lead) * (var(--s) + var(--g)) + var(--b) + var(--g))' }}
                            >
                                <div key={picked.slug} className="pointer-events-auto animate-[slide-up-fade_0.6s_cubic-bezier(0.22,1,0.36,1)_0.15s_both] motion-reduce:animate-none">
                                    <Details category={picked} />
                                </div>
                            </div>

                            {/* Pager, under the tiles to the left */}
                            <AboutPager current={current} count={count} onPrev={() => step(-1)} onNext={() => step(1)} prevDisabled={current === 0} nextDisabled={current === count - 1} noun="category" stacked className="absolute bottom-0 left-0" />
                        </div>

                        {/* Phones and tablets: the large card, its details and the pager */}
                        <div className="mt-6 lg:hidden">
                            <div
                                className="ef-tile relative aspect-[4/5] w-full bg-pine-deep shadow-elev-2 sm:aspect-[16/11]"
                                onTouchStart={onTouchStart}
                                onTouchEnd={onTouchEnd}
                            >
                                <div key={picked.slug} className="absolute inset-0 animate-[fade-in_0.45s_ease-out_both] motion-reduce:animate-none">
                                    <Art category={picked} index={current} sizes="100vw" />
                                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/45 via-transparent to-transparent" />
                                    <PhotoTag className="absolute left-4 top-4 tabular-nums">{productsLabel(picked.productCount || 0)}</PhotoTag>
                                    <ShopBar category={picked} className="absolute bottom-4 left-4" />
                                </div>
                            </div>
                            <div className="mt-5 flex items-end justify-between gap-4">
                                <div key={picked.slug} className="min-w-0 animate-[slide-up-fade_0.5s_ease-out_both] motion-reduce:animate-none">
                                    <Details category={picked} />
                                </div>
                                <AboutPager current={current} count={count} onPrev={() => step(-1)} onNext={() => step(1)} prevDisabled={current === 0} nextDisabled={current === count - 1} noun="category" stacked className="shrink-0 items-end" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mt-[clamp(1.25rem,2.5vw,2rem)] flex flex-col items-start gap-3 rounded-tile bg-surface-card p-6 ring-1 ring-inset ring-line-soft sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[0.9375rem] text-ink-body">
                            No category is called “<span className="font-semibold text-ink-strong">{query.trim()}</span>”, but a product might be.
                        </p>
                        <Link href={`${WEBSITE_SHOP}?q=${encodeURIComponent(query.trim())}`} className="ef-btn ef-btn--outline ef-btn--sm shrink-0">
                            Search all products <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </div>
        </Section>
    )
}

export default AboutRangeExplorer
