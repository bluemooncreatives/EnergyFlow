'use client'

import { useEffect } from 'react'
import { useSelector, useStore } from 'react-redux'
import { persistor } from '@/store/store'
import { setWishlist } from '@/store/reducer/wishlistReducer'
import { bumpWishlistVersion, wishlistRequest, wishlistRuntime } from '@/hooks/useWishlist'
import { showToast } from '@/lib/showToast'

// A tab that comes back after this long re-reads the account list, so saves
// made on another device or tab show up.
const STALE_AFTER_MS = 30 * 1000

let lastSync = 0
let lastSyncedUser = null
let inFlight = false

/**
 * Keeps the on-device wishlist in step with who is signed in. Runs once the
 * stored list has loaded and the session check has finished:
 *
 *   signed-in customer, guest list on the device → merge it into the account
 *   signed-in customer, their own list            → refresh from the server
 *   signed-in customer, someone else's list       → replace with theirs
 *   guest / admin, a list owned by an account     → drop it (the session ended
 *                                                   without a logout; the list
 *                                                   is safe on the server)
 *
 * Renders nothing. Network failures keep the current list; the next visit or
 * tab focus tries again.
 */
const WishlistSync = () => {
    const store = useStore()
    const hydrated = useSelector((state) => state.authStore?.hydrated)
    const auth = useSelector((state) => state.authStore?.auth)
    const userId = auth?.role === 'user' && auth?._id ? String(auth._id) : null

    useEffect(() => {
        if (!hydrated) return
        let cancelled = false

        const sync = async ({ background = false } = {}) => {
            const { ids, ownerId } = store.getState().wishlistStore

            if (!userId) {
                if (ownerId) {
                    bumpWishlistVersion()
                    store.dispatch(setWishlist({ ids: [], ownerId: null }))
                }
                return
            }

            if (wishlistRuntime.pending.size > 0) return
            // Only a background refresh yields to one already running; the first
            // sync for a newly signed-in user always goes ahead.
            if (background && (inFlight || (lastSyncedUser === userId && Date.now() - lastSync < STALE_AFTER_MS))) return

            const version = wishlistRuntime.version
            inFlight = true
            try {
                if (!ownerId && ids.length > 0) {
                    const result = await wishlistRequest('post', '/api/wishlist/merge', { productIds: ids })
                    if (cancelled) return
                    // An edit made while merging already went to the server;
                    // keep what is on screen and let the next refresh settle it.
                    const edited = wishlistRuntime.version !== version
                    store.dispatch(setWishlist({
                        ids: edited ? store.getState().wishlistStore.ids : result.ids,
                        ownerId: userId,
                    }))
                    lastSync = edited ? 0 : Date.now()
                    if (result.added > 0) {
                        showToast('success', result.added === 1
                            ? 'The item you saved on this device is now in your account wishlist.'
                            : `The ${result.added} items you saved on this device are now in your account wishlist.`)
                    }
                    if (result.overLimit > 0) {
                        showToast('warning', `${result.overLimit} saved ${result.overLimit === 1 ? 'item' : 'items'} didn’t fit — your wishlist is full.`)
                    }
                } else {
                    const result = await wishlistRequest('get', '/api/wishlist')
                    if (cancelled) return
                    if (wishlistRuntime.version !== version) {
                        lastSync = 0
                        return
                    }
                    const current = store.getState().wishlistStore
                    const same = current.ownerId === userId
                        && current.ids.length === result.ids.length
                        && current.ids.every((id, i) => id === result.ids[i])
                    if (!same) store.dispatch(setWishlist({ ids: result.ids, ownerId: userId }))
                    lastSync = Date.now()
                }
                lastSyncedUser = userId
            } catch {
                // Never show another account's hearts while we can't refresh.
                if (!cancelled && ownerId && ownerId !== userId) {
                    bumpWishlistVersion()
                    store.dispatch(setWishlist({ ids: [], ownerId: userId }))
                }
            } finally {
                inFlight = false
            }
        }

        // Wait for redux-persist to load the stored list before reading it.
        let unsubscribe = null
        if (persistor.getState().bootstrapped) {
            sync()
        } else {
            unsubscribe = persistor.subscribe(() => {
                if (!persistor.getState().bootstrapped) return
                unsubscribe?.()
                unsubscribe = null
                sync()
            })
        }

        const onVisible = () => { if (document.visibilityState === 'visible') sync({ background: true }) }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            cancelled = true
            unsubscribe?.()
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [hydrated, store, userId])

    return null
}

export default WishlistSync
