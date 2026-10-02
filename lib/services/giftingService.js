import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { GIFTING_CATEGORY_SLUG } from '@/lib/giftEnquiry'
import { htmlToText, sortSizes } from '@/lib/utils'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const excerpt = (html, max = 190) => {
    const text = htmlToText(html)
    if (text.length <= max) return text
    const cut = text.slice(0, max)
    return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : max).trim()}…`
}

// The corporate gifting page: every live gift box with its cheapest variant
// (what "Add to cart" puts in the bag), all of its pack sizes, its photos and a
// plain-text excerpt of its description. Returns null when the category
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
                    { $project: { _id: 1, size: 1, mrp: 1, sellingPrice: 1 } },
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
            category: { name: category.name, slug: category.slug },
            defaultVariant: variants[0],
            sizes: sortSizes([...new Set(variants.map((v) => v.size).filter(Boolean))]),
            summary: excerpt(description),
        })),
    })
}

export const getGiftingCollection = unstable_cache(
    fetchGiftingCollection,
    ['storefront-gifting-collection'],
    {
        revalidate: 300,
        tags: ['storefront-category-landing', 'storefront-shop-filters', 'storefront-home-categories'],
    }
)
