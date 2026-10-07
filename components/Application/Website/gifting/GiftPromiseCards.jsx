'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { cn } from '@/lib/utils'
import RailControls from '../storefront/RailControls'
import { EnquireButton } from './GiftingSelection'
import { GiftSectionHead, pad, pickImage } from './GiftingUi'

const CARD_HEIGHT = 'h-[clamp(21rem,30vw,25rem)]'

const Tags = ({ tags, tone }) =>
    tags?.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Includes">
            {tags.map((tag) => (
                <li
                    key={tag}
                    className={cn(
                        'inline-flex h-7 items-center rounded-full px-3 text-[0.75rem] font-medium',
                        tone === 'photo' ? 'bg-cream/15 text-cream ring-1 ring-inset ring-cream/35 backdrop-blur' : 'bg-surface-sunken text-ink-strong ring-1 ring-inset ring-line-soft',
                        tone === 'sun' && 'bg-white/45 text-pine ring-pine/20'
                    )}
                >
                    {tag}
                </li>
            ))}
        </ul>
    ) : null

// The ↗ that starts a brief from a card.
const Go = ({ title, className }) => (
    <EnquireButton
        className={cn('ef-focus grid size-11 shrink-0 place-items-center rounded-full transition-transform duration-300 hover:rotate-45 motion-reduce:transition-none', className)}
        aria-label={`Start a brief: ${title}`}
    >
        <ArrowUpRight className="size-[1.125rem]" aria-hidden="true" />
    </EnquireButton>
)

// Lead card: a wide photo with its tags on top and the promise below.
const FeatureCard = ({ item, art }) => (
    <article className={cn('ef-tile relative flex flex-col justify-between bg-pine p-4 text-cream shadow-elev-2 sm:p-5', CARD_HEIGHT)}>
        {art && <Image src={art.src} alt="" fill sizes="(max-width: 640px) 88vw, 34rem" className="-z-20 object-cover" style={{ objectPosition: art.position }} />}
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/90 via-pine-deep/30 to-pine-deep/10" />
        <Tags tags={item.tags} tone="photo" />
        <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
                <h3 className="font-header text-[clamp(1.875rem,1.4rem+1.6vw,2.75rem)] font-semibold uppercase leading-[0.95] [overflow-wrap:anywhere]">{item.title}</h3>
                {item.copy && <p className="mt-2.5 max-w-sm text-[0.875rem] leading-relaxed text-cream/85">{item.copy}</p>}
            </div>
            <Go title={item.title} className="bg-cream text-pine" />
        </div>
    </article>
)

// White card: number disc, a small photo, the promise and its tags.
const PlainCard = ({ item, art, index }) => (
    <article className={cn('ef-card flex flex-col justify-between gap-5 p-4 shadow-elev-1 sm:p-5', CARD_HEIGHT)}>
        <div className="flex items-start justify-between gap-3">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-full ring-1 ring-inset ring-line-strong text-[0.75rem] font-semibold tabular-nums text-ink-strong">{pad(index + 1)}</span>
            {art && (
                <span className="relative size-20 shrink-0 overflow-hidden rounded-card bg-surface-well sm:size-24">
                    <Image src={art.src} alt="" fill sizes="96px" className="object-cover" style={{ objectPosition: art.position }} />
                </span>
            )}
        </div>
        <div className="flex flex-col gap-3">
            <h3 className="font-header text-[clamp(1.375rem,1.15rem+0.7vw,1.75rem)] font-semibold uppercase leading-none text-ink-strong [overflow-wrap:anywhere]">{item.title}</h3>
            {item.copy && <p className="text-[0.875rem] leading-relaxed text-ink-body">{item.copy}</p>}
            <div className="flex items-end justify-between gap-3">
                <Tags tags={item.tags} />
                <Go title={item.title} className="ml-auto bg-brand text-on-brand" />
            </div>
        </div>
    </article>
)

// Photo card: the promise set over its photo.
const PhotoCard = ({ item, art }) => (
    <article className={cn('ef-tile relative flex flex-col justify-between bg-forest p-4 text-cream shadow-elev-2 sm:p-5', CARD_HEIGHT)}>
        {art && <Image src={art.src} alt="" fill sizes="(max-width: 640px) 78vw, 19rem" className="-z-20 object-cover" style={{ objectPosition: art.position }} />}
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/90 via-pine-deep/35 to-transparent" />
        <Tags tags={item.tags} tone="photo" />
        <div className="flex flex-col gap-3">
            <h3 className="font-header text-[clamp(1.375rem,1.15rem+0.7vw,1.75rem)] font-semibold uppercase leading-none [overflow-wrap:anywhere]">{item.title}</h3>
            {item.copy && <p className="text-[0.875rem] leading-relaxed text-cream/85">{item.copy}</p>}
            <Go title={item.title} className="self-end bg-cream text-pine" />
        </div>
    </article>
)

// Sunflower card: no photo, the warm note in the row.
const SunCard = ({ item, index }) => (
    <article className={cn('ef-tile relative flex flex-col justify-between bg-sun p-4 text-pine shadow-elev-1 sm:p-5', CARD_HEIGHT)}>
        <span aria-hidden="true" className="font-header text-[clamp(3.5rem,3rem+2vw,5rem)] font-semibold leading-none text-pine/15">{pad(index + 1)}</span>
        <div className="flex flex-col gap-3">
            <h3 className="font-header text-[clamp(1.375rem,1.15rem+0.7vw,1.75rem)] font-semibold uppercase leading-none [overflow-wrap:anywhere]">{item.title}</h3>
            {item.copy && <p className="text-[0.875rem] leading-relaxed text-pine/85">{item.copy}</p>}
            <div className="flex items-end justify-between gap-3">
                <Tags tags={item.tags} tone="sun" />
                <Go title={item.title} className="ml-auto bg-pine text-cream" />
            </div>
        </div>
    </article>
)

const KINDS = ['plain', 'photo', 'sun']

/**
 * "For teams & brands", after the reference's programme cards: the numbered
 * section heading, then a row of mixed cards — a wide photo lead, then
 * white, photo and sunflower cards in turn — each starting a brief. Arrows
 * and a short note sit under the row.
 */
const GiftPromiseCards = ({ content, photos = [], number }) => {
    const rootRef = useRef(null)
    const rail = useScrollRail()
    useReveal(rootRef, [content.items.length])

    const items = content.items.filter((item) => item.title)
    if (!items.length) return null

    return (
        <section ref={rootRef} className="ef-section ef-section--page" aria-labelledby="promise-title">
            <div className="ef-container">
                <GiftSectionHead number={number} eyebrow={content.eyebrow} title={content.title} accent={content.titleAccent} id="promise-title" />

                <ul
                    ref={rail.railRef}
                    className="no-scrollbar -my-2 flex list-none snap-x snap-mandatory gap-[var(--grid-gap)] overflow-x-auto overscroll-x-contain p-0 py-2 max-sm:-mx-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)] max-sm:px-[var(--website-gutter)]"
                    aria-label="What you get"
                >
                    {items.map((item, i) => {
                        const kind = i === 0 ? 'feature' : KINDS[(i - 1) % KINDS.length]
                        const art = pickImage(item.image, photos, i + 2)
                        return (
                            <li
                                key={`${item.title}-${i}`}
                                className={cn('shrink-0 snap-start', kind === 'feature' ? 'w-[min(88vw,34rem)]' : 'w-[min(78vw,19rem)]')}
                                data-reveal
                            >
                                {kind === 'feature' && <FeatureCard item={item} art={art} />}
                                {kind === 'plain' && <PlainCard item={item} art={art} index={i} />}
                                {kind === 'photo' && (art ? <PhotoCard item={item} art={art} /> : <PlainCard item={item} art={null} index={i} />)}
                                {kind === 'sun' && <SunCard item={item} index={i} />}
                            </li>
                        )
                    })}
                </ul>

                <div className="mt-6 flex flex-col-reverse gap-4 sm:mt-8 sm:flex-row sm:items-start sm:justify-between">
                    {content.note && <p className="max-w-md text-[0.875rem] leading-relaxed text-ink-muted">{content.note}</p>}
                    <RailControls rail={rail} label="card" className="sm:ml-auto" />
                </div>
            </div>
        </section>
    )
}

export default GiftPromiseCards
