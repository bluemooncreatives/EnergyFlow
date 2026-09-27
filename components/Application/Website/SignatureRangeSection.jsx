'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import { ChocolateBox, GheeJar, OilBottle } from './storefront/ProductIllustrations'

// The three lines Energyflow leads with. Each tile deep-links into a filtered
// shop view. Set `image` on a tile (a /public path or Cloudinary URL) and it
// replaces the illustration with real photography — no layout change needed.
const RANGES = [
    {
        key: 'ghee',
        eyebrow: 'A2 Gir cow · Bilona',
        title: 'Bilona Ghee',
        copy: 'Curd from A2 Gir cow milk, hand-churned and slow-simmered the traditional way. Grainy, aromatic and deeply rich.',
        cta: 'Shop ghee',
        href: `${WEBSITE_SHOP}?q=ghee`,
        tint: 'var(--tint-honey)',
        Art: GheeJar,
        image: null,
    },
    {
        key: 'oils',
        eyebrow: 'Wood & expeller pressed',
        title: 'Cold Pressed Oils',
        copy: 'Pressed at low temperature. Never refined, bleached or deodorised.',
        cta: 'Shop oils',
        href: `${WEBSITE_SHOP}?q=oil`,
        tint: 'var(--tint-pistachio)',
        Art: OilBottle,
        image: null,
    },
    {
        key: 'chocolates',
        eyebrow: 'Festive & corporate',
        title: 'Gift Chocolates',
        copy: 'Chocolate and dry fruit boxes for Diwali, weddings and teams.',
        cta: 'Shop gifts',
        href: `${WEBSITE_SHOP}?q=chocolate`,
        tint: 'var(--tint-almond)',
        Art: ChocolateBox,
        image: null,
    },
]

const RangeTile = ({ range, featured }) => {
    const { Art } = range

    return (
        <Link
            href={range.href}
            data-reveal
            className={cn(
                'ef-tile ef-focus group/tile @container/tile flex min-h-[15rem] flex-col p-6 sm:p-8',
                featured ? 'lg:row-span-2 lg:min-h-[34rem] lg:p-10' : 'lg:min-h-0'
            )}
            style={{ background: range.tint }}
            aria-label={`${range.title} — ${range.cta}`}
        >
            {/* soft light pooling behind the art */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-1/4 -right-1/4 -z-10 aspect-square w-[80%] rounded-full bg-white/45 blur-2xl"
            />

            <div className={cn('relative z-10 flex max-w-[62%] flex-col gap-3', featured && 'lg:max-w-[70%]')}>
                <span className="ef-eyebrow self-start">{range.eyebrow}</span>
                <h3
                    className={cn(
                        'font-medium leading-[1.05] tracking-[-0.03em] text-ink-strong',
                        featured ? 'text-[clamp(1.75rem,1.2rem+2.2vw,3.25rem)]' : 'text-[clamp(1.5rem,1.2rem+1.1vw,2.125rem)]'
                    )}
                >
                    {range.title}
                </h3>
                <p className={cn('text-[0.9375rem] leading-relaxed text-ink-body', !featured && 'hidden @[26rem]/tile:block')}>
                    {range.copy}
                </p>
            </div>

            <span className="relative z-10 mt-auto inline-flex items-center gap-2 pt-6 text-[0.9375rem] font-medium text-brand">
                <span className="flex size-10 items-center justify-center rounded-full bg-brand text-white transition-transform duration-300 group-hover/tile:rotate-45 motion-reduce:transition-none">
                    <ArrowUpRight className="size-[1.1rem]" aria-hidden="true" />
                </span>
                {range.cta}
            </span>

            <div
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute bottom-0 right-0 transition-transform duration-700 ease-out group-hover/tile:-translate-y-2 group-hover/tile:scale-[1.03] motion-reduce:transition-none',
                    featured
                        ? 'w-[40%] max-w-[15rem] sm:max-w-[17rem] lg:w-[50%] lg:max-w-[21rem] lg:right-6 lg:bottom-4'
                        : 'w-[42%] max-w-[13rem] lg:w-[40%]'
                )}
            >
                {range.image ? (
                    <div className="relative aspect-square">
                        <Image src={range.image} alt="" fill sizes="(max-width: 1024px) 45vw, 26rem" className="object-contain" />
                    </div>
                ) : (
                    <Art className="h-auto w-full drop-shadow-[0_18px_24px_rgba(20,38,26,0.12)]" />
                )}
            </div>
        </Link>
    )
}

const SignatureRangeSection = () => {
    const sectionRef = useRef(null)
    useReveal(sectionRef)

    return (
        <Section ref={sectionRef} aria-labelledby="signature-title">
            <SectionHeader
                id="signature-title"
                eyebrow="Our signature range"
                title="Made the slow way,"
                accent="worth gifting."
                description="The three things we are known for: traditional bilona ghee, cold pressed oils and chocolates boxed for giving."
            />

            <div className="grid gap-[var(--grid-gap)] lg:grid-cols-[1.15fr_1fr] lg:grid-rows-2">
                {RANGES.map((range, i) => (
                    <RangeTile key={range.key} range={range} featured={i === 0} />
                ))}
            </div>
        </Section>
    )
}

export default SignatureRangeSection
