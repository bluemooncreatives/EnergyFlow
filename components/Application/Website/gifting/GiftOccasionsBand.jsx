'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, Ellipsis, Handshake, Heart, Mic2, Sparkles, Truck, Users } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { cn } from '@/lib/utils'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import { formatINR } from '../storefront/format'
import { useGiftingSelection } from './GiftingSelection'
import { SectionTag, photoOf, pickImage, priceOf } from './GiftingUi'

const ICONS = { diwali: Sparkles, employees: BriefcaseBusiness, clients: Handshake, events: Mic2, wedding: Heart, other: Ellipsis }

// Photo-less tiles take a fixed palette fill, cycled so neighbours differ.
const FILLS = ['bg-forest text-cream', 'bg-sun text-sun-ink', 'bg-olive text-cream', 'bg-pine text-cream']

// Two interlocking rings beside the headline: the gift and the giver.
const RingsMark = ({ className }) => (
    <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
        <circle cx="17" cy="16" r="12" />
        <circle cx="31" cy="16" r="12" />
    </svg>
)

const Stat = ({ label, value, unit }) => (
    <div className="min-w-0">
        <p className="text-[0.625rem] font-semibold uppercase leading-tight text-ink-muted">{label}</p>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-header text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] font-semibold leading-none tabular-nums text-ink-strong">{value}</span>
            {unit && <span className="text-[0.625rem] font-semibold uppercase text-ink-muted">{unit}</span>}
        </p>
    </div>
)

// What the occasion's boxes can carry: "Logo sleeves", "Message cards".
const AddOns = ({ tags, className }) => tags.length > 0 && (
    <ul className={cn('flex list-none flex-wrap gap-1.5 p-0', className)} aria-label="You can add">
        {tags.map((tag) => (
            <li
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-surface-card px-2.5 py-1.5 text-[0.75rem] font-medium leading-none text-ink-strong ring-1 ring-inset ring-line-soft"
            >
                <Check className="size-3 text-brand" strokeWidth={2.5} aria-hidden="true" />
                {tag}
            </li>
        ))}
    </ul>
)

// The gift box an occasion features: its own pick when it is still in the
// catalogue, else the boxes take turns so neighbouring occasions differ.
const boxFor = (entry, index, products) =>
    products.find((product) => entry.product && product.slug === entry.product) || products[index % products.length] || null

// Everything the photo card says about a box, read once per box.
const detailsOf = (product) => {
    if (!product) return null
    const price = Number(priceOf(product))
    return {
        id: product._id,
        name: formatProductName(product.name),
        nickname: product.nickname,
        href: WEBSITE_PRODUCT_DETAILS(product),
        photo: photoOf(product),
        price: price > 0 ? formatINR(price) : null,
        highlights: (product.highlights || []).slice(0, 3),
    }
}

const BoxCard = ({ box }) => (
    <div className="absolute inset-x-3 bottom-3 rounded-card bg-surface-card p-4 shadow-elev-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(24rem,calc(100%-2.5rem))] sm:p-5">
        <div className="flex items-start gap-3">
            {box.photo && (
                <span className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-well ring-1 ring-inset ring-line-soft sm:size-14">
                    <Image src={box.photo} alt="" fill sizes="56px" className="object-cover" />
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="truncate text-[0.625rem] font-semibold uppercase leading-tight text-ink-muted">
                    Featured box{box.nickname && <> · <span className="text-brand">{box.nickname}</span></>}
                </p>
                <p className="mt-1 font-header text-[1.0625rem] font-semibold uppercase leading-tight text-ink-strong [overflow-wrap:anywhere] sm:text-[1.1875rem]">
                    {box.name}
                </p>
            </div>
            <Link
                href={box.href}
                className="ef-focus grid size-9 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-transform duration-300 hover:rotate-45 motion-reduce:transition-none"
                aria-label={`View ${box.name}`}
            >
                <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
        </div>

        {box.highlights.length > 0 && (
            <ul className="mt-3.5 list-none space-y-2 border-t border-line-soft p-0 pt-3.5 max-sm:hidden" aria-label={`Why ${box.name} works`}>
                {box.highlights.map((highlight) => (
                    <li key={highlight.title} className="flex items-start gap-2 text-[0.8125rem] leading-snug">
                        <span aria-hidden="true" className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
                            <Check className="size-2.5" strokeWidth={3} />
                        </span>
                        <span className="min-w-0 ef-clamp-2">
                            <span className="font-semibold text-ink-strong">{highlight.title}</span>
                            {highlight.detail && <span className="text-ink-muted"> {highlight.detail}</span>}
                        </span>
                    </li>
                ))}
            </ul>
        )}
    </div>
)

/**
 * "Choose the occasion" as a featured spread: the headline and a row of
 * occasion chips on the left, the section's photo on the right with the
 * occasion's featured gift box on a card over it (photo, name, highlights,
 * link to the box), and below the chips the next occasion's box
 * beside the picked occasion's details. Planning it opens the enquiry form
 * with that occasion and that box already chosen.
 */
const GiftOccasionsBand = ({ content, photos = [], products = [], number }) => {
    const rootRef = useRef(null)
    const [active, setActive] = useState(0)
    const { enquireAbout } = useGiftingSelection()
    useReveal(rootRef, [content.items.length])

    const items = content.items.filter((item) => item.title)
    if (!items.length) return null

    const current = Math.min(active, items.length - 1)
    const next = (current + 1) % items.length
    const item = items[current]
    const upNext = items[next]
    const Icon = ICONS[item.occasion] || Ellipsis
    const NextIcon = ICONS[upNext.occasion] || Ellipsis
    const includes = (item.includes || []).filter(Boolean)
    const box = detailsOf(boxFor(item, current, products))
    const nextBox = detailsOf(boxFor(upNext, next, products))

    // The large photo: the occasion's own, else the section's, else a box
    // photo. Occasions sharing a photo share one <Image>, so a switch only
    // cross-fades when the picture really changes.
    const arts = items.map((entry, i) => pickImage(entry.image?.url ? entry.image : content.image, photos, i + 1))
    const art = arts[current]
    const frames = [...new Map(arts.filter(Boolean).map((entry) => [entry.src, entry])).values()]
    // The small card previews the next occasion: its own photo, else its box's.
    const nextPhoto = upNext.thumb?.url || nextBox?.photo || arts[next]?.src || null

    return (
        <section ref={rootRef} className="ef-section ef-section--sunken overflow-hidden" aria-labelledby="occasions-title">
            <div className="ef-container relative">
                <div className="mb-[var(--section-gap)] flex items-center justify-between gap-4 border-t border-line-strong pt-5 sm:pt-6">
                    <SectionTag number={number} eyebrow={content.eyebrow} />
                    <span className="flex shrink-0 items-center gap-2 text-[0.8125rem] font-medium text-ink-muted max-sm:hidden">
                        <Truck className="size-4 text-brand" strokeWidth={1.75} aria-hidden="true" />
                        Delivered across India
                    </span>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-12">
                    {/* Headline and the occasion chips */}
                    <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1" data-reveal>
                        <div className="flex items-start gap-5">
                            <h2 id="occasions-title" className="ef-title min-w-0">
                                {content.title}
                                {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                            </h2>
                            <RingsMark className="mt-[0.4em] hidden h-8 w-12 shrink-0 text-brand sm:block" />
                        </div>
                        <div role="group" aria-label="Occasions" className="flex flex-wrap gap-2">
                            {items.map((entry, i) => (
                                <button
                                    key={`${entry.occasion}-${i}`}
                                    type="button"
                                    onClick={() => setActive(i)}
                                    aria-pressed={i === current}
                                    className={cn(
                                        'ef-focus rounded-[var(--radius-control)] px-3.5 py-2 text-[0.8125rem] font-medium leading-tight transition-colors duration-200 motion-reduce:transition-none',
                                        i === current
                                            ? 'bg-brand text-on-brand shadow-elev-1'
                                            : 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft hover:ring-line-strong'
                                    )}
                                >
                                    {entry.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* The large photo with the featured box card on top */}
                    <div
                        className={cn(
                            'ef-tile relative aspect-[4/5] w-full shadow-elev-2 sm:aspect-[16/11] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:aspect-auto lg:min-h-[36rem]',
                            art ? 'bg-surface-well' : FILLS[current % FILLS.length]
                        )}
                        data-reveal
                    >
                        {frames.map((frame) => (
                            <Image
                                key={frame.src}
                                src={frame.src}
                                alt={frame.src === art?.src ? frame.alt : ''}
                                fill
                                sizes="(max-width: 1024px) 100vw, 40vw"
                                className={cn(
                                    '-z-10 object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
                                    frame.src === art?.src ? 'opacity-100' : 'opacity-0'
                                )}
                                style={{ objectPosition: frame.position }}
                            />
                        ))}
                        {!art && (
                            <Icon className="absolute bottom-10 left-1/2 size-20 -translate-x-1/2 opacity-70" strokeWidth={1} aria-hidden="true" />
                        )}

                        {box ? (
                            <BoxCard box={box} />
                        ) : (
                            <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-4 rounded-card bg-surface-card p-4 shadow-elev-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[min(23rem,calc(100%-2.5rem))] sm:p-5">
                                <Stat label="Bulk orders from" value={MIN_GIFT_QUANTITY} unit="boxes" />
                                <Stat label="Delivery across" value="India" />
                            </div>
                        )}
                    </div>

                    {/* The next occasion's box beside the picked occasion's details */}
                    <div
                        className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-center sm:gap-8 lg:col-start-1 lg:row-start-2 lg:self-end"
                        data-reveal
                    >
                        <button
                            type="button"
                            onClick={() => setActive(next)}
                            disabled={items.length < 2}
                            className={cn(
                                'ef-tile ef-focus group flex aspect-[4/5] w-full flex-col justify-end p-3 text-left shadow-elev-2 sm:p-4',
                                nextPhoto ? 'bg-pine-deep text-cream' : FILLS[next % FILLS.length]
                            )}
                            aria-label={`Next occasion: ${upNext.title}`}
                        >
                            {nextPhoto ? (
                                <>
                                    <Image
                                        key={nextPhoto}
                                        src={nextPhoto}
                                        alt=""
                                        fill
                                        sizes="(max-width: 640px) 8rem, 13rem"
                                        className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                    />
                                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/90 via-pine-deep/20 to-transparent" />
                                </>
                            ) : (
                                <NextIcon className="absolute left-3 top-3 size-6 opacity-80 sm:left-4 sm:top-4" strokeWidth={1.5} aria-hidden="true" />
                            )}
                            {items.length > 1 && (
                                <span
                                    aria-hidden="true"
                                    className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-cream text-pine transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none sm:right-3 sm:top-3 sm:size-9"
                                >
                                    <ArrowUpRight className="size-4" />
                                </span>
                            )}
                            <span className="block text-[0.625rem] font-semibold uppercase leading-tight opacity-75 sm:text-[0.6875rem]">
                                {items.length > 1 ? 'Up next' : 'Occasion'}
                            </span>
                            <span className="mt-0.5 block text-[0.75rem] font-semibold uppercase leading-tight [overflow-wrap:anywhere] sm:text-[0.8125rem]">
                                {upNext.title}
                            </span>
                            {nextBox && (
                                <span className="mt-1 block truncate text-[0.6875rem] leading-tight opacity-80 max-sm:hidden">
                                    {nextBox.name}{nextBox.price && ` · ${nextBox.price}`}
                                </span>
                            )}
                        </button>

                        <div className="flex min-w-0 flex-col items-start" aria-live="polite">
                            <h3 className="font-header text-[clamp(1.375rem,1.1rem+1vw,2.125rem)] font-semibold uppercase leading-[0.95] text-ink-strong [overflow-wrap:anywhere]">
                                {item.title}
                            </h3>
                            {item.audience && (
                                <p className="mt-2.5 flex items-center gap-2 text-[0.8125rem] font-medium text-ink-muted sm:text-[0.875rem]">
                                    <Users className="size-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden="true" />
                                    {item.audience}
                                </p>
                            )}
                            {item.note && (
                                <p className="mt-4 max-w-[22rem] text-[0.9375rem] font-medium leading-snug text-ink-body max-sm:hidden">
                                    “{item.note}”
                                </p>
                            )}
                            <AddOns tags={includes} className="mt-4 max-sm:hidden" />
                            <button
                                type="button"
                                onClick={() => enquireAbout(box?.id, { occasion: item.occasion })}
                                className="ef-cta ef-cta--accent mt-5 sm:mt-6"
                            >
                                {box ? 'Plan with this box' : 'Plan this box'}
                                <span className="ef-cta__box"><ArrowRight aria-hidden="true" /></span>
                            </button>
                            {content.label && <p className="mt-3 max-w-[20rem] text-[0.8125rem] leading-snug text-ink-muted max-sm:hidden">{content.label}</p>}
                        </div>

                        {/* Phones: the quote, tags and note run full width under the pair */}
                        {(item.note || includes.length > 0 || content.label) && (
                            <div className="col-span-full space-y-3 sm:hidden">
                                {item.note && <p className="text-[0.9375rem] font-medium leading-snug text-ink-body">“{item.note}”</p>}
                                <AddOns tags={includes} />
                                {content.label && <p className="text-[0.8125rem] leading-snug text-ink-muted">{content.label}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftOccasionsBand
