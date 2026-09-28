import { cache } from 'react'
import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import '@/models/Category.model'

// Uncached across requests: routing must reflect renames and deletions immediately.
// React cache deduplicates the layout, metadata and page lookup within a request.
export const resolveProductRoute = cache(async (input) => {
    if (typeof input !== 'string' || !input || input.length > 200) return null
    const slug = input.toLowerCase()
    await connectDB()
    const lookup = (value) => ProductModel.findOne({
        deletedAt: null, $or: [{ slug: value }, { routeSlugs: value }],
    }).populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' }).lean()
    let product = await lookup(slug)
    // Preserve the pre-existing catalogue redirect.
    if (!product && slug === 'cheery') product = await lookup('candied-cherries')
    if (!product?.category?.slug) return null
    if (!await ProductVariantModel.exists({ product: product._id, deletedAt: null })) return null
    return product
})
