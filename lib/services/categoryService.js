import { unstable_cache } from 'next/cache'
import mongoose from 'mongoose'
import { connectDB } from '@/lib/databaseConnection'
import CategoryModel from '@/models/Category.model'
import ProductModel from '@/models/Product.model'
import '@/models/Media.model'
import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

// Homepage "Categories" archive renders the most popular categories. The list
// is capped so the layout/animation stays balanced regardless of how many
// categories exist in the catalogue.
const HOME_CATEGORY_COUNT = 9

const fetchHomeCategories = async () => {
    await connectDB()

    // 1) Rank categories by how many active products they hold. This is the
    //    definition of "top" — popular, self-maintaining, and needs no extra
    //    admin field on the Category model.
    const counts = await ProductModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    if (!counts.length) return []

    const countByCategory = new Map(counts.map((row) => [String(row._id), row.count]))
    const candidateIds = counts.map((row) => row._id)

    // 2) Resolve names/slugs and drop soft-deleted categories. A product can
    //    still point at a trashed category, so this join is the authority on
    //    which categories are allowed to surface on the storefront.
    const categories = await CategoryModel.find({
        deletedAt: null,
        _id: { $in: candidateIds }
    })
        .select('name slug createdAt')
        .lean()

    if (!categories.length) return []

    // 3) Pick a representative image per category: the newest active product
    //    that carries at least one non-deleted media asset. Categories whose
    //    products have no usable image get none here and are filtered out below
    //    — the section is image-led, so a category with nothing to show should
    //    not be featured (and its hover preview would otherwise be blank).
    const categoryIds = categories.map((category) => category._id)
    const imageRows = await ProductModel.aggregate([
        { $match: { deletedAt: null, category: { $in: categoryIds } } },
        // Newest first so $first lands on the most recent product with an image.
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $lookup: {
                from: 'medias',
                let: { mediaIds: { $ifNull: ['$media', []] } },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ['$_id', '$$mediaIds'] },
                                    { $eq: ['$deletedAt', null] }
                                ]
                            }
                        }
                    },
                    { $project: { _id: 0, secure_url: 1, alt: 1 } },
                    { $limit: 1 }
                ],
                as: 'firstMedia'
            }
        },
        // Only products that resolved to a usable image can represent a category.
        { $match: { 'firstMedia.0': { $exists: true } } },
        {
            $group: {
                _id: '$category',
                image: { $first: { $arrayElemAt: ['$firstMedia', 0] } }
            }
        }
    ])

    const imageByCategory = new Map(imageRows.map((row) => [String(row._id), row.image]))

    // 4) Keep only categories that have both a product count and a usable image,
    //    order by popularity (count desc) with a stable name tiebreaker, then
    //    cap at HOME_CATEGORY_COUNT.
    const ranked = categories
        .filter((category) => imageByCategory.has(String(category._id)))
        .map((category) => {
            const id = String(category._id)
            const count = countByCategory.get(id) || 0
            const image = imageByCategory.get(id)
            return {
                id,
                name: category.name,
                slug: category.slug,
                href: WEBSITE_CATEGORY(category.slug),
                productCount: count,
                collectionLabel: `${count} ${count === 1 ? 'Style' : 'Styles'}`,
                year: category.createdAt
                    ? new Date(category.createdAt).getFullYear()
                    : new Date().getFullYear(),
                previewImage: image?.secure_url || '',
                alt: image?.alt || category.name
            }
        })
        // Guard against a media row that somehow has no URL.
        .filter((category) => category.previewImage)
        .sort((a, b) => {
            if (b.productCount !== a.productCount) return b.productCount - a.productCount
            return a.name.localeCompare(b.name)
        })
        .slice(0, HOME_CATEGORY_COUNT)

    return toPlainObject(ranked)
}

export const getHomeCategories = unstable_cache(
    fetchHomeCategories,
    ['storefront-home-categories'],
    {
        revalidate: 300,
        tags: ['storefront-home-categories']
    }
)

// Homepage "Shop by category" showcase: the top categories (same ranking as
// above), each enriched with what an expanded panel shows — up to three
// products with an image (bestsellers first, then newest), the lowest price
// across them ("From ₹…") and the deepest current markdown ("Up to X% off").
// One aggregation for every category at once; prices come from each product's
// cheapest live variant, falling back to the product-level price.
const SHOWCASE_SAMPLE_COUNT = 3

const fetchCategoryShowcase = async () => {
    const categories = await fetchHomeCategories()
    if (!categories.length) return []

    const ids = categories.map((category) => new mongoose.Types.ObjectId(category.id))

    const rows = await ProductModel.aggregate([
        { $match: { deletedAt: null, category: { $in: ids } } },
        { $sort: { isBestseller: -1, createdAt: -1, _id: -1 } },
        {
            $lookup: {
                from: 'medias',
                let: { mediaIds: { $ifNull: ['$media', []] } },
                pipeline: [
                    { $match: { $expr: { $and: [{ $in: ['$_id', '$$mediaIds'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $project: { _id: 0, secure_url: 1 } },
                    { $limit: 1 }
                ],
                as: 'firstMedia'
            }
        },
        {
            $lookup: {
                from: 'productvariants',
                let: { productId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $sort: { sellingPrice: 1 } },
                    { $limit: 1 },
                    { $project: { _id: 0, sellingPrice: 1, mrp: 1, size: 1 } }
                ],
                as: 'cheapest'
            }
        },
        {
            $project: {
                category: 1,
                name: 1,
                slug: 1,
                discountPercentage: 1,
                image: { $arrayElemAt: ['$firstMedia.secure_url', 0] },
                price: { $ifNull: [{ $arrayElemAt: ['$cheapest.sellingPrice', 0] }, '$sellingPrice'] },
                mrp: { $ifNull: [{ $arrayElemAt: ['$cheapest.mrp', 0] }, '$mrp'] },
                size: { $arrayElemAt: ['$cheapest.size', 0] },
            }
        },
        {
            $group: {
                _id: '$category',
                products: { $push: { name: '$name', slug: '$slug', image: '$image', price: '$price', mrp: '$mrp', size: '$size' } },
                priceFrom: { $min: '$price' },
                maxDiscount: { $max: '$discountPercentage' },
            }
        },
        {
            $project: {
                priceFrom: 1,
                maxDiscount: 1,
                products: {
                    $slice: [{ $filter: { input: '$products', cond: { $ne: [{ $ifNull: ['$$this.image', null] }, null] } } }, SHOWCASE_SAMPLE_COUNT]
                },
            }
        }
    ])

    const extraByCategory = new Map(rows.map((row) => [String(row._id), row]))

    return toPlainObject(categories.map((category) => {
        const extra = extraByCategory.get(category.id)
        return {
            ...category,
            priceFrom: extra?.priceFrom ?? null,
            maxDiscount: Math.max(0, Math.round(extra?.maxDiscount || 0)),
            products: extra?.products || [],
        }
    }))
}

export const getCategoryShowcase = unstable_cache(
    fetchCategoryShowcase,
    ['storefront-category-showcase'],
    {
        revalidate: 300,
        // Same tag as the home categories, so anything that refreshes one
        // refreshes both.
        tags: ['storefront-home-categories']
    }
)

// Footer "Categories" column: the top N categories by active-product count, as
// plain text links. Unlike the homepage section this does NOT require an image
// (the footer is text-only), so it reflects the genuinely most-populated
// categories.
const FOOTER_CATEGORY_COUNT = 5

const fetchFooterCategories = async () => {
    await connectDB()

    const counts = await ProductModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    if (!counts.length) return []

    const countByCategory = new Map(counts.map((row) => [String(row._id), row.count]))

    const categories = await CategoryModel.find({
        deletedAt: null,
        _id: { $in: counts.map((row) => row._id) }
    })
        .select('name slug')
        .lean()

    const ranked = categories
        .map((category) => ({
            label: category.name,
            href: WEBSITE_CATEGORY(category.slug),
            count: countByCategory.get(String(category._id)) || 0
        }))
        .sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count
            return a.label.localeCompare(b.label)
        })
        .slice(0, FOOTER_CATEGORY_COUNT)
        .map(({ label, href }) => ({ label, href }))

    return toPlainObject(ranked)
}

export const getFooterCategories = unstable_cache(
    fetchFooterCategories,
    ['storefront-footer-categories'],
    {
        revalidate: 300,
        // Shares the home-categories invalidation tag, so the same category /
        // product mutations that already call revalidateTag('storefront-home-categories')
        // refresh the footer too — no extra wiring needed.
        tags: ['storefront-home-categories']
    }
)

// Header "Shop" mega-menu: EVERY category that currently has at least one
// active product (an empty category would lead to an empty results page),
// with its product count and a thumbnail (the newest product image, if any —
// unlike the homepage archive, a category without an image still appears and
// the menu draws a lettered tile for it). Ordered by product count, then name.
const fetchNavCategories = async () => {
    await connectDB()

    const counts = await ProductModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    if (!counts.length) return { categories: [], totalProducts: 0 }

    const countByCategory = new Map(counts.map((row) => [String(row._id), row.count]))

    const categories = await CategoryModel.find({
        deletedAt: null,
        _id: { $in: counts.map((row) => row._id) }
    })
        .select('name slug')
        .lean()
    if (!categories.length) return { categories: [], totalProducts: 0 }

    const imageRows = await ProductModel.aggregate([
        { $match: { deletedAt: null, category: { $in: categories.map((c) => c._id) } } },
        { $sort: { createdAt: -1, _id: -1 } },
        {
            $lookup: {
                from: 'medias',
                let: { mediaIds: { $ifNull: ['$media', []] } },
                pipeline: [
                    { $match: { $expr: { $and: [{ $in: ['$_id', '$$mediaIds'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $project: { _id: 0, secure_url: 1 } },
                    { $limit: 1 }
                ],
                as: 'firstMedia'
            }
        },
        { $match: { 'firstMedia.0': { $exists: true } } },
        { $group: { _id: '$category', image: { $first: { $arrayElemAt: ['$firstMedia.secure_url', 0] } } } }
    ])
    const imageByCategory = new Map(imageRows.map((row) => [String(row._id), row.image]))

    const list = categories
        .map((category) => {
            const id = String(category._id)
            return {
                id,
                name: category.name,
                slug: category.slug,
                href: WEBSITE_CATEGORY(category.slug),
                productCount: countByCategory.get(id) || 0,
                image: imageByCategory.get(id) || '',
            }
        })
        .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name))

    return toPlainObject({
        categories: list,
        // Only products in live categories — what "Shop all" actually shows.
        totalProducts: list.reduce((sum, category) => sum + category.productCount, 0),
    })
}

export const getNavCategories = unstable_cache(
    fetchNavCategories,
    ['storefront-nav-categories'],
    {
        revalidate: 300,
        // Category and product create/update/delete already revalidate this tag.
        tags: ['storefront-home-categories']
    }
)

// What the homepage can honestly link to: category slugs that currently hold
// at least one active product, and whether the spotlight search terms match
// anything. The hero, "signature range" and pantry marquee links use this to
// avoid sending shoppers to an empty results page (they fall back to the full
// shop or an enquiry instead). Search mirrors the shop's case-insensitive name
// match.
const SPOTLIGHT_TERMS = ['ghee', 'oil', 'chocolate', 'cashew']

const fetchStorefrontAvailability = async () => {
    await connectDB()

    const counts = await ProductModel.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$category' } }
    ])

    const categories = counts.length
        ? await CategoryModel.find({ deletedAt: null, _id: { $in: counts.map((row) => row._id) } })
            .select('slug')
            .lean()
        : []

    const termHits = await Promise.all(
        SPOTLIGHT_TERMS.map((term) =>
            ProductModel.exists({ deletedAt: null, name: { $regex: term, $options: 'i' } })
        )
    )

    return toPlainObject({
        categories: categories.map((category) => category.slug),
        terms: Object.fromEntries(SPOTLIGHT_TERMS.map((term, i) => [term, Boolean(termHits[i])])),
    })
}

export const getStorefrontAvailability = unstable_cache(
    fetchStorefrontAvailability,
    ['storefront-availability'],
    {
        revalidate: 300,
        // Product and category mutations already revalidate this tag.
        tags: ['storefront-home-categories']
    }
)

// Homepage "signature range": live numbers for the three lines the brand leads
// with (matched by product name, like the shop search) — how many products each
// has and the lowest price among them — plus one more category to sit beside
// them. That fourth pick prefers a gifting category (it's the "worth gifting"
// section), otherwise the most popular category that isn't already one of the
// lines. It reuses the cached showcase ranking, so it costs no extra lookups.
const SIGNATURE_TERMS = ['ghee', 'oil', 'chocolate']
const GIFTING_PATTERN = /gift|hamper/i

const fetchSignatureTermStats = async () => {
    await connectDB()

    const [row] = await ProductModel.aggregate([
        { $match: { deletedAt: null, name: { $regex: SIGNATURE_TERMS.join('|'), $options: 'i' } } },
        {
            $lookup: {
                from: 'productvariants',
                let: { productId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $sort: { sellingPrice: 1 } },
                    { $limit: 1 },
                    { $project: { _id: 0, sellingPrice: 1 } }
                ],
                as: 'cheapest'
            }
        },
        {
            $project: {
                name: 1,
                price: { $ifNull: [{ $arrayElemAt: ['$cheapest.sellingPrice', 0] }, '$sellingPrice'] },
            }
        },
        {
            $facet: Object.fromEntries(SIGNATURE_TERMS.map((term) => [term, [
                { $match: { name: { $regex: term, $options: 'i' } } },
                { $group: { _id: null, count: { $sum: 1 }, priceFrom: { $min: '$price' } } },
            ]]))
        }
    ])

    return Object.fromEntries(SIGNATURE_TERMS.map((term) => {
        const stats = row?.[term]?.[0]
        return [term, { count: stats?.count || 0, priceFrom: stats?.priceFrom ?? null }]
    }))
}

const fetchSignatureShowcase = async () => {
    const [terms, categories] = await Promise.all([
        fetchSignatureTermStats(),
        getCategoryShowcase(),
    ])

    const coveredByLine = (category) => {
        const haystack = `${category.slug} ${category.name}`.toLowerCase()
        return SIGNATURE_TERMS.some((term) => haystack.includes(term))
    }
    const isGifting = (category) => GIFTING_PATTERN.test(`${category.slug} ${category.name}`)

    const candidates = (categories || []).filter((category) => !coveredByLine(category))
    const pick = candidates.find(isGifting) || candidates[0] || null

    return toPlainObject({
        terms,
        pick: pick && {
            name: pick.name,
            slug: pick.slug,
            href: pick.href,
            productCount: pick.productCount,
            priceFrom: pick.priceFrom,
            image: pick.previewImage,
            alt: pick.alt,
            gifting: isGifting(pick),
        },
    })
}

export const getSignatureShowcase = unstable_cache(
    fetchSignatureShowcase,
    ['storefront-signature-showcase'],
    {
        revalidate: 300,
        tags: ['storefront-home-categories']
    }
)
