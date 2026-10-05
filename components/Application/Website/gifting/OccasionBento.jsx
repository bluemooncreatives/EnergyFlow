'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ArrowUpRight, BriefcaseBusiness, Handshake, Mic2 } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from '../storefront/Section'
import { useGiftingSelection } from './GiftingSelection'
import { photoOf } from './GiftingUi'

// Values match OCCASIONS in lib/giftEnquiry so a tile can pre-pick the form.
// `photo` tiles borrow a gift box photo; the rest are solid token tiles.
const TILES = [
    { value: 'diwali', label: 'Festive', name: 'Diwali & festive', note: 'Hampers for family, friends and every visit of the season.', photo: 0, place: 'col-span-2 min-h-[15rem] lg:col-span-1 lg:col-start-1 lg:row-span-2 lg:row-start-1' },
    { value: 'employees', label: 'Teams', name: 'Employee gifting', note: 'Onboarding kits, milestones and festive thank-yous.', tone: 'bg-tint-pistachio text-ink-strong', Icon: BriefcaseBusiness, place: 'lg:col-start-2 lg:row-start-2' },
    { value: 'clients', label: 'Clients', name: 'Client thank-you', note: 'A gift that keeps your name on their desk.', tone: 'bg-sun text-sun-ink', Icon: Handshake, place: 'lg:col-start-3 lg:row-start-2' },
    { value: 'wedding', label: 'Celebrations', name: 'Weddings & shagun', note: 'Favours and shagun boxes for every guest.', photo: 1, place: 'lg:col-start-4 lg:row-start-1' },
    { value: 'events', label: 'Events', name: 'Events & conferences', note: 'Speaker gifts and delegate kits, on time.', tone: 'bg-pine text-cream', Icon: Mic2, place: 'lg:col-start-4 lg:row-start-2' },
]

/**
 * "Gifting for an occasion?" — a bento of occasions. Picking one jumps to the
 * enquiry form with that occasion already chosen, so a corporate buyer starts
 * from what they are planning rather than from a blank form.
 */
const OccasionBento = ({ products = [] }) => {
    const rootRef = useRef(null)
    const { enquireAbout } = useGiftingSelection()
    useReveal(rootRef)

    const photos = products.map(photoOf).filter(Boolean)
    const photoFor = (n) => photos[n] || photos[0] || null

    return (
        <Section ref={rootRef} tone="sunken" aria-labelledby="occasion-title">
            <div className="grid grid-cols-2 gap-[var(--grid-gap)] lg:grid-cols-4 lg:grid-rows-[minmax(14rem,auto)_minmax(16rem,auto)]">
                <div className="col-span-2 flex flex-col items-start justify-center gap-4 pb-4 lg:col-start-2 lg:row-start-1 lg:px-6 lg:pb-0" data-reveal>
                    <span className="ef-eyebrow">Gifting for an occasion?</span>
                    <h2 id="occasion-title" className="ef-title">
                        Choose the occasion, <span className="ef-title__accent">we&apos;ll build the box</span>
                    </h2>
                    <p className="ef-lead max-w-xl">
                        Pick one and your brief opens with it filled in. Add the quantity and date, and our gifting team
                        replies within one working day.
                    </p>
                </div>

                {TILES.map(({ value, label, name, note, photo, tone, Icon, place }) => {
                    const src = photo !== undefined ? photoFor(photo) : null
                    return (
                        <button
                            key={value}
                            type="button"
                            onClick={() => enquireAbout(undefined, { occasion: value })}
                            className={cn(
                                'ef-tile ef-focus group flex min-h-[12rem] flex-col justify-between gap-4 p-4 text-left shadow-elev-1 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-elev-2 motion-reduce:transition-none sm:p-5',
                                src ? 'bg-pine text-cream' : tone,
                                place
                            )}
                            aria-label={`Plan ${name.toLowerCase()} gifting`}
                            data-reveal
                        >
                            {src && (
                                <>
                                    <Image src={src} alt="" fill sizes="(max-width: 1024px) 92vw, 25vw" className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none" />
                                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/85 via-pine-deep/10 to-pine-deep/30" />
                                </>
                            )}
                            <span className="flex items-start justify-between gap-3">
                                <span className={cn('ef-badge', src ? 'ef-badge--soft' : 'bg-surface-card/25')}>{label}</span>
                                {Icon && <Icon className="size-6 opacity-80" strokeWidth={1.5} aria-hidden="true" />}
                            </span>
                            <span className="flex items-end justify-between gap-3">
                                <span className="min-w-0">
                                    <span className="block font-header text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-semibold uppercase leading-none">{name}</span>
                                    <span className="mt-1.5 block max-w-[18rem] text-[0.8125rem] leading-snug opacity-85">{note}</span>
                                </span>
                                <span className="ef-icon-btn shrink-0 border-transparent bg-surface-card text-ink-strong transition-transform duration-300 group-hover:rotate-45" aria-hidden="true">
                                    <ArrowUpRight />
                                </span>
                            </span>
                        </button>
                    )
                })}
            </div>
        </Section>
    )
}

export default OccasionBento
