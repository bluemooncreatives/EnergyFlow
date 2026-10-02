import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import OrderModel from '@/models/Order.model'
import ProductModel from '@/models/Product.model'
import ReviewModel from '@/models/Review.model'

export const STORE_STATS_TAG = 'storefront-store-stats'

/**
 * Live numbers for the homepage "by the numbers" band, read from the store's
 * own records — never invented.
 *
 * Definitions match the admin analytics (analyticsService):
 *   • Orders     — non-deleted orders that aren't cancelled / unverified.
 *   • Customers  — distinct order emails (case-insensitive) on those orders.
 *   • Pincodes   — distinct delivery pincodes on those orders.
 *   • Rating     — mean of all live product reviews.
 *   • Products   — live products on the shelf.
 */
const INVALID_STATUSES = ['cancelled', 'unverified']

// Genuine orders / customers from before the website (the New Delhi shop
// counter, phone orders). Added to the online figures. Leave at 0 unless the
// business has real records to back the number.
export const STAT_BASELINES = {
    orders: 0,
    customers: 0,
}

// A figure is only shown once it is big enough to build trust rather than
// undercut it ("7 orders served" helps no one).
export const STAT_MINIMUMS = {
    orders: 50,
    customers: 25,
    pincodes: 10,
    reviews: 10,   // reviews needed before an average rating is shown
    products: 10,
}

const fetchStoreStats = async () => {
    await connectDB()

    const [orderRows, ratingRows, products] = await Promise.all([
        OrderModel.aggregate([
            { $match: { deletedAt: null, status: { $nin: INVALID_STATUSES } } },
            {
                $facet: {
                    orders: [{ $count: 'n' }],
                    customers: [
                        { $group: { _id: { $toLower: { $trim: { input: '$email' } } } } },
                        { $count: 'n' },
                    ],
                    pincodes: [
                        { $match: { pincode: { $type: 'string', $ne: '' } } },
                        { $group: { _id: { $trim: { input: '$pincode' } } } },
                        { $count: 'n' },
                    ],
                },
            },
        ]),
        ReviewModel.aggregate([
            { $match: { deletedAt: null } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]),
        ProductModel.countDocuments({ deletedAt: null }),
    ])

    const facet = orderRows[0] || {}
    const count = (key) => facet[key]?.[0]?.n || 0
    const rating = ratingRows[0]

    return {
        orders: count('orders') + STAT_BASELINES.orders,
        customers: count('customers') + STAT_BASELINES.customers,
        pincodes: count('pincodes'),
        ratingAvg: rating?.avg ? Number(rating.avg.toFixed(1)) : 0,
        reviewCount: rating?.count || 0,
        products,
    }
}

// Counters don't need to tick per order; an hourly refresh keeps the band
// honest without a query on every homepage render.
export const getStoreStats = unstable_cache(
    fetchStoreStats,
    [STORE_STATS_TAG],
    {
        revalidate: 3600,
        tags: [STORE_STATS_TAG],
    }
)
