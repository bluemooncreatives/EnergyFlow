'use client'

import { useRef } from 'react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import { useScrollRail } from '@/hooks/useScrollRail'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import ProductCard from './storefront/ProductCard'
import RailControls from './storefront/RailControls'
import { StoreLink } from './storefront/StoreButton'

const BestsellersSectionClient = ({ products = [] }) => {
    const sectionRef = useRef(null)
    const rail = useScrollRail()
    useReveal(sectionRef, [products.length])

    if (!products.length) return null

    return (
        <Section ref={sectionRef} aria-labelledby="bestsellers-title">
            <SectionHeader
                id="bestsellers-title"
                eyebrow="Most reordered"
                title="Our"
                accent="bestsellers"
                action={
                    <>
                        <StoreLink href={`${WEBSITE_SHOP}?bestseller=true`} className="mr-2">Shop bestsellers</StoreLink>
                        <RailControls rail={rail} label="bestsellers" className="hidden sm:flex" />
                    </>
                }
            />

            {/* Native scroller: swipe on touch, arrows on desktop, snap on both.
                On small screens it bleeds to the viewport edge so the next card
                peeks in and signals there is more. */}
            <ul
                ref={rail.railRef}
                className="ef-rail list-none p-0 max-sm:-mx-[var(--website-gutter)] max-sm:px-[var(--website-gutter)] max-sm:scroll-px-[var(--website-gutter)]"
                style={{ '--rail-item': 'clamp(11rem, 44vw, 17rem)' }}
                aria-label="Bestselling products"
            >
                {products.map((product) => (
                    <li key={product._id} data-reveal className="min-w-0">
                        <ProductCard product={product} sizes="(max-width: 640px) 45vw, 272px" />
                    </li>
                ))}
            </ul>
        </Section>
    )
}

export default BestsellersSectionClient
