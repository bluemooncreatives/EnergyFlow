import dynamic from 'next/dynamic'
import { getCategoryLanding } from '@/lib/services/shopService'
import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'

// GSAP-driven client logic in its own chunk, like the other home sections.
const GiftBoxesShowcase = dynamic(() => import('./GiftBoxesShowcase'))

const GIFT_SLUG = 'gift-boxes'
const MAX_BOXES = 4

const priceOf = (product) => Number(product?.defaultVariant?.sellingPrice ?? product?.sellingPrice) || 0

// "The gifting edit": gift boxes are one of the store's biggest sellers, so
// they get their own band on the homepage. Live from the Gift Boxes category
// (cached with the category page); most premium box first, so the featured
// tile is the showpiece. Renders nothing when the category has no boxes.
const GiftBoxesSection = async ({ tone = 'inverse' }) => {
    const landing = await getCategoryLanding(GIFT_SLUG).catch(() => null)
    const products = (landing?.products || [])
        .filter((product) => product?.slug)
        .sort((a, b) => priceOf(b) - priceOf(a))
    if (!products.length) return null

    const prices = products.map(priceOf).filter((price) => price > 0)

    return (
        <GiftBoxesShowcase
            tone={tone}
            products={products.slice(0, MAX_BOXES)}
            total={landing?.total || products.length}
            fromPrice={prices.length ? Math.min(...prices) : null}
            categoryHref={WEBSITE_CATEGORY(landing?.category?.slug || GIFT_SLUG)}
        />
    )
}

export default GiftBoxesSection
