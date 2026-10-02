import dynamic from 'next/dynamic'
import { getCategoryLanding } from '@/lib/services/shopService'
import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import { connectDB } from '@/lib/databaseConnection'
import { htmlToText } from '@/lib/utils'
import ProductModel from '@/models/Product.model'

// Interactive client logic in its own chunk, like the other home sections.
const GiftBoxesShowcase = dynamic(() => import('./GiftBoxesShowcase'))

const GIFT_SLUG = 'gift-boxes'
const MAX_BOXES = 4

// The first sentence of each box's description, as its one-line tagline on
// the stage. The category listing doesn't carry descriptions, so they are read
// here; a failed read just means no taglines.
const firstSentence = (html) => {
    const text = htmlToText(html)
    const match = text.match(/^.{20,220}?[.!?](?=\s|$)/)
    return (match ? match[0] : text.slice(0, 180)).trim()
}

const loadTaglines = async (ids) => {
    try {
        await connectDB()
        const rows = await ProductModel.find({ _id: { $in: ids }, deletedAt: null }).select('description').lean()
        return new Map(rows.map((row) => [String(row._id), firstSentence(row.description)]))
    } catch {
        return new Map()
    }
}

const priceOf = (product) => Number(product?.defaultVariant?.sellingPrice ?? product?.sellingPrice) || 0

// "Gifts worth unboxing": gift boxes are one of the store's biggest sellers,
// so they get their own spotlight on the homepage. Live from the Gift Boxes
// category (cached with the category page); most premium box first, so the
// stage opens on the showpiece. Renders nothing when there are no boxes.
const GiftBoxesSection = async ({ tone = 'page' }) => {
    const landing = await getCategoryLanding(GIFT_SLUG).catch(() => null)
    const products = (landing?.products || [])
        .filter((product) => product?.slug)
        .sort((a, b) => priceOf(b) - priceOf(a))
    if (!products.length) return null

    const prices = products.map(priceOf).filter((price) => price > 0)
    const boxes = products.slice(0, MAX_BOXES)
    const taglines = await loadTaglines(boxes.map((product) => product._id))

    return (
        <GiftBoxesShowcase
            tone={tone}
            products={boxes.map((product) => ({ ...product, tagline: taglines.get(String(product._id)) || '' }))}
            total={landing?.total || products.length}
            fromPrice={prices.length ? Math.min(...prices) : null}
            categoryHref={WEBSITE_CATEGORY(landing?.category?.slug || GIFT_SLUG)}
        />
    )
}

export default GiftBoxesSection
