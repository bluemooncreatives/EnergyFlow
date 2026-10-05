import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { DEAL_SLOTS, mergeDealSettings } from '@/lib/dealsShared'
import { loadSellableScope } from '@/lib/services/sellability'
import DealSettingsModel from '@/models/DealSettings.model'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import ReviewModel from '@/models/Review.model'
import '@/models/Media.model'
import '@/models/Category.model'

// One tag covers the settings and the products. It predates the admin screen,
// so every product, variant and category edit (revalidateCatalogue) already
// refreshes it; the deals admin routes revalidate it on every save.
export const DEALS_TAG = 'storefront-daily-best-sells'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

// Full settings (defaults merged in) for the admin form and the storefront.
export const loadDealSettings = async () => {
    await connectDB()
    const doc = await DealSettingsModel.findOne({ key: 'default' }).lean()
    return {
        settings: mergeDealSettings(doc ? toPlainObject(doc) : null),
        updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    }
}

const populateCard = (query) => query
    .populate('media', 'secure_url alt')
    .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })

const fetchDealProducts = async () => {
    const { liveCategoryIds, stockedProductIds } = await loadSellableScope()
    if (!liveCategoryIds.length || !stockedProductIds.length) return []

    // Admin picks first, in the admin-defined rank. Only sellable products may
    // take a slot, so a pick that lost its stock or category hands its slot on.
    let products = await populateCard(
        ProductModel.find({
            deletedAt: null,
            isDeal: true,
            category: { $in: liveCategoryIds },
            _id: { $in: stockedProductIds }
        })
            .sort({ dealSortOrder: 1, createdAt: -1, _id: 1 })
            .limit(DEAL_SLOTS)
    ).lean()

    // Empty slots go to the deepest genuine markdowns, as the rail did before
    // it was curated. discountPercentage is a stored field, so the $expr
    // confirms the prices still disagree.
    if (products.length < DEAL_SLOTS) {
        const have = new Set(products.map((product) => String(product._id)))
        const fillers = await populateCard(
            ProductModel.find({
                deletedAt: null,
                category: { $in: liveCategoryIds },
                _id: { $in: stockedProductIds.filter((id) => !have.has(String(id))) },
                discountPercentage: { $gt: 0 },
                $expr: { $lt: ['$sellingPrice', '$mrp'] }
            })
                .sort({ discountPercentage: -1, createdAt: -1, _id: 1 })
                .limit(DEAL_SLOTS - products.length)
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

const fetchDealsSection = async () => {
    const { settings } = await loadDealSettings()
    // Switched off: skip the product queries entirely.
    const products = settings.section.enabled ? await fetchDealProducts() : []
    return toPlainObject({ settings, products })
}

// Cached read for the homepage rail. Whether a custom deadline has passed is
// decided by the caller at render time, never inside the cache, so a cached
// copy can't keep an expired deal alive.
export const getDealsSection = unstable_cache(
    fetchDealsSection,
    ['storefront-deals-section'],
    {
        revalidate: 300,
        tags: [DEALS_TAG],
    }
)
