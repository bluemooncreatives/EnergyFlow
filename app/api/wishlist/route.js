import { isObjectIdString } from '@/lib/wishlistConstants'
import {
    addWishlistItem,
    clearUserWishlist,
    getUserWishlistIds,
    removeWishlistItem,
} from '@/lib/services/wishlistService'
import { readJson, requireWishlistUser, wishlistError, wishlistResponse } from '@/lib/wishlistApi'

// GET    → { ids }                      the signed-in shopper's saved product ids
// POST   { productId }                  save (idempotent)
// DELETE { productId } | { all: true }  remove one (idempotent) / clear the list
export async function GET(request) {
    try {
        const { userId, denied } = await requireWishlistUser(request)
        if (denied) return denied
        const ids = await getUserWishlistIds(userId)
        return wishlistResponse(true, 200, 'Wishlist found.', { ids })
    } catch (error) {
        return wishlistError(error)
    }
}

export async function POST(request) {
    try {
        const { userId, denied } = await requireWishlistUser(request)
        if (denied) return denied
        const body = await readJson(request)
        const productId = typeof body?.productId === 'string' ? body.productId.toLowerCase() : ''
        if (!isObjectIdString(productId)) {
            return wishlistResponse(false, 400, 'Invalid product.', { code: 'INVALID' })
        }
        const ids = await addWishlistItem(userId, productId)
        return wishlistResponse(true, 200, 'Saved to your wishlist.', { ids })
    } catch (error) {
        return wishlistError(error)
    }
}

export async function DELETE(request) {
    try {
        const { userId, denied } = await requireWishlistUser(request)
        if (denied) return denied
        const body = await readJson(request)

        if (body?.all === true) {
            const ids = await clearUserWishlist(userId)
            return wishlistResponse(true, 200, 'Wishlist cleared.', { ids })
        }

        const productId = typeof body?.productId === 'string' ? body.productId.toLowerCase() : ''
        if (!isObjectIdString(productId)) {
            return wishlistResponse(false, 400, 'Invalid product.', { code: 'INVALID' })
        }
        const ids = await removeWishlistItem(userId, productId)
        return wishlistResponse(true, 200, 'Removed from your wishlist.', { ids })
    } catch (error) {
        return wishlistError(error)
    }
}
