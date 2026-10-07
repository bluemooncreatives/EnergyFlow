'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, Star } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { cn, initialsOf } from '@/lib/utils'
import { ABOUT_STATEMENT, AboutMetaRow, AboutPager, AboutTitle } from './AboutUi'

const SWIPE_PX = 48

// The six-spoke asterisk the reference sets under its satisfaction line.
const Asterisk = ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <g fill="currentColor">
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" />
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" transform="rotate(60 12 12)" />
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" transform="rotate(-60 12 12)" />
        </g>
    </svg>
)

const Stars = ({ value, className }) => (
    <span className={cn('flex gap-0.5 text-olive', className)} role="img" aria-label={`${value} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={cn('size-3.5', i < value ? 'fill-sun' : 'opacity-30')} aria-hidden="true" />
        ))}
    </span>
)

const starsOf = (item) => Math.max(0, Math.min(5, Math.round(Number(item?.rating) || 0)))

/**
 * "What shoppers tell us", after the sports-centre reference's testimonial
 * row: the headline with an asterisk and the store's average (or the count
 * of reviews) beside the "02 / 08" pager; under them a large photo, the
 * review set large with the shopper's name and stars, and a small card for
 * the next review.
 * Swipe the quote on touch screens.
 *
 * testimonials — the admin's homepage testimonials (Admin → Testimonials)
 * rating       — { avg, count } when it should show, else null
 */
const AboutTestimonials = ({ content, testimonials = [], rating = null, number, tone = 'page' }) => {
    const [index, setIndex] = useState(0)
    const swipeRef = useRef(null)

    const items = testimonials.filter((item) => item?.review && item?.name)
    if (!items.length) return null

    const count = items.length
    const current = Math.min(index, count - 1)
    const item = items[current]
    const next = items[(current + 1) % count]
    const stars = starsOf(item)
    const photo = content.image?.url ? content.image : null

    const go = (step) => setIndex((current + step + count) % count)

    const onPointerDown = (event) => {
        if (event.pointerType === 'mouse' || count < 2) return
        swipeRef.current = { x: event.clientX, y: event.clientY }
    }
    const onPointerUp = (event) => {
        const start = swipeRef.current
        swipeRef.current = null
        if (!start) return
        const dx = event.clientX - start.x
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.2) go(dx < 0 ? 1 : -1)
    }

    return (
        <Section tone={tone} aria-labelledby="voices-title">
            <AboutMetaRow label={content.label} number={number} />

            {/* Headline and rating · pager */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" data-reveal>
                <div className="flex flex-col gap-3">
                    <AboutTitle id="voices-title" title={content.title} />
                    <p className="m-0 flex flex-wrap items-center gap-2 text-[0.875rem] text-ink-muted">
                        <Asterisk className="size-4 text-brand-bright" />
                        {rating ? (
                            <span>
                                <strong className="font-semibold text-ink-strong">{rating.avg.toFixed(1)}</strong> average from {rating.count.toLocaleString('en-IN')} reviews
                            </span>
                        ) : (
                            <span>{count} {count === 1 ? 'shopper' : 'shoppers'} in their own words</span>
                        )}
                    </p>
                </div>
                {count > 1 && <AboutPager current={current} count={count} onPrev={() => go(-1)} onNext={() => go(1)} noun="review" />}
            </div>

            {/* Photo · quote · next */}
            <div
                className={cn(
                    'mt-[clamp(1.5rem,3vw,2.5rem)] grid items-stretch gap-[clamp(1.25rem,3vw,3rem)]',
                    photo ? 'md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)_minmax(0,2fr)]' : 'lg:grid-cols-[minmax(0,10fr)_minmax(0,2fr)]'
                )}
            >
                {photo && (
                    <div className="ef-tile relative aspect-[4/3] bg-pine shadow-elev-2 md:aspect-auto md:min-h-[24rem] lg:min-h-[28rem]" data-reveal>
                        <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 768px) 92vw, 34vw" className="object-cover" style={{ objectPosition: photo.position }} />
                    </div>
                )}

                <figure
                    className="m-0 flex touch-pan-y select-text flex-col justify-center gap-6 py-2"
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { swipeRef.current = null }}
                    aria-live="polite"
                    aria-roledescription={count > 1 ? 'carousel item' : undefined}
                    aria-label={count > 1 ? `Review ${current + 1} of ${count}` : undefined}
                    data-reveal
                >
                    <span aria-hidden="true" className="-mb-5 font-header text-[4rem] font-semibold leading-[0.8] text-brand-bright">“</span>
                    <blockquote
                        key={item._id || current}
                        className={cn(ABOUT_STATEMENT, 'duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none')}
                    >
                        {item.review}
                    </blockquote>
                    <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.875rem]">
                        <span className="font-semibold text-brand-bright">{item.name}</span>
                        {stars > 0 && (
                            <>
                                <span aria-hidden="true" className="h-4 w-px bg-line-strong" />
                                <Stars value={stars} />
                            </>
                        )}
                    </figcaption>
                </figure>

                {/* Next review */}
                {count > 1 && (
                    <div className="flex flex-col justify-end gap-4 max-md:hidden md:col-span-2 md:flex-row md:items-end md:justify-between lg:col-span-1 lg:flex-col lg:items-stretch" data-reveal>
                        <button
                            type="button"
                            onClick={() => go(1)}
                            className="ef-tile ef-focus group relative flex aspect-square w-full max-w-[13rem] flex-col justify-between bg-pine p-4 text-left text-cream shadow-elev-2"
                            aria-label={`Next review, from ${next.name}`}
                        >
                            <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />
                            <span className="flex items-start justify-between gap-2">
                                <span aria-hidden="true" className="font-header text-[2.5rem] font-semibold leading-none text-sun">{initialsOf(next.name)}</span>
                                <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-cream text-pine transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none">
                                    <ArrowUpRight className="size-4" />
                                </span>
                            </span>
                            <span>
                                <span className="block text-[0.625rem] font-semibold uppercase text-cream/70">Up next</span>
                                <span className="mt-0.5 block truncate text-[0.875rem] font-semibold">{next.name}</span>
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </Section>
    )
}

export default AboutTestimonials
