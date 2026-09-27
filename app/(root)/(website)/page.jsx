import dynamic from 'next/dynamic'
import HeroSection from '@/components/Application/Website/HeroSection'
import LazyHydrate from '@/components/Application/LazyHydrate'
import BestsellersSection from '@/components/Application/Website/BestsellersSection'
// Async server components (fetch their own data): imported directly so they run
// on the server, like BestsellersSection. Each code-splits its own client chunk.
import CategoryArchiveSection from '@/components/Application/Website/CategoryArchiveSection'
import PopularProductsSection from '@/components/Application/Website/PopularProductsSection'
import DailyBestSellsSection from '@/components/Application/Website/DailyBestSellsSection'
import Testimonial from '@/components/Application/Website/Testimonial'
import { getStorefrontAvailability } from '@/lib/services/categoryService'

// Defer all GSAP/ScrollTrigger and media-heavy sections into separate JS chunks
// so they don't block parsing and hydration of the above-fold critical path.
const Marquee = dynamic(() => import('@/components/Application/Website/Marquee'))
const SignatureRangeSection = dynamic(() => import('@/components/Application/Website/SignatureRangeSection'))
const AboutUsSection = dynamic(() => import('@/components/Application/Website/AboutUsSection'))
const EditorialCardsSection = dynamic(() => import('@/components/Application/Website/EditorialCardsSection'))
const BenefitsSection = dynamic(() => import('@/components/Application/Website/BenefitsSection'))
const FAQSection = dynamic(() => import('@/components/Application/Website/FAQSection'))

const HOME_DESCRIPTION =
    'Shop premium dry fruits, nuts, seeds and super foods at Energyflow. Almonds, cashews, walnuts, pistachios, chia and pumpkin seeds, roasted healthy snacks, millets, muesli, berries, cold pressed oils, A2 Gir cow bilona ghee, herbal powders and honey. Freshly sourced, quality checked and delivered across India.'

export const metadata = {
    title: 'Buy Premium Dry Fruits, Nuts, Seeds & Super Foods Online',
    description: HOME_DESCRIPTION,
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Energyflow | Premium Dry Fruits, Nuts, Seeds & Super Foods',
        description: HOME_DESCRIPTION,
        url: '/',
    },
    twitter: {
        title: 'Energyflow | Premium Dry Fruits, Nuts, Seeds & Super Foods',
        description: HOME_DESCRIPTION,
    },
}

// Declares the site's internal search endpoint so Google can render a sitelinks
// search box against the brand result. The homepage is the only correct place
// for it — repeating it per page is treated as spam.
const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Energyflow',
    url: 'https://www.energyflow.com',
    description: HOME_DESCRIPTION,
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.energyflow.com/shop?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
    },
}

const Home = async () => {
    // Which categories / spotlight terms have stock, so hero and signature CTAs
    // never lead to an empty page. A failed lookup leaves links as authored.
    const availability = await getStorefrontAvailability().catch(() => null)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
            <section>
                <HeroSection availability={availability} />
            </section>
            {/* The hero is 100svh, so everything below is below the fold.
                LazyHydrate keeps each section's server HTML in the document but
                defers its hydration until the user scrolls near it, so the
                initial load only hydrates the hero + header. */}
            <Marquee text="freshly arrived" repeatCount={12} />

            {/* Order follows the storefront flow: signature lines (ghee, oils,
                gift chocolates) → browse by category → products → deals →
                trust band → bestsellers → story → social proof → help.
                Section tones alternate page / sunken; data-driven sections
                that render nothing simply drop out of the rhythm. */}
            <LazyHydrate>
                <SignatureRangeSection availability={availability} />
            </LazyHydrate>

            <LazyHydrate>
                <CategoryArchiveSection />
            </LazyHydrate>

            <LazyHydrate>
                <PopularProductsSection />
            </LazyHydrate>

            <LazyHydrate>
                <DailyBestSellsSection />
            </LazyHydrate>

            <LazyHydrate>
                <BenefitsSection />
            </LazyHydrate>

            <LazyHydrate>
                <BestsellersSection />
            </LazyHydrate>

            <LazyHydrate>
                <AboutUsSection />
            </LazyHydrate>

            <LazyHydrate>
                <Testimonial />
            </LazyHydrate>

            <LazyHydrate>
                <EditorialCardsSection />
            </LazyHydrate>

            <LazyHydrate>
                <FAQSection />
            </LazyHydrate>
        </>
    )
}

export default Home
