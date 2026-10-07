'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import ProductBox from '@/components/Application/Website/ProductBox'
import RailControls from '@/components/Application/Website/storefront/RailControls'
import Section from '@/components/Application/Website/storefront/Section'
import { useScrollRail } from '@/hooks/useScrollRail'
import { cn } from '@/lib/utils'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { ABOUT_TITLE } from './AboutUi'

/**
 * "You may also like", after the "Summertime" reference's closing band: a
 * pine section with the pill and a small count on the left, the headline
 * set large on the right with the arrows under it, then a row of product
 * cards that scrolls sideways.
 */
const AboutRelated = ({ content, products = [] }) => {
    const rail = useScrollRail()
    if (!products.length) return null

    return (
        <Section tone="inverse" className="overflow-hidden" aria-labelledby="related-title">
            <div className="ef-on-inverse grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10" data-reveal>
                <div className="flex flex-col items-start justify-between gap-6">
                    {content.eyebrow && <span className="ef-eyebrow">{content.eyebrow}</span>}
                    <p className="m-0 font-header text-[1.0625rem] font-medium leading-snug text-cream/80 max-lg:hidden">
                        {products.length} bestsellers,
                        <br />
                        picked from the shelf
                    </p>
                </div>
                <div className="flex flex-col items-start gap-6">
                    <h2 id="related-title" className={cn(ABOUT_TITLE, 'text-cream')}>
                        {content.title}
                        {content.titleAccent && <> <span className="text-sun">{content.titleAccent}</span></>}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <RailControls rail={rail} label="products" />
                        <Link href={WEBSITE_SHOP} className="ef-btn ef-btn--ghost-light">
                            Shop all <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>

            <ul
                ref={rail.railRef}
                className="ef-rail m-0 mt-[clamp(1.75rem,3.5vw,3rem)] list-none p-0"
                style={{ '--rail-item': 'clamp(15rem, 62vw, 19rem)' }}
                aria-label="Bestsellers"
            >
                {products.map((product) => (
                    <li key={product._id} className="min-w-0">
                        <ProductBox product={product} />
                    </li>
                ))}
            </ul>
        </Section>
    )
}

export default AboutRelated
