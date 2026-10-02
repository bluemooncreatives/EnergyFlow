'use client'

import { useRef } from 'react'
import { Leaf, MapPin, Package, Star, Users } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import NumberCounter from './storefront/NumberCounter'

const ICONS = { package: Package, users: Users, map: MapPin, star: Star, leaf: Leaf }

// Tile tint + seal tone per position: a pine seal on the sunflower tints,
// a sunflower seal on the sage ones, so every seal stands off its tile.
const TILES = [
    { tint: 'bg-tint-almond', seal: 'ef-seal--pine' },
    { tint: 'bg-tint-sage', seal: 'ef-seal--sun' },
    { tint: 'bg-tint-honey', seal: 'ef-seal--pine' },
    { tint: 'bg-tint-pistachio', seal: 'ef-seal--sun' },
]

const StoreStatsSectionClient = ({ stats, tone = 'sunken' }) => {
    const sectionRef = useRef(null)
    useReveal(sectionRef)

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby="store-stats-title">
            <SectionHeader
                id="store-stats-title"
                eyebrow="By the numbers"
                title="Trusted in kitchens"
                accent="across India"
                description="Straight from our order book and refreshed every hour. We round down, never up."
            />

            <ul
                className={cn(
                    'grid list-none gap-[var(--grid-gap)] p-0',
                    stats.length === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
                )}
            >
                {stats.map((stat, i) => {
                    const Icon = ICONS[stat.icon] || Package
                    const tile = TILES[i % TILES.length]
                    return (
                        <li
                            key={stat.key}
                            data-reveal
                            className={cn(
                                '@container/stat flex flex-col rounded-[var(--radius-tile)] p-4 shadow-[inset_0_0_0_1px_var(--line-soft)] sm:p-6 lg:p-7',
                                tile.tint
                            )}
                        >
                            <span className={cn('ef-seal size-11 sm:size-14', tile.seal)}>
                                <Icon strokeWidth={1.75} aria-hidden="true" />
                            </span>

                            <NumberCounter
                                value={stat.value}
                                decimals={stat.decimals || 0}
                                suffix={stat.suffix}
                                className="mt-6 font-header text-[clamp(1.875rem,16cqi,3.75rem)] font-semibold leading-none text-ink-strong sm:mt-8"
                            />

                            <h3 className="mt-3 font-header text-[0.9375rem] font-semibold uppercase leading-tight text-ink-strong sm:text-[1.0625rem]">
                                {stat.label}
                            </h3>
                            <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-body sm:text-[0.875rem]">
                                {stat.caption}
                            </p>
                        </li>
                    )
                })}
            </ul>
        </Section>
    )
}

export default StoreStatsSectionClient
