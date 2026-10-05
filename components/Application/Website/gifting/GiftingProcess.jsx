'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import { MIN_GIFT_QUANTITY } from '@/lib/giftEnquiry'
import RailControls from '../storefront/RailControls'
import Section from '../storefront/Section'
import { pad } from './GiftingUi'

const STEPS = [
    {
        title: 'Share your brief',
        copy: 'Tell us the occasion, how many boxes, a budget per box and when they need to arrive. It takes about two minutes.',
        chips: ['Occasion', `${MIN_GIFT_QUANTITY}+ boxes`, 'Budget', 'Date'],
    },
    {
        title: 'Get options & one quote',
        copy: 'Our gifting team replies within one working day with box options and a single quote covering boxes, branding and delivery.',
        chips: ['Reply in 1 working day', 'Volume pricing'],
    },
    {
        title: 'Brand & pack',
        copy: 'Once you approve, we add your logo sleeves, message cards or personalised notes and pack every box fresh.',
        chips: ['Logo sleeves', 'Message cards', 'Packed fresh'],
    },
    {
        title: 'Delivered, on your date',
        copy: 'Boxes ship free across India, to one office or to every address on your list, timed for the day you need them.',
        chips: ['Pan-India', 'Multiple addresses'],
    },
]

/**
 * "How bulk orders work" — the four steps as a swipeable row of large cards
 * with a 01 ── 04 progress line and arrows.
 */
const GiftingProcess = ({ products = [] }) => {
    const rootRef = useRef(null)
    const rail = useScrollRail()
    useReveal(rootRef)

    // Every photo of every box, so neighbouring steps rarely repeat one.
    const photos = products.flatMap((p) => (p.media || []).map((m) => m?.secure_url)).filter(Boolean)
    const photoAt = (i) => (photos.length ? photos[(i * 2 + 1) % photos.length] : null)
    const progress = ((rail.index + 1) / Math.max(rail.stops, 1)) * 100

    return (
        <Section ref={rootRef} tone="sunken" aria-labelledby="process-title">
            <div className="mb-[var(--section-gap)] grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-10">
                <div data-reveal><span className="ef-eyebrow">How bulk orders work</span></div>
                <h2 id="process-title" className="text-[clamp(1.375rem,1rem+1.6vw,2.5rem)] font-medium leading-[1.2] text-ink-strong [text-wrap:pretty]" data-reveal>
                    From brief to doorstep in four steps.{' '}
                    <span className="text-ink-muted">One team plans, brands, packs and ships your order, and you approve everything before we start.</span>
                </h2>
            </div>

            <ol
                ref={rail.railRef}
                className="ef-rail no-scrollbar list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:px-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)]"
                style={{ '--rail-item': 'clamp(17.5rem, 86vw, 52rem)' }}
                aria-label="Bulk order steps"
            >
                {STEPS.map(({ title, copy, chips }, i) => {
                    const src = photoAt(i)
                    return (
                        <li key={title} className="ef-card grid min-w-0 gap-5 p-2 md:min-h-[22rem] md:grid-cols-2" data-reveal>
                            <div className="ef-tile aspect-[16/10] bg-surface-well md:aspect-auto">
                                {src && <Image src={src} alt="" fill sizes="(max-width: 768px) 86vw, 26rem" className="object-cover" />}
                            </div>
                            <div className="flex flex-col justify-between gap-6 px-3 pb-4 md:py-4 md:pl-1 md:pr-5">
                                <div>
                                    <span className="font-header text-[clamp(2.5rem,2rem+2vw,4rem)] font-semibold leading-none text-ink-strong" aria-hidden="true">{pad(i + 1)}</span>
                                    <h3 className="mt-2 text-[1rem] font-semibold uppercase text-ink-strong">
                                        <span className="sr-only">Step {i + 1}: </span>{title}
                                    </h3>
                                </div>
                                <div>
                                    <p className="text-[0.9375rem] leading-relaxed text-ink-body">{copy}</p>
                                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Covers">
                                        {chips.map((chip) => (
                                            <li key={chip} className="ef-badge bg-surface-sunken text-ink-strong">{chip}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ol>

            <div className="mt-8 flex items-center gap-4 sm:mt-12" data-reveal>
                <div className="flex flex-1 items-center gap-4 text-[0.75rem] font-semibold tabular-nums text-ink-muted" aria-hidden="true">
                    <span>{pad(rail.index + 1)}</span>
                    <span className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-line-strong">
                        <span className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${progress}%` }} />
                    </span>
                    <span>{pad(rail.stops)}</span>
                </div>
                <RailControls rail={rail} label="step" />
            </div>
        </Section>
    )
}

export default GiftingProcess
