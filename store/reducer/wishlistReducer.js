import { createSlice } from "@reduxjs/toolkit";
import { MAX_WISHLIST_ITEMS, isObjectIdString, sanitizeWishlistIds } from "@/lib/wishlistConstants";

// Saved product ids, newest first. Persisted, so hearts render filled straight
// away on every visit.
//
// ownerId says whose list this is: null for a guest's on-device list (merged
// into their account when they sign in), or the signed-in user's id when it
// mirrors the server. WishlistSync uses it to merge, refresh, or — when a
// session ends without a logout — drop a list that belongs to someone else.
const initialState = {
    ids: [],
    ownerId: null,
}

const normalize = (id) => (isObjectIdString(id) ? id.toLowerCase() : null)

export const wishlistReducer = createSlice({
    name: 'wishlistStore',
    initialState,
    reducers: {
        addWishlistId: (state, action) => {
            const id = normalize(action.payload)
            if (!id || state.ids.includes(id) || state.ids.length >= MAX_WISHLIST_ITEMS) return
            state.ids.unshift(id)
        },
        removeWishlistId: (state, action) => {
            const id = normalize(action.payload)
            if (!id) return
            state.ids = state.ids.filter((item) => item !== id)
        },
        removeWishlistIds: (state, action) => {
            const drop = new Set((action.payload || []).map(normalize).filter(Boolean))
            if (!drop.size) return
            state.ids = state.ids.filter((item) => !drop.has(item))
        },
        // Undo for a removal: back where it was, unless it was re-saved since.
        restoreWishlistId: (state, action) => {
            const id = normalize(action.payload?.id)
            if (!id || state.ids.includes(id) || state.ids.length >= MAX_WISHLIST_ITEMS) return
            const at = Math.min(Math.max(0, Number(action.payload?.index) || 0), state.ids.length)
            state.ids.splice(at, 0, id)
        },
        // Replace the whole list (server sync, merge, cross-tab, rollback).
        setWishlist: (state, action) => {
            const { ids, ownerId } = action.payload || {}
            state.ids = sanitizeWishlistIds(ids)
            if (ownerId !== undefined) state.ownerId = ownerId || null
        },
    }
})

export const {
    addWishlistId,
    removeWishlistId,
    removeWishlistIds,
    restoreWishlistId,
    setWishlist,
} = wishlistReducer.actions

export const selectWishlistIds = (store) => store.wishlistStore?.ids || []
export const selectWishlistCount = (store) => store.wishlistStore?.ids?.length || 0

export default wishlistReducer.reducer
