'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ArrowUpRight, BriefcaseBusiness, Ellipsis, Handshake, Heart, Mic2, Sparkles } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { cn } from '@/lib/utils'
import RailControls from '../storefront/RailControls'
import { useGiftingSelection } from './GiftingSelection'
import { SectionTag, pad, pickImage } from './GiftingUi'

const ICONS = { diwali: Sparkles, employees: BriefcaseBusiness, clients: Handshake, events: Mic2, wedding: Heart, other: Ellipsis }

// Photo-less cards take a fixed palette fill, cycled so neighbours differ.
const FILLS = ['bg-forest text-cream', 'bg-sun text-sun-ink', 'bg-olive text-cream', 'bg-cream text-pine']

/**
 * "Choose the occasion", after the reference's dark collection band: the
 * section label and a side note on the left, the headline with the rail's
 * arrows on the right, then a row of tall photo cards. Picking a card opens
 * the enquiry form with that occasion already chosen.
 */
const GiftOccasionsBand = ({ content, photos = [], number }) => {
    const rootRef = useRef(null)
    const rail = useScrollRail()
    const { enquireAbout } = useGiftingSelection()
    useReveal(rootRef, [content.items.length])

    const items = content.items.filter((item) => item.title)
    if (!items.length) return null

    return (
        <section ref={rootRef} className="ef-section ef-section--inverse overflow-hidden" aria-labelledby="occasions-title">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: 'var(--pine-panel-gradient)' }} />
            <div className="ef-container relative">
                <div className="mb-[var(--section-gap)] grid gap-6 border-t border-cream/20 pt-5 sm:pt-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
                    <div className="flex flex-col justify-between gap-5" data-reveal>
                        <SectionTag number={number} eyebrow={content.eyebrow} inverse />
                        {content.label && <p className="max-w-[18rem] text-[0.9375rem] font-medium leading-snug text-cream/75 max-lg:hidden">{content.label}</p>}
                    </div>
                    <div className="flex min-w-0 flex-col gap-6" data-reveal>
                        <h2 id="occasions-title" className="ef-title">
                            {content.title}
                            {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                        </h2>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {content.label && <p className="max-w-[18rem] text-[0.875rem] leading-snug text-cream/75 lg:hidden">{content.label}</p>}
                            <RailControls rail={rail} label="occasion" className="ml-auto" />
                        </div>
                    </div>
                </div>

                <ul
                    ref={rail.railRef}
                    className="ef-rail list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)] max-sm:px-[var(--website-gutter)]"
                    style={{ '--rail-item': 'clamp(14.5rem, 70vw, 20rem)' }}
                    aria-label="Occasions"
                >
                    {items.map((item, i) => {
                        const art = pickImage(item.image, photos, i + 1)
                        const Icon = ICONS[item.occasion] || Ellipsis
                        return (
                            <li key={`${item.occasion}-${i}`} className="min-w-0" data-reveal>
                                <button
                                    type="button"
                                    onClick={() => enquireAbout(undefined, { occasion: item.occasion })}
                                    className={cn(
                                        'ef-tile ef-focus group flex aspect-[3/4] w-full flex-col justify-between p-4 text-left shadow-elev-2 sm:p-5',
                                        art ? 'bg-pine-deep text-cream' : FILLS[i % FILLS.length]
                                    )}
                                    aria-label={`Plan ${item.title} gifting`}
                                >
                                    {art && (
                                        <>
                                            <Image
                                                src={art.src}
                                                alt=""
                                                fill
                                                sizes="(max-width: 640px) 70vw, 20rem"
                                                className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                                                style={{ objectPosition: art.position }}
                                            />
                                            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/90 via-pine-deep/20 to-pine-deep/35" />
                                        </>
                                    )}
                                    <span className="flex items-start justify-between gap-3">
                                        <span className={cn('ef-badge tabular-nums backdrop-blur', art ? 'bg-cream/15 text-cream' : 'bg-white/30')}>{pad(i + 1)}</span>
                                        {!art && <Icon className="size-7 opacity-80" strokeWidth={1.5} aria-hidden="true" />}
                                    </span>
                                    <span className="flex items-end justify-between gap-3">
                                        <span className="min-w-0">
                                            <span className="block font-header text-[clamp(1.375rem,1.1rem+0.8vw,1.75rem)] font-semibold uppercase leading-none [overflow-wrap:anywhere]">{item.title}</span>
                                            {item.note && <span className="mt-2 block text-[0.8125rem] leading-snug opacity-85">{item.note}</span>}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-pine transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none"
                                        >
                                            <ArrowUpRight className="size-[1.125rem]" />
                                        </span>
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </section>
    )
}

export default GiftOccasionsBand
