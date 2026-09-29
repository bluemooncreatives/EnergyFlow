import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import PageHero from '@/components/Application/Website/storefront/PageHero'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import ProductBox from '@/components/Application/Website/ProductBox'
import { getCategoryLanding, getShopFilters } from '@/lib/services/shopService'
import { getCategorySeo } from '@/lib/catalogSeo'
import {
    CloudinaryPreconnect,
    JsonLd,
    absoluteUrl,
    breadcrumbSchema,
    faqSchema,
    formatCategoryName,
    formatProductName,
    pageTitle,
} from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const loadCategory = async (slug) => {
    const landing = await getCategoryLanding(slug).catch(() => null)
    if (!landing) return null
    const name = formatCategoryName(landing.category.name)
    return { ...landing, name, seo: getCategorySeo(landing.category.slug, name) }
}

export async function generateMetadata({ params }) {
    const { slug } = await params
    const landing = await loadCategory(slug)
    if (!landing) return { title: 'Category not found', robots: { index: false } }

    const { seo, total, products } = landing
    const path = WEBSITE_CATEGORY(landing.category.slug)
    const image = products.find((product) => product.media?.[0]?.secure_url)?.media[0].secure_url

    return {
        title: pageTitle(seo.title),
        description: seo.description,
        alternates: { canonical: path },
        // An empty aisle is thin content: keep it out of the index until it
        // is stocked, but let crawlers follow its links.
        ...(total > 0 ? {} : { robots: { index: false, follow: true } }),
        openGraph: {
            title: `${seo.title} | Energyflow`,
            description: seo.description,
            url: path,
            ...(image ? { images: [{ url: image, alt: seo.h1 }] } : {}),
        },
        twitter: {
            title: `${seo.title} | Energyflow`,
            description: seo.description,
            ...(image ? { images: [image] } : {}),
        },
    }
}

const CategoryPage = async ({ params }) => {
    const { slug } = await params
    if (slug !== slug.toLowerCase()) permanentRedirect(WEBSITE_CATEGORY(slug.toLowerCase()))
    const [landing, filters] = await Promise.all([
        loadCategory(slug),
        getShopFilters().catch(() => ({ categories: [] })),
    ])
    if (!landing) notFound()

    const { category, name, seo, products, total } = landing
    const path = WEBSITE_CATEGORY(category.slug)
    const shopHref = `${WEBSITE_SHOP}?category=${encodeURIComponent(category.slug)}`

    const categoryBySlug = new Map((filters?.categories || []).map((c) => [c.slug, formatCategoryName(c.name)]))
    const related = (seo.related || [])
        .filter((relatedSlug) => relatedSlug !== category.slug && categoryBySlug.has(relatedSlug))
        .map((relatedSlug) => ({ slug: relatedSlug, name: categoryBySlug.get(relatedSlug) }))

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
        <>
            <CloudinaryPreconnect />
            <JsonLd data={collectionSchema} />
            <JsonLd data={breadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Shop', path: WEBSITE_SHOP },
                { name, path },
            ])} />
            {seo.faqs?.length > 0 && <JsonLd data={faqSchema(seo.faqs)} />}

            <PageHero
                title={seo.h1}
                eyebrow={seo.eyebrow}
                description={seo.intro[0]}
                links={[{ label: 'Shop', href: WEBSITE_SHOP }, { label: name }]}
            >
                <StoreButton href={shopHref} variant="outline">Filter &amp; sort</StoreButton>
            </PageHero>

            <section className="ef-section ef-section--page ef-section--tight">
                <div className="ef-container">
                    {seo.intro.slice(1).map((paragraph) => (
                        <p key={paragraph} className="max-w-3xl text-[0.9375rem] leading-[1.8] text-ink-body">{paragraph}</p>
                    ))}

                    {products.length > 0 ? (
                        <>
                            <h2 className="sr-only">{name} products</h2>
                            <p className="mt-6 text-[0.8125rem] text-ink-muted">
                                {total} {total === 1 ? 'product' : 'products'} in {name}
                            </p>
                            <div className="grid grid-cols-2 gap-[var(--grid-gap)] pt-4 md:grid-cols-3 lg:grid-cols-4">
                                {products.map((product, index) => (
                                    <ProductBox key={product._id} product={product} priority={index < 2} />
                                ))}
                            </div>
                            {total > products.length && (
                                <div className="mt-8 flex justify-center">
                                    <StoreButton href={shopHref} arrow>View all {total} products</StoreButton>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="ef-card mt-6 flex flex-col items-center gap-4 px-6 py-14 text-center">
                            <h2 className="text-2xl font-medium text-ink-strong">Coming soon to the pantry</h2>
                            <p className="max-w-md text-[0.9375rem] leading-relaxed text-ink-body">
                                We are stocking this aisle right now. Browse the full range, or ask us about bulk and gifting orders.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <StoreButton href={WEBSITE_SHOP} arrow>Browse everything</StoreButton>
                                <StoreButton href="/contact" variant="outline">Ask about it</StoreButton>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {(seo.sections?.length > 0 || seo.faqs?.length > 0) && (
                <section className="ef-section ef-section--sunken">
                    <div className="ef-container grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
                        {seo.sections?.length > 0 && (
                            <div className="flex flex-col gap-10">
                                {seo.sections.map((section) => (
                                    <article key={section.heading} className="flex flex-col gap-3">
                                        <h2 className="ef-title ef-title--md">{section.heading}</h2>
                                        {section.body.map((paragraph) => (
                                            <p key={paragraph} className="text-[0.9375rem] leading-[1.8] text-ink-body">{paragraph}</p>
                                        ))}
                                    </article>
                                ))}
                            </div>
                        )}

                        {seo.faqs?.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h2 className="ef-title ef-title--md">{name}: frequently asked</h2>
                                <div className="flex flex-col gap-3">
                                    {seo.faqs.map(({ q, a }) => (
                                        <details key={q} className="ef-card group px-5 py-4">
                                            <summary className="ef-focus flex cursor-pointer list-none items-start justify-between gap-4 rounded-sm text-[0.9375rem] font-medium text-ink-strong [&::-webkit-details-marker]:hidden">
                                                <h3>{q}</h3>
                                                <ChevronDown className="mt-0.5 size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                                            </summary>
                                            <p className="mt-3 text-[0.9375rem] leading-[1.75] text-ink-body">{a}</p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {related.length > 0 && (
                <section className="ef-section ef-section--page ef-section--tight">
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
        </>
    )
}

export default CategoryPage
