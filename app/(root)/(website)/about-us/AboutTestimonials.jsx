'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Star } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { pad2 } from '@/lib/pageContent/shared'
import { cn, initialsOf } from '@/lib/utils'
import { AboutMetaRow } from './AboutUi'

const SWIPE_PX = 48

/**
 * "What shoppers tell us", after the wellness reference's members panel: a
 * rounded pine panel with the headline and arrows across the top, then a
 * photo beside one large quote card at a time — initials, name, stars and a
 * "02 / 05" count under the quote. Swipe the card on touch screens.
 *
 * testimonials — the admin's homepage testimonials (Admin → Testimonials)
 */
const AboutTestimonials = ({ content, testimonials = [], number }) => {
    const [index, setIndex] = useState(0)
    const swipeRef = useRef(null)

    const items = testimonials.filter((item) => item?.review && item?.name)
    if (!items.length) return null
    const count = items.length
    const current = items[Math.min(index, count - 1)]
    const rating = Math.max(0, Math.min(5, Math.round(Number(current.rating) || 0)))
    const photo = content.image?.url ? content.image : null

    const go = (step) => setIndex((i) => (i + step + count) % count)

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
        <Section tone="page" aria-labelledby="voices-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="ef-tile ef-on-inverse bg-pine p-[clamp(0.75rem,2vw,1.5rem)] text-cream shadow-elev-3" data-reveal>
                <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />

                <div className="flex flex-wrap items-end justify-between gap-4 px-2 pb-[clamp(1rem,2.5vw,1.75rem)] pt-2 sm:px-3">
                    <h2 id="voices-title" className="m-0 max-w-md font-header text-[clamp(1.5rem,1.1rem+1.6vw,2.5rem)] font-medium leading-tight text-cream [text-wrap:balance]">
                        {content.title}
                    </h2>
                    {count > 1 && (
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => go(-1)} className="ef-icon-btn border-transparent" aria-label="Previous review">
                                <ArrowLeft aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => go(1)} className="ef-icon-btn border-transparent" aria-label="Next review">
                                <ArrowRight aria-hidden="true" />
                            </button>
                        </div>
                    )}
                </div>

                <div className={cn('grid gap-[clamp(0.75rem,1.5vw,1rem)]', photo && 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]')}>
                    {photo && (
                        <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-pine-deep md:aspect-auto md:min-h-[20rem]">
                            <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 768px) 92vw, 36vw" className="object-cover" style={{ objectPosition: photo.position }} />
                        </div>
                    )}

                    <figure
                        className="m-0 flex touch-pan-y select-text flex-col gap-6 rounded-card bg-cream p-[clamp(1.25rem,3vw,2.5rem)] text-pine"
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUp}
                        onPointerCancel={() => { swipeRef.current = null }}
                        aria-live="polite"
                        aria-roledescription={count > 1 ? 'carousel item' : undefined}
                        aria-label={count > 1 ? `Review ${index + 1} of ${count}` : undefined}
                    >
                        <span aria-hidden="true" className="-mb-4 font-header text-[3.5rem] font-semibold leading-[0.7] text-forest">“</span>
                        <blockquote
                            key={current._id || index}
                            className="m-0 font-header text-[clamp(1.125rem,0.95rem+0.8vw,1.625rem)] font-medium leading-snug duration-500 animate-in fade-in slide-in-from-bottom-1 [text-wrap:pretty] motion-reduce:animate-none"
                        >
                            {current.review}
                        </blockquote>
                        <figcaption className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-pine/15 pt-5">
                            <span className="flex min-w-0 items-center gap-3">
                                <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-pine font-header text-[0.9375rem] font-semibold text-sun">
                                    {initialsOf(current.name)}
                                </span>
                                <span className="min-w-0">
                                    <span className="block truncate text-[0.9375rem] font-semibold">{current.name}</span>
                                    {rating > 0 && (
                                        <span className="mt-0.5 flex gap-0.5 text-[color:var(--palette-olive)]" role="img" aria-label={`${rating} out of 5`}>
                                            {Array.from({ length: 5 }, (_, i) => (
                                                <Star key={i} className={cn('size-3.5', i < rating ? 'fill-current' : 'opacity-30')} aria-hidden="true" />
                                            ))}
                                        </span>
                                    )}
                                </span>
                            </span>
                            {count > 1 && (
                                <span className="text-[0.8125rem] font-semibold tabular-nums text-pine/70" aria-hidden="true">
                                    {pad2(index + 1)} / {pad2(count)}
                                </span>
                            )}
                        </figcaption>
                    </figure>
                </div>
            </div>
        </Section>
    )
}

export default AboutTestimonials
