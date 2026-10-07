'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { cn, initialsOf } from '@/lib/utils'
import RailControls from '../storefront/RailControls'
import { GiftSectionHead, pickImage } from './GiftingUi'

const Stars = ({ rating }) =>
    rating > 0 ? (
        <span className="flex gap-0.5 text-olive" role="img" aria-label={`${rating} out of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn('size-3.5', i < rating ? 'fill-current' : 'opacity-30')} aria-hidden="true" />
            ))}
        </span>
    ) : null

const QuoteCard = ({ item }) => {
    const photo = item.photo?.url ? item.photo : null
    return (
        <figure className="flex h-full flex-col gap-5 rounded-tile bg-surface-sunken p-5 ring-1 ring-inset ring-line-soft sm:p-6">
            <div className="flex items-center justify-between gap-3">
                {item.company ? (
                    <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-surface-card py-1.5 pl-1.5 pr-3.5 text-[0.8125rem] font-semibold text-ink-strong shadow-elev-1">
                        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-[0.625rem] font-bold text-on-brand">{initialsOf(item.company)}</span>
                        <span className="truncate">{item.company}</span>
                    </span>
                ) : (
                    <Stars rating={item.rating} />
                )}
                {photo ? (
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-surface-well ring-2 ring-surface-card">
                        <Image src={photo.url} alt={photo.alt || item.name} fill sizes="48px" className="object-cover" style={{ objectPosition: photo.position }} />
                    </span>
                ) : (
                    <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-tint-pistachio font-header text-[0.9375rem] font-semibold text-brand ring-2 ring-surface-card">
                        {initialsOf(item.name)}
                    </span>
                )}
            </div>

            <span aria-hidden="true" className="-mb-3 font-header text-[3.25rem] font-semibold leading-[0.6] text-sun">“</span>
            <blockquote className="text-[clamp(1.0625rem,0.95rem+0.4vw,1.3125rem)] font-medium leading-snug text-ink-strong [text-wrap:pretty]">
                {item.quote}
            </blockquote>

            <figcaption className="mt-auto flex flex-col gap-1 border-t border-line-soft pt-4">
                <span className="text-[0.9375rem] font-semibold text-ink-strong">{item.name}</span>
                {(item.role || item.company) && (
                    <span className="text-[0.8125rem] text-ink-muted">{[item.role, item.company].filter(Boolean).join(' · ')}</span>
                )}
                {item.company && <Stars rating={item.rating} />}
            </figcaption>
        </figure>
    )
}

/**
 * "Kind words", after the reference's community testimonials: a small photo
 * and the headline with arrows on the left, a row of quote cards on the
 * right — each with the company as a pill, the person's photo or initials,
 * a sunflower quote mark, the quote and who said it.
 *
 * Shows only quotes the team has added in the admin; with none, the page
 * leaves the section out.
 */
const GiftTestimonials = ({ content, photos = [], number }) => {
    const rootRef = useRef(null)
    const rail = useScrollRail()
    useReveal(rootRef, [content.items.length])

    const items = content.items.filter((item) => item.quote && item.name)
    if (!items.length) return null
    const side = pickImage(content.image, photos, 3)

    return (
        <section ref={rootRef} className="ef-section ef-section--page" aria-labelledby="testimonials-title">
            <div className="ef-container">
                <GiftSectionHead number={number} eyebrow={content.eyebrow} />

                <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-10">
                    <div className="flex min-w-0 flex-col justify-between gap-6" data-reveal>
                        {side && (
                            <div className="relative size-28 overflow-hidden rounded-tile bg-surface-well shadow-elev-1 sm:size-36 max-lg:hidden">
                                <Image src={side.src} alt={side.alt} fill sizes="144px" className="object-cover" style={{ objectPosition: side.position }} />
                            </div>
                        )}
                        <div className="flex flex-col gap-6">
                            <h2 id="testimonials-title" className="ef-title">
                                {content.title}
                                {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                            </h2>
                            <RailControls rail={rail} label="testimonial" />
                        </div>
                    </div>

                    <ul
                        ref={rail.railRef}
                        className="ef-rail list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)] max-sm:px-[var(--website-gutter)]"
                        style={{ '--rail-item': items.length === 1 ? 'min(100%, 30rem)' : 'clamp(17rem, 82vw, 24rem)' }}
                        aria-label="Testimonials"
                    >
                        {items.map((item, i) => (
                            <li key={`${item.name}-${i}`} className="min-w-0" data-reveal>
                                <QuoteCard item={item} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}

export default GiftTestimonials
