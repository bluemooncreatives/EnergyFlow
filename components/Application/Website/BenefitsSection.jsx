'use client'

import { useRef } from 'react'
import { Leaf, Truck, ShieldCheck, Gift } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import StoreButton from './storefront/StoreButton'
import WaveEdge from './storefront/WaveEdge'
import { cn } from '@/lib/utils'

const BENEFITS = [
    {
        Icon: Leaf,
        title: 'Freshly Sourced',
        description: 'Bought in small, frequent lots and packed fresh, never left sitting in storage.',
    },
    {
        Icon: Truck,
        title: 'Free Shipping',
        description: 'No hidden costs - just the price you see at checkout.',
    },
    {
        Icon: ShieldCheck,
        title: 'Quality Checked',
        description: 'Every lot graded for freshness and purity before it reaches your pack.',
    },
    {
        Icon: Gift,
        title: 'Bulk & Gifting',
        description: 'Corporate hampers and bulk orders at volume pricing, built to your brief.',
    },
]

// Full-bleed pine band with organic wave edges that spill into the
// sections either side. z-[1] lifts it above the following section so the
// lower wave isn't painted over.
const BenefitsSection = () => {
    const sectionRef = useRef(null)
    useReveal(sectionRef)

    return (
        <Section
            ref={sectionRef}
            tone="inverse"
            aria-labelledby="benefits-title"
            className="z-[1] text-[var(--surface-inverse)]"
        >
            <WaveEdge position="top" />
            <WaveEdge position="bottom" />

            <div className="relative py-[clamp(0.5rem,2vw,1.5rem)] text-[var(--ink-on-inverse)]">
                <SectionHeader
                    id="benefits-title"
                    eyebrow="Our promise"
                    title="Why shoppers"
                    accent="choose us"
                    action={<StoreButton href={WEBSITE_SHOP} variant="accent" arrow>Shop all products</StoreButton>}
                />

                {/* The reference's ruled feature row: cells divided by thin
                    cream rules (the 1px gap shows the ul's rule colour
                    through), each led by a scalloped seal. */}
                <ul className="grid list-none grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-[rgb(247_243_232/0.22)] bg-[rgb(247_243_232/0.22)] p-0 sm:grid-cols-2 lg:grid-cols-4">
                    {BENEFITS.map(({ Icon, title, description }, i) => (
                        <li
                            key={title}
                            data-reveal
                            className="flex flex-col items-center gap-4 bg-[var(--surface-inverse)] px-6 py-9 text-center transition-colors duration-300 hover:bg-[var(--brand-pine-hover)] lg:py-11"
                        >
                            <span className={cn('ef-seal size-[4.25rem] sm:size-[4.75rem]', i % 2 ? 'ef-seal--cream' : 'ef-seal--sun')}>
                                <Icon strokeWidth={1.75} aria-hidden="true" />
                            </span>
                            <h3 className="font-header text-[1.125rem] font-semibold uppercase leading-tight text-[var(--palette-cream)] sm:text-[1.1875rem]">{title}</h3>
                            <p className="max-w-[17rem] text-[0.9375rem] leading-relaxed text-[var(--ink-on-inverse-muted)]">{description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </Section>
    )
}

export default BenefitsSection
