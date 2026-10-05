import CategoryModel from '@/models/Category.model'
import ProductVariantModel from '@/models/ProductVariant.model'

// A curated storefront slot only goes to a product a shopper can open and buy:
// a live category (cards link through it) and at least one live variant (the
// product page 404s without one, and quick-add keys on a variant). Callers must
// have connected to the database first.
export const loadSellableScope = async () => {
    const [liveCategoryIds, stockedProductIds] = await Promise.all([
        CategoryModel.distinct('_id', { deletedAt: null }),
        ProductVariantModel.distinct('product', { deletedAt: null })
    ])
    return {
        liveCategoryIds,
        stockedProductIds,
        liveCategories: new Set(liveCategoryIds.map(String)),
        stocked: new Set(stockedProductIds.map(String))
    }
}

// Why a curated product would be skipped on the storefront, or null when it
// would show. `product.category` may be populated or a bare id.
export const hiddenReasonOf = (product, scope) => {
    const categoryId = product.category?._id ?? product.category
    if (!categoryId || !scope.liveCategories.has(String(categoryId))) return 'category'
    if (!scope.stocked.has(String(product._id))) return 'variants'
    return null
}

// Tags each admin list row with `sellable` and `hiddenReason`, which the
// curation manager uses to match its slot meter to the storefront.
export const annotateSellable = (items, scope) => items.map((item) => {
    const hiddenReason = hiddenReasonOf(item, scope)
    return { ...item, sellable: !hiddenReason, hiddenReason }
})
