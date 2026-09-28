import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'
import '@/models/Media.model'
import '@/models/Category.model'
import ProductVariantModel from '@/models/ProductVariant.model'
import { getIndexableCategories } from '@/lib/services/shopService'
import { SITE_URL } from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'

// Regenerate the sitemap at most once an hour so new products show up
// without hitting the database on every crawl.
export const revalidate = 3600

export default async function sitemap() {
    const staticPages = [
        { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${SITE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
        { url: `${SITE_URL}/about-us`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${SITE_URL}/terms-and-conditions`, changeFrequency: 'yearly', priority: 0.2 },
    ]

    // Only stocked categories: empty landing pages are noindex.
    let categoryPages = []
    try {
        const categories = await getIndexableCategories()
        categoryPages = categories.map((category) => ({
            url: `${SITE_URL}${WEBSITE_CATEGORY(category.slug)}`,
            lastModified: category.lastModified,
            changeFrequency: 'weekly',
            priority: 0.9,
        }))
    } catch (error) {
        console.error('sitemap: failed to load categories', error)
    }

    let productPages = []
    try {
        await connectDB()
        const products = await ProductModel.find({ deletedAt: null })
            .select('slug category updatedAt media')
            .populate({ path: 'category', match: { deletedAt: null }, select: 'slug' })
            .populate({ path: 'media', select: 'secure_url', match: { deletedAt: null } })
            .lean()

        const stocked = new Set((await ProductVariantModel.distinct('product', { deletedAt: null })).map(String))
        productPages = products.filter((product) => product.category?.slug && stocked.has(String(product._id))).map((product) => ({
            url: `${SITE_URL}${WEBSITE_PRODUCT_DETAILS(product)}`,
            lastModified: product.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
            // Image sitemap entries help product photos rank in Google Images.
            images: (product.media || []).map((item) => item?.secure_url).filter(Boolean).slice(0, 5),
        }))
    } catch (error) {
        // A database hiccup shouldn't take the whole sitemap down —
        // serve the static pages and let the next revalidation retry.
        console.error('sitemap: failed to load products', error)
    }

    return [...staticPages, ...categoryPages, ...productPages]
}
