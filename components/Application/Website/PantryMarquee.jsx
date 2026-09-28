'use client'

import { useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Section from './storefront/Section'
import Marquee, { usePrefersReducedMotion } from './storefront/Marquee'
import mixedNuts from '@/public/assets/images/marquee/mixed-nuts.webp'
import cashews from '@/public/assets/images/marquee/cashews.webp'
import chocolates from '@/public/assets/images/marquee/chocolates.webp'
import fruitJellies from '@/public/assets/images/marquee/fruit-jellies.webp'
import bilonaGhee from '@/public/assets/images/marquee/bilona-ghee.webp'

// Each line links into the shop: a category filter or a name search. `requires`
// names what must be in stock (see getStorefrontAvailability); until it is,
// the link opens the full shop instead of an empty results page.
const LINES = [
    { label: 'Mixed Nuts', image: mixedNuts, href: `${WEBSITE_SHOP}?category=dry-fruits-and-nuts`, requires: { category: 'dry-fruits-and-nuts' } },
    { label: 'Cashews', image: cashews, href: `${WEBSITE_SHOP}?q=cashew`, requires: { term: 'cashew' } },
    { label: 'Chocolates', image: chocolates, href: `${WEBSITE_SHOP}?q=chocolate`, requires: { term: 'chocolate' } },
    { label: 'Fruit Jellies', image: fruitJellies, href: `${WEBSITE_SHOP}?category=healthy-candies-and-sweets`, requires: { category: 'healthy-candies-and-sweets' } },
    { label: 'Bilona Ghee', image: bilonaGhee, href: `${WEBSITE_SHOP}?q=ghee`, requires: { term: 'ghee' } },
]

// With no availability data (fetch failed) links are left as authored.
const inStock = ({ category, term }, availability) => {
    if (!availability) return true
    if (category) return availability.categories?.includes(category) ?? true
    return availability.terms?.[term] !== false
}

// Mid-page breather between the product rails: the range as a large,
// draggable, scroll-reactive marquee of cut-outs, each a way into the shop.
const PantryMarquee = ({ availability = null, tone = 'sunken' }) => {
    const [paused, setPaused] = useState(false)
    const reduced = usePrefersReducedMotion()

    const items = LINES.map(({ requires, ...line }) => ({
        ...line,
        href: inStock(requires, availability) ? line.href : WEBSITE_SHOP,
    }))

    return (
        <Section tone={tone} tight bleed aria-labelledby="pantry-title" className="overflow-hidden">
            <div className="ef-container mb-2 flex items-center justify-between gap-4">
                <h2 id="pantry-title" className="ef-eyebrow">Straight from our pantry</h2>

                {!reduced && (
                    <div className="flex items-center gap-3">
                        <span className="hidden text-[0.8125rem] text-ink-muted md:inline">Drag to explore</span>
                        <button
                            type="button"
                            className="ef-icon-btn"
                            onClick={() => setPaused((p) => !p)}
                            aria-label={paused ? 'Play product marquee' : 'Pause product marquee'}
                        >
                            {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                        </button>
                    </div>
                )}
            </div>

            <Marquee variant="showcase" items={items} label="Shop by product" speed={1.2} paused={paused} />
        </Section>
    )
}

export default PantryMarquee
