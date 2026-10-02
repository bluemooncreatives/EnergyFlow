import { mergeWishlist } from '@/lib/services/wishlistService'
import { readJson, requireWishlistUser, wishlistError, wishlistResponse } from '@/lib/wishlistApi'

// POST { productIds } → { ids, added, overLimit }
// Folds the list a shopper built as a guest into their account on sign-in.
export async function POST(request) {
    try {
        const { userId, denied } = await requireWishlistUser(request)
        if (denied) return denied
        const body = await readJson(request)
        const result = await mergeWishlist(userId, body?.productIds)
        return wishlistResponse(true, 200, 'Wishlist merged.', result)
    } catch (error) {
        return wishlistError(error)
    }
}
