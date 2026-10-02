import { Building2 } from 'lucide-react'
import { JsonLd, absoluteUrl, breadcrumbSchema, formatProductName } from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import StoreButton from '../storefront/StoreButton'
import GiftCollection from './GiftCollection'
import GiftEnquiryForm from './GiftEnquiryForm'
import GiftingHero from './GiftingHero'
import GiftingPromise from './GiftingPromise'
import { EnquireButton, GiftingSelectionProvider } from './GiftingSelection'
import OccasionMarquee from './OccasionMarquee'

// Shown in place of the collection while no gift box is stocked: the page
// still works as a corporate enquiry page.
const CuratingSoon = () => (
    <section className="ef-section ef-section--page" aria-labelledby="curating-title">
        <div className="ef-container">
            <div className="ef-card mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-14 text-center">
                <span className="ef-seal ef-seal--sun !size-16"><Building2 aria-hidden="true" /></span>
                <h2 id="curating-title" className="ef-title ef-title--md">New gift boxes are on their way</h2>
                <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink-body">
                    We&apos;re curating this season&apos;s collection. Share your brief and we&apos;ll build a box for your
                    budget, or browse the rest of the pantry.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    <EnquireButton className="ef-btn ef-btn--primary">Share your brief</EnquireButton>
                    <StoreButton href={WEBSITE_SHOP} variant="outline" arrow>Browse the shop</StoreButton>
                </div>
            </div>
        </div>
    </section>
)

/**
 * The corporate gifting experience for the gift-boxes category, rendered at
 * both /category/gift-boxes (canonical) and /shop?category=gift-boxes.
 *
 * collection — from getGiftingCollection(): { category, products }
 * seo        — the category's catalogSeo entry (name and description)
 */
const CorporateGiftingPage = ({ collection, seo }) => {
    const products = collection?.products || []
    const path = WEBSITE_CATEGORY(collection?.category?.slug || 'gift-boxes')

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: seo?.h1 || 'Dry Fruit Gift Boxes & Corporate Gifting',
        description: seo?.description,
        url: absoluteUrl(path),
        isPartOf: { '@type': 'WebSite', name: 'Energyflow', url: absoluteUrl('/') },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: products.length,
            itemListElement: products.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: absoluteUrl(WEBSITE_PRODUCT_DETAILS(product)),
                name: formatProductName(product.name),
            })),
        },
    }

    return (
        <GiftingSelectionProvider>
            <JsonLd data={collectionSchema} />
            <JsonLd data={breadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Shop', path: WEBSITE_SHOP },
                { name: collection?.category?.name || 'Gift Boxes', path },
            ])} />

            <GiftingHero products={products} />
            <OccasionMarquee />
            {products.length > 0 ? <GiftCollection products={products} /> : <CuratingSoon />}
            <GiftingPromise />
            <GiftEnquiryForm products={products} />
        </GiftingSelectionProvider>
    )
}

export default CorporateGiftingPage
