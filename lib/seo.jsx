// Shared SEO primitives: the canonical origin, display-name clean-up for
// catalogue data typed in the admin, meta-description trimming, and safe
// JSON-LD serialisation. Every public route builds its head from these so
// titles, descriptions and structured data stay consistent.

export const SITE_URL = 'https://www.energyflow.in'
export const SITE_NAME = 'Energyflow'

export const absoluteUrl = (path = '/') =>
    path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`

// The root layout appends " | Energyflow" (13 characters). Google shows
// roughly 60 characters of a title, so a keyword title that is already long
// drops the suffix rather than having its keywords truncated.
export const pageTitle = (title) => (title.length <= 47 ? title : { absolute: title })

// Short words that stay lower-case inside a title-cased name.
const MINOR_WORDS = new Set(['and', 'or', 'of', 'with', 'in', 'the', 'a', 'an', 'for', 'to'])

const titleCaseWord = (word, index) => {
    if (!word) return word
    const lower = word.toLowerCase()
    if (index > 0 && MINOR_WORDS.has(lower)) return lower
    // Pack sizes and units ("200g", "1kg", "240") keep their lower-case unit.
    if (/^\d/.test(word)) return lower
    return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Product names are entered by hand and arrive as "CHIA  SEED" or
// "FRUIT-NUT-MUESLI". Shouting names read as spam in search results, so any
// name written entirely in capitals is title-cased; mixed-case names are the
// admin's deliberate choice and are only whitespace-normalised.
export const formatProductName = (name) => {
    const clean = String(name ?? '').replace(/\s+/g, ' ').trim()
    if (!clean) return ''
    const letters = clean.replace(/[^a-z]/gi, '')
    if (!letters || letters !== letters.toUpperCase()) return clean
    return clean
        .split(' ')
        .map((word, index) => word.split('-').map((part, i) => titleCaseWord(part, index + i)).join('-'))
        .join(' ')
}

// Category names carry stray leading spaces (" Millets & Grains").
export const formatCategoryName = (name) => String(name ?? '').replace(/\s+/g, ' ').trim()

// Trim to a search-snippet length on a word boundary, never mid-word, and end
// on a full stop so the snippet reads as a sentence.
export const toMetaDescription = (text, max = 155) => {
    const clean = String(text ?? '').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim()
    if (clean.length <= max) return clean
    const cut = clean.slice(0, max + 1)
    const sentenceEnd = cut.lastIndexOf('. ')
    if (sentenceEnd > max * 0.6) return cut.slice(0, sentenceEnd + 1)
    const wordEnd = cut.lastIndexOf(' ')
    return `${cut.slice(0, wordEnd > 0 ? wordEnd : max).replace(/[,;:\-–—\s]+$/, '')}…`
}

// JSON.stringify leaves "</script>" intact, and product copy is admin-authored
// HTML, so escape "<" before the payload goes into a <script> tag.
export const serializeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')

export const breadcrumbSchema = (items) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
})

export const faqSchema = (faqs = []) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
})

// Store-wide policies, stated once so product offers and the organisation
// schema describe the same shipping and returns the product page shows.
export const RETURN_POLICY = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'IN',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 7,
    returnMethod: 'https://schema.org/ReturnByMail',
}

export const SHIPPING_DETAILS = {
    '@type': 'OfferShippingDetails',
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
    shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'INR' },
    deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'DAY' },
    },
}

// Pages whose LCP is a product photo open the Cloudinary connection early.
// The root layout only dns-prefetches it, because the homepage LCP is local.
// React 19 hoists this <link> into <head>.
export const CloudinaryPreconnect = () => <link rel="preconnect" href="https://res.cloudinary.com" />

export const JsonLd = ({ data }) => (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
)
