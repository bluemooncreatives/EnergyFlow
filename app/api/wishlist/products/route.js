import { connectDB } from '@/lib/databaseConnection'
import { getWishlistProducts } from '@/lib/services/wishlistService'
import { readJson, wishlistError, wishlistResponse } from '@/lib/wishlistApi'

// POST { productIds } → product cards for the ones still on sale, in order.
// Public: guests keep their list on the device and need the same live data
// (current prices, availability) as signed-in shoppers. It only reads catalogue
// data anyone can see on the shop page.
export async function POST(request) {
    try {
        await connectDB()
        const body = await readJson(request)
        const products = await getWishlistProducts(body?.productIds)
        return wishlistResponse(true, 200, 'Wishlist products.', { products })
    } catch (error) {
        return wishlistError(error)
    }
}
