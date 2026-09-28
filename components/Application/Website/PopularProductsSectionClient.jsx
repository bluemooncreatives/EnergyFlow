'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import SectionHeader from './storefront/SectionHeader'
import ProductCard from './storefront/ProductCard'
import { StoreLink } from './storefront/StoreButton'
import { rowTrimClass } from './storefront/format'

// Each banner carries its own scrim: enough ivory behind the copy to keep it
// (the ivory is fixed, so the copy on it is pinned to palette pine in both themes)
// legible, faded out by ~60% so the photograph itself stays contrasty. A banner
// opens the shop filtered to its `category`, or the whole shop while that
// category has no products (same rule as the hero's links).
const PROMO_BANNERS = [
    {
        title: 'Fruit Jellies',
        image: '/assets/images/banner/fruit-jellies.jpg',
        alt: 'Assorted real-fruit jelly cubes surrounded by fresh fruit',
        discount: '30%',
        category: 'healthy-candies-and-sweets',
        scrim: 'linear-gradient(90deg, rgb(251 248 242 / 0.94) 0%, rgb(251 248 242 / 0.55) 34%, transparent 62%)',
    },
    {
        title: 'Dry Fruits & Nuts',
        image: '/assets/images/banner/dry-fruits.jpg',
        alt: 'Almonds, cashews, walnuts and pecans on a warm background',
        discount: '25%',
        category: 'dry-fruits-and-nuts',
        scrim: 'linear-gradient(90deg, rgb(251 248 242 / 0.75) 0%, rgb(251 248 242 / 0.25) 30%, transparent 55%)',
    },
]

const bannerHref = (banner, availability) =>
    !availability || availability.categories?.includes(banner.category)
        ? `${WEBSITE_SHOP}?category=${banner.category}`
        : WEBSITE_SHOP

const PromoBanner = ({ banner, availability }) => (
    <Link
        href={bannerHref(banner, availability)}
        data-reveal
        className="ef-tile ef-focus group/promo relative flex min-h-[13.5rem] items-center sm:min-h-[15rem]"
    >
        <Image
            src={banner.image}
            alt={banner.alt}
            fill
            quality={82}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="-z-10 object-cover transition-transform duration-700 ease-out group-hover/promo:scale-[1.04] motion-reduce:transition-none"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: banner.scrim }} />

        <span className="flex max-w-[65%] flex-col items-start gap-3 p-6 sm:p-8">
            <span className="ef-badge ef-badge--sale">Up to {banner.discount} off</span>
            <span className="font-header text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] font-semibold uppercase leading-[1] text-[var(--palette-pine)]">
                {banner.title}
            </span>
            <span className="ef-btn ef-btn--pine ef-btn--sm mt-1">
                Shop now <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
            </span>
        </span>
    </Link>
)

const PopularProductsSectionClient = ({ products = [], tone = 'page', availability = null }) => {
    const sectionRef = useRef(null)
    useReveal(sectionRef, [products.length])

    return (
        <Section ref={sectionRef} tone={tone} aria-labelledby={products.length ? 'popular-title' : undefined}>
            {/* ── Promo banners ── */}
            <div className="grid gap-[var(--grid-gap)] md:grid-cols-2">
                {PROMO_BANNERS.map((banner) => (
                    <PromoBanner key={banner.title} banner={banner} availability={availability} />
                ))}
            </div>

            {/* ── Popular products ── */}
            {products.length > 0 && (
                <div className="mt-[var(--section-space)]">
                    <SectionHeader
                        id="popular-title"
                        eyebrow="Loved by our customers"
                        title="Popular"
                        accent="right now"
                        action={<StoreLink href={WEBSITE_SHOP}>View all products</StoreLink>}
                    />

                    <ul className="grid list-none grid-cols-2 gap-[var(--grid-gap)] p-0 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {products.map((product, i) => (
                            <li key={product._id} data-reveal className={`min-w-0 ${rowTrimClass(i, products.length)}`}>
                                <ProductCard product={product} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Section>
    )
}

export default PopularProductsSectionClient
