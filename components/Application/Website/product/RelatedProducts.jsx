'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductBox from '@/components/Application/Website/ProductBox'
import RailControls from '@/components/Application/Website/storefront/RailControls'
import RailPager from '@/components/Application/Website/storefront/RailPager'
import { useScrollRail } from '@/hooks/useScrollRail'
import { useReveal } from '@/hooks/useReveal'
import { WEBSITE_CATEGORY, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// "You may also like" as a swipeable rail with arrow controls (hidden when
// every card already fits). Renders nothing without products. It hydrates
// late (LazyHydrate), so it runs its own scroll reveal.
const RelatedProducts = ({ products, category }) => {
    const rail = useScrollRail({ nudge: 'related' })
    const scopeRef = useRef(null)
    useReveal(scopeRef)
    if (!products?.length) return null

    const moreHref = category?.slug ? WEBSITE_CATEGORY(category.slug) : WEBSITE_SHOP
    const moreLabel = category?.name ? `More ${category.name}` : 'Shop everything'

    return (
        <section ref={scopeRef} aria-labelledby="related-title" className="ef-section">
            <div className="ef-container">
                <div className="mb-[var(--section-gap)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div data-reveal className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">Curated for you</span>
                        <h2 id="related-title" className="ef-title ef-title--md">
                            You may <span className="ef-title__accent">also like</span>
                        </h2>
                    </div>
                    <div data-reveal className="flex items-center gap-3">
                        <Link href={moreHref} className="ef-cta">
                            {moreLabel}
                            <span className="ef-cta__box"><ArrowRight aria-hidden="true" /></span>
                        </Link>
                        <RailControls rail={rail} label="products" className="hidden md:flex" />
                    </div>
                </div>

                <ul
                    ref={rail.railRef}
                    className="ef-rail m-0 list-none p-0"
                    style={{ '--rail-item': 'clamp(12rem, 46vw, 18.5rem)' }}
                    aria-label="Related products"
                >
                    {products.map((item) => (
                        <li key={item._id} data-reveal className="h-full">
                            <ProductBox product={item} />
                        </li>
                    ))}
                </ul>

                {/* Below md the heading arrows are hidden: position + arrows
                    under the rail instead (mt clears its shadow margin). */}
                <RailPager rail={rail} label="products" className="mt-9 md:hidden" />
            </div>
        </section>
    )
}

export default RelatedProducts
