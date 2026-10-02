import { isAuthenticated } from '@/lib/authentication'
import { catchError, response } from '@/lib/helperFunction'
import { WishlistError } from '@/lib/services/wishlistService'

// Wishlist data is per shopper and changes on every click — never cache it.
export const NO_STORE = { headers: { 'Cache-Control': 'private, no-store' } }

export const wishlistResponse = (success, statusCode, message, data = {}) =>
    response(success, statusCode, message, data, NO_STORE)

// Resolves the signed-in customer, or returns the 401 response to send.
export const requireWishlistUser = async (request) => {
    const auth = await isAuthenticated('user', request)
    if (!auth.isAuth || !auth.userId) {
        return { denied: wishlistResponse(false, 401, 'Please sign in to use your account wishlist.', { code: 'SESSION' }) }
    }
    return { userId: auth.userId }
}

// Bodies are optional on DELETE and may be malformed anywhere.
export const readJson = async (request) => {
    try {
        return await request.json()
    } catch {
        return null
    }
}

export const wishlistError = (error) => {
    if (error instanceof WishlistError) {
        return wishlistResponse(false, error.status, error.message, { code: error.code })
    }
    return catchError(error)
}
