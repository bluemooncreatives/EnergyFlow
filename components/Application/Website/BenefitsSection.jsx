'use client'

import { useRef } from 'react'
import { Leaf, Truck, ShieldCheck, Gift } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import StoreButton from './storefront/StoreButton'
import WaveEdge from './storefront/WaveEdge'

const BENEFITS = [
    {
        Icon: Leaf,
        title: 'Freshly Sourced',
        description: 'Bought in small, frequent lots and packed fresh, never left sitting in storage.',
    },
    {
        Icon: Truck,
        title: 'Free Shipping',
        description: 'No hidden costs — just the price you see at checkout.',
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

// Full-bleed deep-green band with organic wave edges that spill into the
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

            <div className="relative py-[clamp(0.5rem,2vw,1.5rem)] text-white">
                <SectionHeader
                    id="benefits-title"
                    eyebrow="Our promise"
                    title="Why shoppers"
                    accent="choose us"
                    action={<StoreButton href={WEBSITE_SHOP} variant="accent" arrow>Shop all products</StoreButton>}
                />

                <ul className="grid list-none grid-cols-1 gap-[var(--grid-gap)] p-0 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Icon beside the text while cards are wide (1–2 columns);
                        stacked only in the narrow 4-up desktop row. Everything
                        stays left-aligned to the same edge at every width. */}
                    {BENEFITS.map(({ Icon, title, description }) => (
                        <li
                            key={title}
                            data-reveal
                            className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-4 gap-y-1.5 rounded-card bg-white/[0.06] p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors duration-300 hover:bg-white/[0.09] sm:gap-x-5 sm:p-6 lg:flex lg:flex-col lg:items-start lg:gap-0 lg:p-7"
                        >
                            <span className="row-span-2 flex size-11 shrink-0 items-center justify-center rounded-full bg-amber text-brand-deep sm:size-12 lg:mb-6">
                                <Icon className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="self-center text-[1.125rem] font-medium leading-snug tracking-[-0.01em] text-white sm:text-[1.1875rem] lg:mb-2 lg:self-start">{title}</h3>
                            <p className="col-start-2 text-[0.9375rem] leading-relaxed text-white/75">{description}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </Section>
    )
}

export default BenefitsSection
