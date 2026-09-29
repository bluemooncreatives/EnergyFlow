import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import '@/models/Category.model'

const toPlainObject = (data) => (data ? JSON.parse(JSON.stringify(data)) : null)

// The route lookup sits in front of every product URL — the layout, the
// metadata and the page all need it before anything can render — so it used to
// cost three uncached round trips on every single hit. It is now cached like the
// rest of the catalogue: every product, variant and category mutation calls
// revalidateCatalogue(), which drops the 'storefront-product-routes' tag, so a
// rename or a delete is still reflected immediately.
const lookupProductRoute = unstable_cache(
    async (slug) => {
        await connectDB()

        const lookup = (value) => ProductModel.findOne({
            deletedAt: null, $or: [{ slug: value }, { routeSlugs: value }],
        })
            // Only the fields the route layer actually reads. The full document
            // is fetched by getProductDetailsBySlug for the page itself.
            .select('slug routeSlugs category')
            .populate({ path: 'category', match: { deletedAt: null }, select: 'name slug' })
            .lean()

        let product = await lookup(slug)
        // Preserve the pre-existing catalogue redirect.
        if (!product && slug === 'cheery') product = await lookup('candied-cherries')
        if (!product?.category?.slug) return null
        if (!await ProductVariantModel.exists({ product: product._id, deletedAt: null })) return null

        return toPlainObject(product)
    },
    ['storefront-product-route'],
    {
        revalidate: 300,
        tags: ['storefront-product-routes'],
    }
)

// React cache deduplicates the layout, metadata and page lookup within a request.
export const resolveProductRoute = cache(async (input) => {
    if (typeof input !== 'string' || !input || input.length > 200) return null
    return lookupProductRoute(input.toLowerCase())
})
