import { Building2 } from 'lucide-react'
import { mergeGiftPage } from '@/lib/pageContent/giftPage'
import { JsonLd, absoluteUrl, breadcrumbSchema, faqSchema, formatProductName } from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import StoreButton from '../storefront/StoreButton'
import GiftCollectionIndex from './GiftCollectionIndex'
import GiftCtaBanner from './GiftCtaBanner'
import GiftEnquiryForm from './GiftEnquiryForm'
import GiftFaq from './GiftFaq'
import GiftOccasionsBand from './GiftOccasionsBand'
import GiftProcessSchedule from './GiftProcessSchedule'
import GiftPromiseCards from './GiftPromiseCards'
import GiftTestimonials from './GiftTestimonials'
import GiftTicker from './GiftTicker'
import GiftWordmarkHero from './GiftWordmarkHero'
import { EnquireButton, GiftingSelectionProvider } from './GiftingSelection'
import { SectionTag, photoOf } from './GiftingUi'

// Shown in place of the collection while no gift box is stocked: the page
// still works as a corporate enquiry page.
const CuratingSoon = ({ number, eyebrow }) => (
    <section className="ef-section ef-section--page" aria-labelledby="curating-title">
        <div className="ef-container">
            <div className="ef-card mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-14 text-center">
                <SectionTag number={number} eyebrow={eyebrow} />
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
 * The gift boxes category page, rendered at both /category/gift-boxes
 * (canonical) and /shop?category=gift-boxes. Built on the storefront design
 * system; the layouts follow the gifting references section by section:
 *
 *   wordmark hero → pine ticker → the collection index → occasions band →
 *   promise cards → how bulk orders work → testimonials → the enquiry form →
 *   FAQs → closing banner
 *
 * Copy, lists and photos come from Admin → Pages → Gift boxes (`content`,
 * merged over the designed defaults); the boxes come from the catalogue.
 * Every section that would be empty steps aside, and the numbered sections
 * renumber themselves around it.
 *
 * collection — from getGiftingCollection(): { category, products }
 * seo        — the category's catalogSeo entry (h1, eyebrow, description, faqs)
 * content    — from getGiftPageContent(), or null for the defaults
 */
const CorporateGiftingPage = ({ collection, seo, content }) => {
    const page = content || mergeGiftPage(null)
    const products = collection?.products || []
    const photos = products.map(photoOf).filter(Boolean)
    const path = WEBSITE_CATEGORY(collection?.category?.slug || 'gift-boxes')

    // The admin's questions when there are any, else the category's own.
    const faqs = page.faq.items.length
        ? page.faq.items.map(({ question, answer }) => ({ q: question, a: answer }))
        : seo?.faqs || []

    const show = {
        occasions: page.occasions.enabled && page.occasions.items.some((item) => item.title),
        promise: page.promise.enabled && page.promise.items.some((item) => item.title),
        process: page.process.enabled && page.process.items.some((item) => item.title),
        testimonials: page.testimonials.enabled && page.testimonials.items.some((item) => item.quote && item.name),
        faq: page.faq.enabled && faqs.length > 0,
    }
    const order = ['collection', 'occasions', 'promise', 'process', 'testimonials', 'enquiry', 'faq']
        .filter((key) => show[key] !== false)
    const numberOf = (key) => order.indexOf(key) + 1

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
            {show.faq && <JsonLd data={faqSchema(faqs)} />}

            <GiftWordmarkHero hero={page.hero} products={products} photos={photos} />
            {page.ticker.enabled && <GiftTicker items={page.ticker.items} />}

            {products.length > 0
                ? <GiftCollectionIndex products={products} content={page.collection} number={numberOf('collection')} />
                : <CuratingSoon number={numberOf('collection')} eyebrow={page.collection.eyebrow} />}

            {show.occasions && <GiftOccasionsBand content={page.occasions} photos={photos} number={numberOf('occasions')} />}
            {show.promise && <GiftPromiseCards content={page.promise} photos={photos} number={numberOf('promise')} />}
            {show.process && <GiftProcessSchedule content={page.process} photos={photos} number={numberOf('process')} />}
            {show.testimonials && <GiftTestimonials content={page.testimonials} photos={photos} number={numberOf('testimonials')} />}
            <GiftEnquiryForm products={products} content={page.enquiry} number={numberOf('enquiry')} />
            {show.faq && <GiftFaq content={page.faq} faqs={faqs} number={numberOf('faq')} />}
            {page.cta.enabled && <GiftCtaBanner content={page.cta} photos={photos} />}
        </GiftingSelectionProvider>
    )
}

export default CorporateGiftingPage
