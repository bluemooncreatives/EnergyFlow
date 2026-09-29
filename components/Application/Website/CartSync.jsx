'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch, useStore } from 'react-redux'
import axios from 'axios'
import { persistor } from '@/store/store'
import { syncCartLines } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'
import { WEBSITE_CHECKOUT } from '@/routes/WebsiteRoute'

// A tab that comes back after this long re-checks prices.
const STALE_AFTER_MS = 10 * 60 * 1000

let lastSync = 0
let inFlight = false

/**
 * Keeps the stored cart honest. The cart lives in localStorage and can be days
 * old; every total built from it (the bottom bar, the drawer, the cart page)
 * would otherwise show whatever the prices were when it was added. Once per
 * visit, after the stored cart has loaded, the lines are re-priced by the
 * server (the same endpoint checkout uses) and anything no longer sold is
 * dropped. Checkout does its own verification, so it is skipped there.
 *
 * Renders nothing. Failures are silent: the stale cart still works, and
 * checkout re-verifies before any payment.
 */
const CartSync = () => {
    const dispatch = useDispatch()
    const store = useStore()
    const pathname = usePathname()
    const onCheckout = pathname?.startsWith(WEBSITE_CHECKOUT)

    useEffect(() => {
        if (onCheckout) return

        const sync = async () => {
            if (inFlight || Date.now() - lastSync < STALE_AFTER_MS) return
            const products = store.getState().cartStore.products
            if (!products.length) return

            const requested = products.map((p) => p.variantId)
            inFlight = true
            try {
                const { data } = await axios.post('/api/cart-verification', products.map((p) => ({
                    productId: p.productId,
                    variantId: p.variantId,
                    qty: p.qty,
                })))
                if (!data?.success || !Array.isArray(data.data)) return
                lastSync = Date.now()

                const available = new Set(data.data.map((line) => line.variantId))
                const dropped = requested.filter((id) => !available.has(id)).length
                dispatch(syncCartLines({ requested, lines: data.data }))
                if (dropped > 0) {
                    showToast('warning', dropped === 1
                        ? 'An item in your cart is no longer available and was removed.'
                        : `${dropped} items in your cart are no longer available and were removed.`)
                }
            } catch {
                // Offline or server error: keep the stored cart as it is.
            } finally {
                inFlight = false
            }
        }

        // Wait for redux-persist to load the stored cart before reading it.
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

        const onVisible = () => { if (document.visibilityState === 'visible') sync() }
        document.addEventListener('visibilitychange', onVisible)
        return () => {
            unsubscribe?.()
            document.removeEventListener('visibilitychange', onVisible)
        }
    }, [dispatch, onCheckout, store])

    return null
}

export default CartSync
