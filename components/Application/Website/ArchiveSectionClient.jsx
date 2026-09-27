'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import { tintAt } from './storefront/format'
import { ChocolateBox, GheeJar, OilBottle } from './storefront/ProductIllustrations'

// Columns per breakpoint — must match the grid classes below.
const COLS = { base: 2, sm: 3, lg: 5 }

// The closing "Shop everything" tile stretches across whatever is left of the
// last row, so the grid always ends flush: one category + the tile fills a row
// on a phone, and a young catalogue still reads as a complete band on desktop.
const remainder = (count, cols) => cols - (count % cols)

// Homepage category grid. Keeps the archive's props so callers are unchanged:
//   title, writeup — heading and the long-form range description
//   items          — [{ id, href, name, count, previewImage, alt }]
const ArchiveSectionClient = ({ title = 'Categories', writeup, items = [] }) => {
    const sectionRef = useRef(null)
    useReveal(sectionRef, [items.length])

    const n = items.length
    const spanVars = {
        '--span-base': remainder(n, COLS.base),
        '--span-sm': remainder(n, COLS.sm),
        '--span-lg': remainder(n, COLS.lg),
    }

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="categories-title">
            <SectionHeader
                id="categories-title"
                eyebrow={title}
                title="Shop by"
                accent="category"
                description="Everything in the Energyflow pantry, grouped the way you cook, snack and gift."
            />

            <ul className="grid list-none grid-cols-2 gap-[var(--grid-gap)] p-0 sm:grid-cols-3 lg:grid-cols-5" style={spanVars}>
                {items.map((item, i) => (
                    <li key={item.id} data-reveal className="min-w-0">
                        <Link
                            href={item.href}
                            className="ef-tile ef-focus group/cat flex h-full flex-col gap-3 p-2.5 transition-shadow duration-300 hover:shadow-elev-2 sm:p-3"
                            style={{ background: tintAt(i), borderRadius: 'var(--radius-card)' }}
                        >
                            <span className="relative block aspect-square overflow-hidden rounded-well bg-white/50">
                                {item.previewImage && (
                                    <Image
                                        src={item.previewImage}
                                        alt=""
                                        fill
                                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 260px"
                                        className="object-cover transition-transform duration-700 ease-out group-hover/cat:scale-105 motion-reduce:transition-none"
                                    />
                                )}
                            </span>
                            <span className="flex items-end justify-between gap-2 px-1 pb-1">
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span className="ef-clamp-2 text-[0.9375rem] font-medium leading-snug text-ink-strong sm:text-base">{item.name}</span>
                                    {item.count > 0 && (
                                        <span className="text-[12px] text-ink-body">
                                            {item.count} {item.count === 1 ? 'product' : 'products'}
                                        </span>
                                    )}
                                </span>
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-brand transition-colors duration-200 group-hover/cat:bg-brand group-hover/cat:text-white">
                                    <ArrowUpRight className="size-4" aria-hidden="true" />
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}

                <li
                    data-reveal
                    className="col-span-(--span-base) min-w-0 sm:col-span-(--span-sm) lg:col-span-(--span-lg)"
                >
                    <Link
                        href={WEBSITE_SHOP}
                        className="ef-tile ef-focus ef-on-inverse group/all @container/all relative flex h-full min-h-[12rem] flex-col justify-between gap-6 bg-brand p-5 text-white sm:p-6"
                        style={{ borderRadius: 'var(--radius-card)', backgroundImage: 'var(--brand-panel-gradient)' }}
                    >
                        <span className="flex flex-col gap-2">
                            <span className="text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                                Shop everything
                            </span>
                            <span className="hidden max-w-md text-[0.9375rem] leading-relaxed text-white/75 @[22rem]/all:block">
                                Dry fruits, seeds, ghee, cold pressed oils, chocolates and gift boxes. The whole pantry in one place.
                            </span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-[0.9375rem] font-medium">
                            <span className="flex size-10 items-center justify-center rounded-full bg-amber text-brand-deep transition-transform duration-300 group-hover/all:rotate-45 motion-reduce:transition-none">
                                <ArrowUpRight className="size-[1.1rem]" aria-hidden="true" />
                            </span>
                            View all products
                        </span>

                        {/* When the tile stretches across a sparse row, the spare
                            width shows the signature range instead of an empty block. */}
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute bottom-0 right-4 hidden w-[min(46%,26rem)] items-end gap-1 @[36rem]/all:flex"
                        >
                            <GheeJar className="w-1/3 transition-transform duration-500 group-hover/all:-translate-y-1.5 motion-reduce:transition-none" />
                            <OilBottle className="w-1/3 transition-transform delay-75 duration-500 group-hover/all:-translate-y-1.5 motion-reduce:transition-none" />
                            <ChocolateBox className="w-1/3 transition-transform delay-150 duration-500 group-hover/all:-translate-y-1.5 motion-reduce:transition-none" />
                        </span>
                    </Link>
                </li>
            </ul>

            {/* The long-form range description stays on the page for search and
                for shoppers who want it, set small so the tiles lead. */}
            {writeup && (
                <p data-reveal className="mt-[var(--section-gap)] max-w-4xl text-[0.875rem] leading-relaxed text-ink-muted">
                    {writeup}
                </p>
            )}
        </Section>
    )
}

export default ArchiveSectionClient
