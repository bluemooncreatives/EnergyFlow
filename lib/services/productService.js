import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { escapeRegex } from '@/lib/helperFunction'
import { dedupeColorEntries, dedupeColors, normalizeColor, sortSizes } from '@/lib/utils'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import ReviewModel from '@/models/Review.model'
import '@/models/Media.model'
import '@/models/SizeGuide.model'
import '@/models/Category.model'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const fetchFeaturedProducts = async () => {
    await connectDB()

    const featuredProducts = await ProductModel.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(9)
        .populate('media', 'secure_url alt')
        .populate('sizeGuide', 'name slug type columns rows note isActive')
        .lean()

    // Attach a default variant (cheapest available) per product so storefront
    // cards can quick-add to the cart, which keys on variantId.
    const productIds = featuredProducts.map((product) => product._id)
    const variants = await ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
        .select('product color size mrp sellingPrice')
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

    return toPlainObject(enriched)
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
        .populate('sizeGuide', 'name slug type columns rows note isActive')
        .lean()

    if (!bestsellers.length) return []

    // Attach a default variant (cheapest available) per product so storefront
    // cards can quick-add to the cart, which keys on variantId.
    const productIds = bestsellers.map((product) => product._id)
    const variants = await ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
        .select('product color size mrp sellingPrice')
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

    return toPlainObject(enriched)
}

export const getBestsellerProducts = unstable_cache(
    fetchBestsellerProducts,
    ['storefront-bestseller-products'],
    {
        revalidate: 300,
        tags: ['storefront-bestseller-products']
    }
)

// The Freshly Arrived homepage grid is laid out as 3 rows of 3 with a fixed
// 9-slot size pattern, so the section must always render exactly this many.
const FRESHLY_ARRIVED_COUNT = 9

const fetchFreshlyArrivedProducts = async () => {
    await connectDB()

    const selectFields = 'name slug sellingPrice mrp media freshlyArrivedSortOrder'

    // 1) Admin-curated picks, in their configured order.
    const curated = await ProductModel.find({ deletedAt: null, isFreshlyArrived: true })
        .sort({ freshlyArrivedSortOrder: 1, createdAt: -1, _id: 1 })
        .limit(FRESHLY_ARRIVED_COUNT)
        .select(selectFields)
        .populate('media', 'secure_url alt')
        .lean()

    let products = curated

    // 2) Guarantee the section is never short of 9: top up with the most recent
    // non-curated products so the grid/animation layout never breaks, even before
    // an admin has finished curating.
    if (curated.length < FRESHLY_ARRIVED_COUNT) {
        const curatedIds = curated.map((product) => product._id)
        const fillers = await ProductModel.find({
            deletedAt: null,
            _id: { $nin: curatedIds }
        })
            .sort({ createdAt: -1, _id: 1 })
            .limit(FRESHLY_ARRIVED_COUNT - curated.length)
            .select(selectFields)
            .populate('media', 'secure_url alt')
            .lean()

        products = [...curated, ...fillers]
    }

    return toPlainObject(products.slice(0, FRESHLY_ARRIVED_COUNT))
}

export const getFreshlyArrivedProducts = unstable_cache(
    fetchFreshlyArrivedProducts,
    ['storefront-freshly-arrived-products'],
    {
        revalidate: 300,
        tags: ['storefront-freshly-arrived-products']
    }
)

const fetchProductDetailsBySlug = async (slug, size, color) => {
    if (!slug) return null

    await connectDB()

    const product = await ProductModel.findOne({ deletedAt: null, slug })
        .populate('media', 'secure_url alt')
        .populate('sizeGuide', 'name slug type columns rows note isActive')
        .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
        .lean()

    if (!product) return null

    const variantFilter = {
        product: product._id,
        deletedAt: null
    }

    if (size) variantFilter.size = size
    // Case/whitespace-insensitive so a `?color=Purple` link resolves the same
    // variant whether the row was stored as "purple", "PURPLE" or "Purple".
    if (color) {
        const normalizedColor = normalizeColor(color)
        if (normalizedColor) variantFilter.color = new RegExp(`^${escapeRegex(normalizedColor)}$`, 'i')
    }

    let variant = await ProductVariantModel.findOne(variantFilter)
        .populate('media', 'secure_url alt')
        .lean()

    // fallback to first available variant if requested combination does not exist
    if (!variant) {
        variant = await ProductVariantModel.findOne({ product: product._id, deletedAt: null })
            .sort({ _id: 1 })
            .populate('media', 'secure_url alt')
            .lean()
    }

    if (!variant) return null

    // Single pass over every live variant powers the colour list, the size
    // list AND the colour×size availability matrix the product page uses to
    // disable combinations that don't exist — far cheaper than separate
    // distinct/aggregate round-trips and keeps all three in sync.
    const [allVariants, reviewAgg] = await Promise.all([
        ProductVariantModel.find({ product: product._id, deletedAt: null })
            .select('color colorHex size')
            .sort({ _id: 1 })
            .lean(),
        ReviewModel.aggregate([
            { $match: { product: product._id, deletedAt: null } },
            { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }
        ])
    ])

    // Colour swatches with their admin-set hex (falls back to the curated
    // dictionary at render time), de-duped case/whitespace-insensitively.
    const colorEntries = dedupeColorEntries(
        allVariants.map((v) => ({ name: v.color, hex: v.colorHex }))
    )

    // Sizes in first-seen order, then sorted into the canonical apparel scale.
    const sizeSeen = []
    for (const v of allVariants) {
        if (v.size && !sizeSeen.includes(v.size)) sizeSeen.push(v.size)
    }
    const sizes = sortSizes(sizeSeen)

    // Normalised {color,size} pairs so the client can gray-out combinations
    // that have no matching variant (prevents dead clicks / wrong fallbacks).
    const variantOptions = allVariants.map((v) => ({
        color: normalizeColor(v.color),
        size: v.size
    }))

    const reviewStats = reviewAgg[0] || { count: 0, avg: 0 }
    const reviewCount = reviewStats.count || 0
    const ratingAvg = reviewStats.avg ? Number(reviewStats.avg.toFixed(1)) : 0

    return toPlainObject({
        product,
        variant,
        // Collapse case/whitespace variants so the product page shows each
        // color swatch once and the selected swatch highlights correctly.
        colors: dedupeColors(colorEntries.map((c) => c.name)),
        colorEntries,
        sizes,
        variantOptions,
        reviewCount,
        ratingAvg
    })
}

export const getProductDetailsBySlug = unstable_cache(
    fetchProductDetailsBySlug,
    ['storefront-product-details'],
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
            .lean()

        related = [...related, ...fillers]
    }

    if (!related.length) return []

    const productIds = related.map((product) => product._id)

    // Attach the cheapest available variant per product (cards quick-add to the
    // cart, which keys on variantId) and a rating summary in two batched queries.
    const [variants, reviewAgg] = await Promise.all([
        ProductVariantModel.find({ product: { $in: productIds }, deletedAt: null })
            .select('product color size mrp sellingPrice')
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

    return toPlainObject(enriched)
}

export const getRelatedProducts = unstable_cache(
    fetchRelatedProducts,
    ['storefront-related-products-v2'],
    {
        revalidate: 300,
        tags: ['storefront-related-products']
    }
)
