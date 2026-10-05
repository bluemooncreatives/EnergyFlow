import mongoose from 'mongoose'
import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { sortSizes } from '@/lib/utils'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import ReviewModel from '@/models/Review.model'
import '@/models/Media.model'
import CategoryModel from '@/models/Category.model'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const fetchFeaturedProducts = async () => {
    await connectDB()

    const featuredProducts = await ProductModel.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(9)
        .populate('media', 'secure_url alt')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
        .lean()

    // Attach a default variant (cheapest available) per product so storefront
    // cards can quick-add to the cart, which keys on variantId.
    const productIds = featuredProducts.map((product) => product._id)
    const variants = await ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
        .select('product size mrp sellingPrice')
        .sort({ sellingPrice: 1 })
        .lean()

    const variantByProduct = new Map()
    for (const variant of variants) {
        const key = String(variant.product)
        if (!variantByProduct.has(key)) variantByProduct.set(key, variant)
    }

    const enriched = featuredProducts.map((product) => ({
        ...product,
        defaultVariant: variantByProduct.get(String(product._id)) || null,
    }))

    return toPlainObject(enriched.filter((product) => product.category?.slug))
}

export const getFeaturedProducts = unstable_cache(
    fetchFeaturedProducts,
    ['storefront-featured-products'],
    {
        revalidate: 300,
        tags: ['storefront-featured-products']
    }
)

const fetchBestsellerProducts = async () => {
    await connectDB()

    // Only admin-curated, non-deleted products surface here. Ordered by the
    // admin-defined rank, with a stable createdAt/_id tiebreaker so cards never
    // reshuffle between renders.
    const bestsellers = await ProductModel.find({ deletedAt: null, isBestseller: true })
        .sort({ bestsellerSortOrder: 1, createdAt: -1, _id: 1 })
        .limit(12)
        .populate('media', 'secure_url alt')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
        .lean()

    if (!bestsellers.length) return []

    // Attach a default variant (cheapest available) per product so storefront
    // cards can quick-add to the cart, which keys on variantId.
    const productIds = bestsellers.map((product) => product._id)
    const variants = await ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
        .select('product size mrp sellingPrice')
        .sort({ sellingPrice: 1 })
        .lean()

    const variantByProduct = new Map()
    for (const variant of variants) {
        const key = String(variant.product)
        if (!variantByProduct.has(key)) variantByProduct.set(key, variant)
    }

    const enriched = bestsellers.map((product) => ({
        ...product,
        defaultVariant: variantByProduct.get(String(product._id)) || null,
    }))

    return toPlainObject(enriched.filter((product) => product.category?.slug))
}

export const getBestsellerProducts = unstable_cache(
    fetchBestsellerProducts,
    ['storefront-bestseller-products'],
    {
        revalidate: 300,
        tags: ['storefront-bestseller-products']
    }
)

// The homepage "Popular right now" grid shows the admin's Freshly Arrived
// curation. It is a fixed 2 x 5 block, so it always renders this many cards;
// the admin screen states the same rule and counts auto-filled slots from its
// own `slots`, which must stay in step with this number.
const FRESHLY_ARRIVED_COUNT = 10

const fetchFreshlyArrivedProducts = async () => {
    await connectDB()

    // A slot only goes to a product a shopper can open and buy: a live category
    // (the card links through it) and at least one live variant (the product
    // page 404s without one, and quick-add keys on a variant). Filtering in the
    // query rather than afterwards means an unsellable pick hands its slot to
    // the next one instead of leaving a hole in the grid.
    const [liveCategoryIds, stockedProductIds] = await Promise.all([
        CategoryModel.distinct('_id', { deletedAt: null }),
        ProductVariantModel.distinct('product', { deletedAt: null })
    ])
    if (!liveCategoryIds.length || !stockedProductIds.length) return []

    const populateCard = (query) => query
        .populate('media', 'secure_url alt')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })

    // Admin-curated picks first, in the admin-defined rank, with a stable
    // createdAt/_id tiebreaker so cards never reshuffle between renders. Picks
    // beyond the visible slots move up if one ahead of them stops being sellable.
    let products = await populateCard(
        ProductModel.find({
            deletedAt: null,
            isFreshlyArrived: true,
            category: { $in: liveCategoryIds },
            _id: { $in: stockedProductIds }
        })
            .sort({ freshlyArrivedSortOrder: 1, createdAt: -1, _id: 1 })
            .limit(FRESHLY_ARRIVED_COUNT)
    ).lean()

    // Fewer picks than slots: top the grid up with the newest sellable stock,
    // which is what the curation screen promises an admin who has not filled it.
    if (products.length < FRESHLY_ARRIVED_COUNT) {
        const have = new Set(products.map((product) => String(product._id)))
        const fillers = await populateCard(
            ProductModel.find({
                deletedAt: null,
                category: { $in: liveCategoryIds },
                _id: { $in: stockedProductIds.filter((id) => !have.has(String(id))) }
            })
                .sort({ createdAt: -1, _id: 1 })
                .limit(FRESHLY_ARRIVED_COUNT - products.length)
        ).lean()

        products = [...products, ...fillers]
    }

    if (!products.length) return []

    const productIds = products.map((product) => product._id)

    // Cheapest variant per product (cards quick-add to the cart, which keys on
    // variantId) and a rating summary, in two batched queries.
    const [variants, reviewAgg] = await Promise.all([
        ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
            .select('product size mrp sellingPrice')
            .sort({ sellingPrice: 1 })
            .lean(),
        ReviewModel.aggregate([
            { $match: { product: { $in: productIds }, deletedAt: null } },
            { $group: { _id: '$product', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
        ])
    ])

    const variantByProduct = new Map()
    for (const variant of variants) {
        const key = String(variant.product)
        if (!variantByProduct.has(key)) variantByProduct.set(key, variant)
    }

    const ratingByProduct = new Map()
    for (const row of reviewAgg) {
        ratingByProduct.set(String(row._id), {
            ratingCount: row.count || 0,
            ratingAvg: row.avg ? Number(row.avg.toFixed(1)) : 0
        })
    }

    const enriched = products.map((product) => {
        const rating = ratingByProduct.get(String(product._id)) || { ratingCount: 0, ratingAvg: 0 }
        return {
            ...product,
            defaultVariant: variantByProduct.get(String(product._id)) || null,
            ratingCount: rating.ratingCount,
            ratingAvg: rating.ratingAvg
        }
    })

    return toPlainObject(enriched.filter((product) => product.category?.slug && product.defaultVariant))
}

// Invalidated by the Freshly Arrived admin API on every add, remove and
// reorder, and by revalidateCatalogue() on any product, variant or category edit.
export const getFreshlyArrivedProducts = unstable_cache(
    fetchFreshlyArrivedProducts,
    ['storefront-freshly-arrived-products'],
    {
        revalidate: 300,
        tags: ['storefront-freshly-arrived-products']
    }
)

// The deal rail is one banner plus three cards, so the query is capped at what
// the layout holds.
const DAILY_BEST_SELLS_COUNT = 3

const fetchDailyBestSells = async () => {
    await connectDB()

    // Only genuinely marked-down stock belongs on a deal rail, deepest cut
    // first. discountPercentage is required on every product, but it is a
    // stored field — the $expr guards against a stale value by confirming the
    // prices still disagree.
    const deals = await ProductModel.find({
        deletedAt: null,
        discountPercentage: { $gt: 0 },
        $expr: { $lt: ['$sellingPrice', '$mrp'] }
    })
        .sort({ discountPercentage: -1, createdAt: -1, _id: 1 })
        .limit(DAILY_BEST_SELLS_COUNT)
        .populate('media', 'secure_url alt')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
        .lean()

    if (!deals.length) return []

    const productIds = deals.map((product) => product._id)

    // Cheapest variant per product (cards quick-add to the cart, which keys on
    // variantId) and a rating summary, in two batched queries.
    const [variants, reviewAgg] = await Promise.all([
        ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
            .select('product size mrp sellingPrice')
            .sort({ sellingPrice: 1 })
            .lean(),
        ReviewModel.aggregate([
            { $match: { product: { $in: productIds }, deletedAt: null } },
            { $group: { _id: '$product', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
        ])
    ])

    const variantByProduct = new Map()
    for (const variant of variants) {
        const key = String(variant.product)
        if (!variantByProduct.has(key)) variantByProduct.set(key, variant)
    }

    const ratingByProduct = new Map()
    for (const row of reviewAgg) {
        ratingByProduct.set(String(row._id), {
            ratingCount: row.count || 0,
            ratingAvg: row.avg ? Number(row.avg.toFixed(1)) : 0
        })
    }

    const enriched = deals.map((product) => {
        const rating = ratingByProduct.get(String(product._id)) || { ratingCount: 0, ratingAvg: 0 }
        return {
            ...product,
            defaultVariant: variantByProduct.get(String(product._id)) || null,
            ratingCount: rating.ratingCount,
            ratingAvg: rating.ratingAvg
        }
    })

    return toPlainObject(enriched.filter((product) => product.category?.slug))
}

export const getDailyBestSells = unstable_cache(
    fetchDailyBestSells,
    ['storefront-daily-best-sells'],
    {
        revalidate: 300,
        tags: ['storefront-daily-best-sells']
    }
)

// Single pass over every live variant powers the size list and the client-side
// pack switcher (price, media and SKU per pack), so changing size never needs a
// server round-trip — and it means the page's own pack does not need a query of
// its own either.
const liveVariantsOf = (productId) => ProductVariantModel
    .find({ product: productId, deletedAt: null })
    .select('size mrp sellingPrice discountPercentage sku media')
    .sort({ _id: 1 })
    .populate('media', 'secure_url alt')
    .lean()

// $match is not cast by Mongoose the way a query filter is, so an id that
// arrived as a string (anything that has been through the cache) has to be
// converted before it reaches an aggregation.
const reviewSummaryOf = (productId) => {
    const id = productId instanceof mongoose.Types.ObjectId
        ? productId
        : mongoose.Types.ObjectId.isValid(productId) ? new mongoose.Types.ObjectId(String(productId)) : null
    if (!id) return Promise.resolve([])
    return ReviewModel.aggregate([
        { $match: { product: id, deletedAt: null } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }
    ])
}

// `productId` is optional and comes from resolveProductRoute, which has already
// identified this slug. Supplying it is what lets the product document, the
// variant list and the review summary be fetched together: without it they had
// to run one after another, because each waited on the previous query's ids.
const fetchProductDetailsBySlug = async (slug, size, productId) => {
    if (!slug) return null

    await connectDB()

    const productQuery = ProductModel.findOne({ deletedAt: null, slug })
        .populate('media', 'secure_url alt')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
        .lean()

    let [product, allVariants, reviewAgg] = productId
        ? await Promise.all([productQuery, liveVariantsOf(productId), reviewSummaryOf(productId)])
        : [await productQuery, null, null]

    if (!product?.category?.slug) return null

    // No id was supplied, or the one supplied turned out not to be this slug's
    // product — fall back to fetching both against the id we just resolved.
    if (!allVariants || String(productId) !== String(product._id)) {
        ;[allVariants, reviewAgg] = await Promise.all([
            liveVariantsOf(product._id),
            reviewSummaryOf(product._id),
        ])
    }

    if (!allVariants.length) return null

    // The requested pack, or the first live one when ?size= names a pack that no
    // longer exists. Every variant is already in hand, so this costs no query.
    const variant = (size && allVariants.find((v) => v.size === size)) || allVariants[0]

    // Sizes in first-seen order, then sorted into the canonical apparel scale.
    const sizeSeen = []
    for (const v of allVariants) {
        if (v.size && !sizeSeen.includes(v.size)) sizeSeen.push(v.size)
    }
    const sizes = sortSizes(sizeSeen)

    // One variant per pack size, in size order. The resolved variant claims
    // its own size so the switcher and the server-rendered page agree.
    const variantBySize = new Map()
    for (const v of allVariants) {
        if (v.size && !variantBySize.has(v.size)) variantBySize.set(v.size, v)
    }
    if (variant.size) variantBySize.set(variant.size, variant)
    const variants = sizes.map((s) => variantBySize.get(s)).filter(Boolean)

    const reviewStats = reviewAgg[0] || { count: 0, avg: 0 }
    const reviewCount = reviewStats.count || 0
    const ratingAvg = reviewStats.avg ? Number(reviewStats.avg.toFixed(1)) : 0

    return toPlainObject({
        product,
        variant,
        variants,
        sizes,
        reviewCount,
        ratingAvg
    })
}

export const getProductDetailsBySlug = unstable_cache(
    fetchProductDetailsBySlug,
    ['storefront-product-details-v2'],
    {
        revalidate: 180,
        tags: ['storefront-product-details']
    }
)

// How many recommendation cards to render under the product page reviews.
// Pool size fetched + enriched. Pages randomly pick 4 of these per request so
// the "You May Also Like" rail varies on each visit.
const RELATED_POOL_COUNT = 12

const fetchRelatedProducts = async (productId, categoryId) => {
    if (!productId) return []

    await connectDB()

    const excludeIds = [productId]

    // 1) Prefer products from the same category, newest first.
    let related = []
    if (categoryId) {
        related = await ProductModel.find({
            deletedAt: null,
            category: categoryId,
            _id: { $ne: productId }
        })
            .sort({ createdAt: -1, _id: 1 })
            .limit(RELATED_POOL_COUNT)
            .populate('media', 'secure_url alt')
            .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
            .lean()
    }

    // 2) Top up with other recent products so the rail is never sparse, even
    // for a category that only holds the current product.
    if (related.length < RELATED_POOL_COUNT) {
        const have = related.map((product) => product._id)
        const fillers = await ProductModel.find({
            deletedAt: null,
            _id: { $nin: [...excludeIds, ...have] }
        })
            .sort({ createdAt: -1, _id: 1 })
            .limit(RELATED_POOL_COUNT - related.length)
            .populate('media', 'secure_url alt')
            .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
            .lean()

        related = [...related, ...fillers]
    }

    if (!related.length) return []

    const productIds = related.map((product) => product._id)

    // Attach the cheapest available variant per product (cards quick-add to the
    // cart, which keys on variantId) and a rating summary in two batched queries.
    const [variants, reviewAgg] = await Promise.all([
        ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
            .select('product size mrp sellingPrice')
            .sort({ sellingPrice: 1 })
            .lean(),
        ReviewModel.aggregate([
            { $match: { product: { $in: productIds }, deletedAt: null } },
            { $group: { _id: '$product', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
        ])
    ])

    const variantByProduct = new Map()
    for (const variant of variants) {
        const key = String(variant.product)
        if (!variantByProduct.has(key)) variantByProduct.set(key, variant)
    }

    const ratingByProduct = new Map()
    for (const row of reviewAgg) {
        ratingByProduct.set(String(row._id), {
            ratingCount: row.count || 0,
            ratingAvg: row.avg ? Number(row.avg.toFixed(1)) : 0
        })
    }

    const enriched = related.slice(0, RELATED_POOL_COUNT).map((product) => {
        const rating = ratingByProduct.get(String(product._id)) || { ratingCount: 0, ratingAvg: 0 }
        return {
            ...product,
            defaultVariant: variantByProduct.get(String(product._id)) || null,
            ratingCount: rating.ratingCount,
            ratingAvg: rating.ratingAvg
        }
    })

    return toPlainObject(enriched.filter((product) => product.category?.slug))
}

export const getRelatedProducts = unstable_cache(
    fetchRelatedProducts,
    ['storefront-related-products-v2'],
    {
        revalidate: 300,
        tags: ['storefront-related-products']
    }
)
