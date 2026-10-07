import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { GIFTING_CATEGORY_SLUG } from '@/lib/giftEnquiry'
import { decodeHTMLDeep, htmlToText, sortSizes } from '@/lib/utils'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const excerpt = (html, max = 190) => {
    const text = htmlToText(html)
    if (text.length <= max) return text
    const cut = text.slice(0, max)
    return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : max).trim()}…`
}

// Gift box descriptions open with an intro paragraph, then a "Why you'll love
// it" list of `<li><strong>Title</strong>: detail</li>`. The card shows the
// intro (not the whole description run together), the box's nickname when the
// intro quotes one (“The Royal Scroll”) and up to three of those highlights.
const describe = (html) => {
    const source = decodeHTMLDeep(html)
    const intro = htmlToText(source.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '')
    const nickname = intro.match(/[“"]([^”"]{3,40})[”"]/)?.[1] || null
    const highlights = [...source.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map(([, item]) => {
            const title = htmlToText(item.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || '').replace(/\s*:$/, '')
            const detail = htmlToText(item.replace(/<strong[^>]*>[\s\S]*?<\/strong>/i, '')).replace(/^:\s*/, '')
            return title ? { title, detail } : null
        })
        .filter(Boolean)
        .slice(0, 3)
    return {
        summary: intro ? excerpt(intro) : excerpt(source),
        nickname,
        highlights,
    }
}

const galleryOf = (variant) => {
    if (!variant) return []
    const byId = new Map((variant.gallery || []).map((media) => [String(media._id), media]))
    return (variant.mediaIds || []).map((id) => byId.get(String(id))).filter(Boolean)
}

const uniqueMedia = (list) => {
    const seen = new Set()
    return list.filter((media) => {
        const key = String(media._id)
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

// The corporate gifting page: every live gift box with its cheapest variant
// (what "Add to cart" puts in the bag), all of its pack sizes, its photos and
// what describe() pulls from its description. Returns null when the category
// itself is missing; an empty `products` list when nothing is stocked yet.
const fetchGiftingCollection = async () => {
    await connectDB()

    const category = await CategoryModel.findOne({ slug: GIFTING_CATEGORY_SLUG, deletedAt: null })
        .select('name slug')
        .lean()
    if (!category) return null

    const products = await ProductModel.aggregate([
        { $match: { category: category._id, deletedAt: null } },
        {
            $lookup: {
                from: 'productvariants',
                let: { productId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $sort: { sellingPrice: 1, _id: 1 } },
                    { $project: { _id: 1, size: 1, mrp: 1, sellingPrice: 1, mediaIds: '$media' } },
                    // A variant carries its own gallery (the product record
                    // often holds just the cover), so read it too.
                    {
                        $lookup: {
                            from: 'medias',
                            let: { mediaIds: { $ifNull: ['$mediaIds', []] } },
                            pipeline: [
                                { $match: { $expr: { $and: [{ $in: ['$_id', '$$mediaIds'] }, { $eq: ['$deletedAt', null] }] } } },
                                { $project: { _id: 1, secure_url: 1, alt: 1 } },
                            ],
                            as: 'gallery',
                        },
                    },
                ],
                as: 'variants',
            },
        },
        // A box with no live variant can't be bought or quoted against.
        { $match: { 'variants.0': { $exists: true } } },
        { $sort: { createdAt: 1, _id: 1 } },
        { $limit: 24 },
        {
            $lookup: {
                from: 'medias',
                let: { mediaIds: '$media' },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$mediaIds'] } } },
                    { $project: { _id: 1, secure_url: 1, alt: 1 } },
                ],
                as: 'media',
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                mrp: 1,
                sellingPrice: 1,
                description: 1,
                variants: 1,
                media: 1,
            },
        },
    ])

    return toPlainObject({
        category,
        products: products.map(({ description, variants, ...product }) => ({
            ...product,
            // The box's own cover first, then the default variant's gallery in
            // its saved order, without repeats.
            media: uniqueMedia([...(product.media || []), ...galleryOf(variants[0])]),
            category: { name: category.name, slug: category.slug },
            defaultVariant: variants[0] && (({ gallery, mediaIds, ...variant }) => variant)(variants[0]),
            sizes: sortSizes([...new Set(variants.map((v) => v.size).filter(Boolean))]),
            ...describe(description),
        })),
    })
}

export const getGiftingCollection = unstable_cache(
    fetchGiftingCollection,
    ['storefront-gifting-collection-v3'],
    {
        revalidate: 300,
        tags: ['storefront-category-landing', 'storefront-shop-filters', 'storefront-home-categories'],
    }
)
