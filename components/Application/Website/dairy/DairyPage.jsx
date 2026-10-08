import Link from 'next/link'
import { JsonLd, absoluteUrl, breadcrumbSchema, faqSchema, formatProductName } from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Marquee from '../storefront/Marquee'
import DairyCta from './DairyCta'
import DairyFaq from './DairyFaq'
import DairyHero from './DairyHero'
import DairyKitchen from './DairyKitchen'
import DairyKnowledge from './DairyKnowledge'
import DairyRange from './DairyRange'
import DairyReveal from './DairyReveal'
import { DAIRY_TICKER } from './dairyContent'

/**
 * The dairy aisle (/category/dairy-products), in the gifting page's design
 * language:
 *
 *   hero → ticker → the products → know your dairy (topic tabs) →
 *   dairy in the kitchen → FAQs → related aisles → closing banner
 *
 * The products come from the catalogue; the copy lives in dairyContent.js
 * and the FAQs in catalogSeo (they also feed the FAQ schema). Numbered
 * sections renumber themselves when the aisle is empty.
 *
 * landing — from getCategoryLanding(): { category, cover, name, products, total }
 * seo     — the category's catalogSeo entry
 * related — [{ slug, name }] sibling aisles to cross-link
 */
const DairyPage = ({ landing, seo, related = [] }) => {
    const { category, cover = null, name, products = [], total = 0 } = landing
    const path = WEBSITE_CATEGORY(category.slug)
    const shopHref = `${WEBSITE_SHOP}?category=${encodeURIComponent(category.slug)}`
    const faqs = seo?.faqs || []

    // First photo of each product, for the hero collage and the banner.
    const photos = products
        .map((product) => {
            const media = product.media?.find((m) => m?.secure_url)
            return media ? { src: media.secure_url, alt: media.alt || formatProductName(product.name) } : null
        })
        .filter(Boolean)

    const order = [products.length > 0 && 'range', 'guide', 'kitchen', faqs.length > 0 && 'faq'].filter(Boolean)
    const numberOf = (key) => order.indexOf(key) + 1

    const collectionSchema = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: seo.h1,
        description: seo.description,
        url: absoluteUrl(path),
        isPartOf: { '@type': 'WebSite', name: 'Energyflow', url: absoluteUrl('/') },
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: total,
            itemListElement: products.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: absoluteUrl(WEBSITE_PRODUCT_DETAILS(product)),
                name: formatProductName(product.name),
            })),
        },
    }

    return (
        <DairyReveal>
            <JsonLd data={collectionSchema} />
            <JsonLd data={breadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Shop', path: WEBSITE_SHOP },
                { name, path },
            ])} />
            {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}

            <DairyHero title={seo.h1 || name} cover={cover} photos={photos} total={total} />

            <section aria-label="Dairy highlights" className="relative overflow-hidden bg-sun py-4 text-sun-ink sm:py-5">
                <Marquee items={DAIRY_TICKER.map((label) => ({ label }))} label="Dairy highlights" separator="dot" />
            </section>

            <DairyRange products={products} total={total} shopHref={shopHref} number={numberOf('range')} />
            <DairyKnowledge number={numberOf('guide')} />
            <DairyKitchen number={numberOf('kitchen')} />
            <DairyFaq faqs={faqs} number={numberOf('faq')} />

            {related.length > 0 && (
                <section className="ef-section ef-section--page ef-section--tight !pb-0">
                    <nav aria-label="Related categories" className="ef-container flex flex-col gap-4">
                        <h2 className="ef-title ef-title--md">Explore more of the pantry</h2>
                        <ul className="flex flex-wrap gap-3">
                            {related.map((item) => (
                                <li key={item.slug}>
                                    <Link
                                        href={WEBSITE_CATEGORY(item.slug)}
                                        className="ef-focus inline-flex rounded-full border border-line-soft px-4 py-2 text-[0.875rem] text-ink-strong transition-colors hover:border-brand hover:text-brand"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </section>
            )}

            <DairyCta photo={cover || photos[0] || null} />
        </DairyReveal>
    )
}

export default DairyPage
