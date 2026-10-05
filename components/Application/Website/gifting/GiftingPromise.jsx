'use client'

import { useRef } from 'react'
import { ArrowRight, BadgePercent, Layers, Stamp, Truck } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from '../storefront/Section'
import { EnquireButton } from './GiftingSelection'
import { pad } from './GiftingUi'

const PROMISES = [
    {
        Icon: Stamp,
        tone: 'ef-seal--sun',
        title: 'Your brand on every box',
        copy: 'Logo sleeves, printed message cards and personalised notes, so the gift is unmistakably from you.',
    },
    {
        Icon: Layers,
        tone: 'ef-seal--pine',
        title: 'Curated to your budget',
        copy: 'Choose a signature box or have us build a custom mix of dry fruits, chocolates and treats.',
    },
    {
        Icon: BadgePercent,
        tone: 'ef-seal--forest',
        title: 'Volume pricing',
        copy: 'Better rates as quantities grow, with one clear quote covering boxes, branding and delivery.',
    },
    {
        Icon: Truck,
        tone: 'ef-seal--olive',
        title: 'Delivered across India',
        copy: 'Packed fresh and shipped free to offices and homes nationwide, timed for your date.',
    },
]

/**
 * "For teams & brands" — a two-tone statement beside its eyebrow, then the
 * four promises as a staggered row of cards.
 */
const GiftingPromise = () => {
    const rootRef = useRef(null)
    useReveal(rootRef)

    return (
        <Section ref={rootRef} tone="page" aria-labelledby="promise-title">
            <div className="mb-[var(--section-gap)] grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-10">
                <div data-reveal><span className="ef-eyebrow">For teams &amp; brands</span></div>
                <div className="flex flex-col items-start gap-7">
                    <h2 id="promise-title" className="text-[clamp(1.375rem,1rem+1.6vw,2.5rem)] font-medium leading-[1.2] text-ink-strong [text-wrap:pretty]" data-reveal>
                        Gifting that carries your name, at any scale.{' '}
                        <span className="text-ink-muted">Pick a signature box or brief us on your own; we handle the branding, the packing and the delivery to every address.</span>
                    </h2>
                    <EnquireButton className="ef-cta" data-reveal>
                        <span>Start your brief</span>
                        <span className="ef-cta__box" aria-hidden="true"><ArrowRight /></span>
                    </EnquireButton>
                </div>
            </div>

            <ul className="grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
                {PROMISES.map(({ Icon, tone, title, copy }, i) => (
                    <li
                        key={title}
                        className={cn('ef-card ef-card--interactive gap-8 p-6', i % 2 === 1 && 'lg:mt-14')}
                        data-reveal
                    >
                        <span className="flex items-start justify-between">
                            <span className={`ef-seal ${tone} !size-16`}><Icon aria-hidden="true" /></span>
                            <span className="text-[0.75rem] font-semibold tabular-nums text-ink-muted" aria-hidden="true">{pad(i + 1)}</span>
                        </span>
                        <div>
                            <h3 className="text-[1.0625rem] font-semibold uppercase leading-snug text-ink-strong">{title}</h3>
                            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-body">{copy}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Section>
    )
}

export default GiftingPromise
