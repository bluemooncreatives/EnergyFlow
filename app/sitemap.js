import { connectDB } from '@/lib/databaseConnection'
import ProductModel from '@/models/Product.model'

const BASE_URL = 'https://www.energyflow.com'

// Regenerate the sitemap at most once an hour so new products show up
// without hitting the database on every crawl.
export const revalidate = 3600

export default async function sitemap() {
    const staticPages = [
        { url: `${BASE_URL}/`, changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/about-us`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/privacy-policy`, changeFrequency: 'yearly', priority: 0.3 },
        { url: `${BASE_URL}/terms-and-conditions`, changeFrequency: 'yearly', priority: 0.3 },
    ]

    let productPages = []
    try {
        await connectDB()
        const products = await ProductModel.find({ deletedAt: null })
            .select('slug updatedAt')
            .lean()

        productPages = products.map((product) => ({
            url: `${BASE_URL}/product/${product.slug}`,
            lastModified: product.updatedAt,
            changeFrequency: 'weekly',
            priority: 0.8,
        }))
    } catch (error) {
        // A database hiccup shouldn't take the whole sitemap down —
        // serve the static pages and let the next revalidation retry.
        console.error('sitemap: failed to load products', error)
    }

    return [...staticPages, ...productPages]
}
