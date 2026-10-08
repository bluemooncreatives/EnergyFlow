import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { escapeRegex } from '@/lib/helperFunction'
import { sortSizes } from '@/lib/utils'
import { expandSearchTerms } from '@/lib/searchSynonyms'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import '@/models/Media.model'
import { categoryCover } from '@/lib/categoryCover'
import { orderedMediaPipeline } from '@/lib/productMedia'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const normalizeParam = (value) => {
    if (Array.isArray(value)) return value.join(',')
    return value ?? ''
}

const fetchShopFilters = async () => {
    await connectDB()

    const [categories, sizesAggregate] = await Promise.all([
        CategoryModel.find({ deletedAt: null }).select('name slug').lean(),
        ProductVariantModel.aggregate([
            { $match: { deletedAt: null } },
            { $sort: { _id: 1 } },
            {
                $group: {
                    _id: '$size',
                    first: { $first: '$_id' }
                }
            },
            { $sort: { first: 1 } },
            { $project: { _id: 0, size: '$_id' } }
        ])
    ])

    // Ordered by pack weight (200g, 500g, 600g) rather than insertion order,
    // so the sidebar reads the same way the product page does.
    const sizes = sortSizes(sizesAggregate.map((item) => item.size))

    return toPlainObject({ categories, sizes })
}

export const getShopFilters = unstable_cache(
    fetchShopFilters,
    ['storefront-shop-filters'],
    {
        revalidate: 300,
        tags: ['storefront-shop-filters']
    }
)

// Every cold visit to /shop renders the unfiltered first page, and the
// aggregation behind it is the bulk of the route's server response time.
// Cache just that default page briefly — filtered/searched/paged requests
// stay fully dynamic. Product/variant/review edits surface within a minute.
export const getDefaultShopProducts = unstable_cache(
    () => getShopProducts({}),
    ['storefront-shop-default-products'],
    {
        revalidate: 60,
        tags: ['storefront-shop-default-products']
    }
)

export const getShopProducts = async (params = {}) => {
    await connectDB()

    const size = normalizeParam(params.size)
    const minPrice = parseInt(params.minPrice) || 0
    const maxPrice = parseInt(params.maxPrice) || 100000
    const categorySlug = normalizeParam(params.category)
    // Trim + cap length so a stray pasted blob can't build a huge regex.
    const search = normalizeParam(params.q).trim().slice(0, 80)
    const bestsellerOnly = ['true', '1', 'yes'].includes(String(params.bestseller).toLowerCase())
    const freshlyArrivedOnly = ['true', '1', 'yes'].includes(String(params.freshlyArrived).toLowerCase())

    const sizeList = size ? size.split(',').filter(Boolean) : []

    const limit = Math.min(parseInt(params.limit) || 9, 30)
    const page = Math.max(parseInt(params.page) || 0, 0)
    const skip = page * limit

    const sortOption = params.sort || 'default_sorting'
    let sortquery = {}
    if (sortOption === 'default_sorting') sortquery = { createdAt: -1 }
    if (sortOption === 'asc') sortquery = { name: 1 }
    if (sortOption === 'desc') sortquery = { name: -1 }
    if (sortOption === 'price_low_high') sortquery = { sellingPrice: 1 }
    if (sortOption === 'price_high_low') sortquery = { sellingPrice: -1 }
    // Stable tiebreaker: without it, products sharing the same primary sort key
    // (e.g. equal createdAt / price) can reshuffle between pages, causing the
    // same product to appear twice or be skipped entirely as you paginate.
    sortquery = { ...sortquery, _id: 1 }

    let categoryId = []
    if (categorySlug) {
        const slugs = categorySlug.split(',')
        const categoryData = await CategoryModel.find({ deletedAt: null, slug: { $in: slugs } })
            .select('_id')
            .lean()
        categoryId = categoryData.map((category) => category._id)
    }

    let matchStage = { deletedAt: null }
    if (categoryId.length > 0) matchStage.category = { $in: categoryId }
    if (bestsellerOnly) matchStage.isBestseller = true
    if (freshlyArrivedOnly) matchStage.isFreshlyArrived = true

    if (search) {
        // Every query word must match, each through its synonyms ("almond"
        // also finds "Badam") and in either the product name or its
        // category's name ("dry fruits" finds the whole Dry Fruits aisle).
        const terms = expandSearchTerms(search)
        if (terms.length === 0) {
            matchStage.name = { $regex: escapeRegex(search), $options: 'i' }
        } else {
            const categories = await CategoryModel.find({ deletedAt: null }).select('_id name').lean()
            matchStage.$and = terms.map((alternatives) => {
                const pattern = new RegExp(alternatives.map(escapeRegex).join('|'), 'i')
                const categoryIds = categories
                    .filter((category) => pattern.test(category.name))
                    .map((category) => category._id)
                return {
                    $or: [
                        { name: { $regex: pattern.source, $options: 'i' } },
                        ...(categoryIds.length ? [{ category: { $in: categoryIds } }] : []),
                    ],
                }
            })
        }
    }

    const aggregation = await ProductModel.aggregate([
        { $match: matchStage },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $match: { 'category.deletedAt': null } },
        // Variant filtering (size / price) must run BEFORE pagination.
        // If it ran after $skip/$limit, a page would fetch N products then drop
        // the non-matching ones — returning fewer than `limit` items and making
        // the total count (and therefore the page count) impossible to know.
        {
            $lookup: {
                from: 'productvariants',
                let: { productId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$product', '$$productId'] },
                                    { $eq: ['$deletedAt', null] },
                                    sizeList.length > 0 ? { $in: ['$size', sizeList] } : { $literal: true },
                                    { $gte: ['$sellingPrice', minPrice] },
                                    { $lte: ['$sellingPrice', maxPrice] },
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            size: 1,
                            mrp: 1,
                            sellingPrice: 1,
                        }
                    },
                    {
                        $limit: 1
                    }
                ],
                as: 'matchedVariants'
            }
        },
        {
            $match: { 'matchedVariants.0': { $exists: true } }
        },
        { $sort: sortquery },
        {
            // One round-trip returns both the total (for page count) and just the
            // current page's documents. The expensive reviews/media lookups live
            // inside the `data` branch so they only run for the page being shown.
            $facet: {
                meta: [{ $count: 'total' }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: 'reviews',
                            let: { productId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$product', '$$productId'] },
                                                { $eq: ['$deletedAt', null] }
                                            ]
                                        }
                                    }
                                },
                                {
                                    $group: {
                                        _id: null,
                                        avg: { $avg: '$rating' },
                                        count: { $sum: 1 }
                                    }
                                }
                            ],
                            as: 'reviewStats'
                        }
                    },
                    {
                        $addFields: {
                            ratingAvg: { $ifNull: [{ $arrayElemAt: ['$reviewStats.avg', 0] }, 0] },
                            ratingCount: { $ifNull: [{ $arrayElemAt: ['$reviewStats.count', 0] }, 0] },
                            defaultVariant: { $arrayElemAt: ['$matchedVariants', 0] }
                        }
                    },
                    {
                        $lookup: {
                            from: 'medias',
                            let: { mediaIds: { $ifNull: ['$media', []] } },
                            // In the admin's order, so the card shows the main image first.
                            pipeline: orderedMediaPipeline({ project: { _id: 1, secure_url: 1, alt: 1 } }),
                            as: 'media'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            slug: 1,
                            category: { name: 1, slug: 1 },
                            mrp: 1,
                            sellingPrice: 1,
                            discountPercentage: 1,
                            ratingAvg: 1,
                            ratingCount: 1,
                            defaultVariant: {
                                _id: 1,
                                size: 1,
                                mrp: 1,
                                sellingPrice: 1
                            },
                            media: {
                                _id: 1,
                                secure_url: 1,
                                alt: 1
                            }
                        }
                    }
                ]
            }
        }
    ])

    const facet = aggregation[0] || { meta: [], data: [] }
    const total = facet.meta?.[0]?.total || 0
    const products = facet.data || []
    const totalPages = Math.ceil(total / limit)
    // Kept for backward compatibility with any infinite-scroll consumer.
    const nextPage = page + 1 < totalPages ? page + 1 : null

    return toPlainObject({ products, nextPage, total, totalPages, page })
}

// Category landing page (/category/[slug]): the category itself, its cover
// photo and its products, newest first. Catalogue categories hold a handful of products, so
// the first 30 cover the whole aisle; the page links to the filterable shop
// for anything beyond that. Category and product mutations already
// invalidate both tags.
const CATEGORY_PAGE_LIMIT = 30

const fetchCategoryLanding = async (slug) => {
    await connectDB()
    const found = await CategoryModel.findOne({ deletedAt: null, slug: String(slug || '').toLowerCase() })
        .select('name slug updatedAt coverImage coverAlt coverPosition')
        .populate({ path: 'coverImage', match: { deletedAt: null }, select: 'secure_url alt' })
        .lean()
    if (!found) return null

    // The admin's cover photo (Admin → Category → Cover), or null.
    const { coverImage, coverAlt, coverPosition, ...category } = found
    const cover = categoryCover(found)

    const { products, total } = await getShopProducts({ category: category.slug, limit: CATEGORY_PAGE_LIMIT })
    return toPlainObject({ category, cover, products, total })
}

export const getCategoryLanding = unstable_cache(
    fetchCategoryLanding,
    ['storefront-category-landing'],
    {
        revalidate: 300,
        tags: ['storefront-home-categories', 'storefront-shop-filters']
    }
)

// Slugs of categories that hold at least one live product — the only
// category pages worth offering to search engines.
const fetchIndexableCategories = async () => {
    await connectDB()
    const counts = await ProductModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category', updatedAt: { $max: '$updatedAt' } } }
    ])
    const updatedByCategory = new Map(counts.map((row) => [String(row._id), row.updatedAt]))
    const categories = await CategoryModel.find({ deletedAt: null, _id: { $in: counts.map((row) => row._id) } })
        .select('slug updatedAt')
        .lean()
    return toPlainObject(categories.map((category) => {
        const productUpdated = updatedByCategory.get(String(category._id))
        const lastModified = [category.updatedAt, productUpdated]
            .filter(Boolean)
            .map((value) => new Date(value))
            .sort((a, b) => b - a)[0]
        return { slug: category.slug, lastModified }
    }))
}

export const getIndexableCategories = unstable_cache(
    fetchIndexableCategories,
    ['storefront-indexable-categories'],
    {
        revalidate: 3600,
        tags: ['storefront-home-categories', 'storefront-shop-filters']
    }
)
