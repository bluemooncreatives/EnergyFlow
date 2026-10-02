'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useStore } from 'react-redux'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { MAX_WISHLIST_ITEMS, isObjectIdString } from '@/lib/wishlistConstants'
import { WEBSITE_LOGIN, WEBSITE_WISHLIST } from '@/routes/WebsiteRoute'
import {
    addWishlistId,
    removeWishlistId,
    restoreWishlistId,
    selectWishlistIds,
    setWishlist,
} from '@/store/reducer/wishlistReducer'

// Shared with WishlistSync. `version` changes on every local edit so a server
// read that started before the edit is not allowed to overwrite it; `pending`
// holds the products with a save/remove request in flight.
export const wishlistRuntime = {
    version: 0,
    pending: new Set(),
}
export const bumpWishlistVersion = () => { wishlistRuntime.version += 1 }

// Signed-in customers keep the list on their account; guests (and admins
// browsing the store) keep it on this device. Before the session check has
// finished, a list that already belongs to an account means "signed in".
export const isAccountWishlist = (state) => {
    const { auth, hydrated } = state.authStore || {}
    if (auth) return auth.role === 'user'
    if (!hydrated) return Boolean(state.wishlistStore?.ownerId)
    return false
}

export const wishlistRequest = async (method, url, body) => {
    const { data } = await axios({ method, url, data: body })
    if (!data?.success) {
        const error = new Error(data?.message || 'Could not update your wishlist.')
        error.status = data?.statusCode
        error.code = data?.data?.code
        throw error
    }
    return data.data
}

const loginUrl = (pathname) => `${WEBSITE_LOGIN}?callback=${encodeURIComponent(pathname || WEBSITE_WISHLIST)}`

const reportFailure = (error, { router, pathname }) => {
    if (error?.code === 'SESSION' || error?.status === 401) {
        showToast('error', 'Your session has ended. Sign in again to update your wishlist.', {
            action: { label: 'Sign in', onClick: () => router.push(loginUrl(pathname)) },
        })
        return
    }
    if (error?.code === 'LIMIT' || error?.code === 'UNAVAILABLE') {
        showToast('warning', error.message)
        return
    }
    showToast('error', axios.isAxiosError(error) && !error.response
        ? 'You appear to be offline. Your wishlist wasn’t changed.'
        : 'Could not update your wishlist. Please try again.')
}

/**
 * Saves or removes one product. The heart flips at once; for an account list
 * the change is then written to the server and undone if that fails. Returns
 * true when the change stuck.
 */
export const setWishlistItem = async ({ store, router, pathname, id, name, save, index, quiet = false }) => {
    if (!isObjectIdString(id)) return false
    id = id.toLowerCase()
    if (wishlistRuntime.pending.has(id)) return false

    const state = store.getState()
    const ids = selectWishlistIds(state)
    const position = ids.indexOf(id)
    if (save === (position >= 0)) return true

    if (save && ids.length >= MAX_WISHLIST_ITEMS) {
        showToast('warning', `Your wishlist is full (${MAX_WISHLIST_ITEMS} items). Remove something to save this.`)
        return false
    }

    const account = isAccountWishlist(state)
    const label = name || 'This item'

    bumpWishlistVersion()
    store.dispatch(save
        ? (typeof index === 'number' ? restoreWishlistId({ id, index }) : addWishlistId(id))
        : removeWishlistId(id))

    if (account) {
        wishlistRuntime.pending.add(id)
        try {
            await wishlistRequest(save ? 'post' : 'delete', '/api/wishlist', { productId: id })
        } catch (error) {
            bumpWishlistVersion()
            store.dispatch(save ? removeWishlistId(id) : restoreWishlistId({ id, index: position }))
            reportFailure(error, { router, pathname })
            return false
        } finally {
            wishlistRuntime.pending.delete(id)
        }
    }

    if (quiet) return true

    if (save) {
        const onWishlistPage = pathname === WEBSITE_WISHLIST
        showToast('success', `${label} saved to your wishlist.`, {
            // The first save as a guest says where the list lives.
            ...(!account && ids.length === 0 ? { description: 'It’s kept on this device. Sign in to keep it on every device.' } : {}),
            ...(!onWishlistPage ? { action: { label: 'View', onClick: () => router.push(WEBSITE_WISHLIST) } } : {}),
        })
    } else {
        showToast('info', `${label} removed from your wishlist.`, {
            action: {
                label: 'Undo',
                onClick: () => setWishlistItem({ store, router, pathname, id, name, save: true, index: position, quiet: true }),
            },
        })
    }
    return true
}

/**
 * Empties the list, with Undo. An account list is restored through the merge
 * endpoint, which keeps the original order.
 */
export const clearWishlistItems = async ({ store, router, pathname }) => {
    const state = store.getState()
    const previous = selectWishlistIds(state)
    if (!previous.length) return true
    const account = isAccountWishlist(state)

    bumpWishlistVersion()
    store.dispatch(setWishlist({ ids: [] }))

    if (account) {
        try {
            await wishlistRequest('delete', '/api/wishlist', { all: true })
        } catch (error) {
            bumpWishlistVersion()
            store.dispatch(setWishlist({ ids: previous }))
            reportFailure(error, { router, pathname })
            return false
        }
    }

    showToast('info', 'Your wishlist was cleared.', {
        action: {
            label: 'Undo',
            onClick: async () => {
                bumpWishlistVersion()
                if (!isAccountWishlist(store.getState())) {
                    store.dispatch(setWishlist({ ids: previous }))
                    return
                }
                try {
                    const result = await wishlistRequest('post', '/api/wishlist/merge', { productIds: previous })
                    store.dispatch(setWishlist({ ids: result.ids }))
                } catch (error) {
                    reportFailure(error, { router, pathname })
                }
            },
        },
    })
    return true
}

// Heart state + toggle for one product.
export const useWishlist = (productId, name) => {
    const store = useStore()
    const router = useRouter()
    const pathname = usePathname()
    const id = isObjectIdString(productId) ? productId.toLowerCase() : null
    const saved = useSelector((state) => (id ? selectWishlistIds(state).includes(id) : false))
    const [pending, setPending] = useState(false)

    const toggle = useCallback(async (event) => {
        event?.preventDefault?.()
        event?.stopPropagation?.()
        if (!id) return false
        const save = !selectWishlistIds(store.getState()).includes(id)
        setPending(true)
        try {
            return await setWishlistItem({ store, router, pathname, id, name, save })
        } finally {
            setPending(false)
        }
    }, [id, name, pathname, router, store])

    return { saved, toggle, pending, available: Boolean(id) }
}

export const useWishlistActions = () => {
    const store = useStore()
    const router = useRouter()
    const pathname = usePathname()

    const remove = useCallback(
        (id, name) => setWishlistItem({ store, router, pathname, id, name, save: false }),
        [pathname, router, store]
    )
    const clear = useCallback(() => clearWishlistItems({ store, router, pathname }), [pathname, router, store])

    return { remove, clear }
}

export default useWishlist
