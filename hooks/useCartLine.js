'use client'

import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { decreaseQuantity, increaseQuantity, removeFromCart, restoreCartLine } from '@/store/reducer/cartReducer'
import { useHydrated } from '@/hooks/useHydrated'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { showToast } from '@/lib/showToast'
import { formatProductName } from '@/lib/seo'

// One cart line (productId + variantId) and the − / + actions on it. Shared by
// product cards, the cart drawer and the product page so every stepper behaves
// the same: stepping below one removes the line, with an Undo in the toast.
//
// The selector returns the quantity (a number), so a component only
// re-renders when ITS line changes, not on every cart change.
export const useCartLine = (productId, variantId) => {
    const dispatch = useDispatch()
    const store = useStore()
    const hydrated = useHydrated()

    const storedQty = useSelector((state) =>
        productId && variantId
            ? state.cartStore.products.find((p) => p.productId === productId && p.variantId === variantId)?.qty || 0
            : 0
    )
    // The persisted cart is client-only; match the server's empty cart until hydrated.
    const qty = hydrated ? storedQty : 0
    const inCart = qty > 0
    const atMax = qty >= MAX_CART_QTY
    const key = useMemo(() => ({ productId, variantId }), [productId, variantId])

    const remove = useCallback(() => {
        const products = store.getState().cartStore.products
        const index = products.findIndex((p) => p.productId === productId && p.variantId === variantId)
        if (index < 0) return
        const line = products[index]
        dispatch(removeFromCart(key))
        showToast('success', `${formatProductName(line.name) || 'Item'} removed from cart.`, {
            action: { label: 'Undo', onClick: () => dispatch(restoreCartLine({ line, index })) },
        })
    }, [dispatch, key, productId, store, variantId])

    const increase = useCallback(() => {
        if (!inCart) return
        if (atMax) {
            showToast('info', `You can add up to ${MAX_CART_QTY} of each pack per order.`)
            return
        }
        dispatch(increaseQuantity(key))
    }, [atMax, dispatch, inCart, key])

    const decrease = useCallback(() => {
        if (!inCart) return
        if (qty <= 1) {
            remove()
            return
        }
        dispatch(decreaseQuantity(key))
    }, [dispatch, inCart, key, qty, remove])

    return { qty, inCart, atMax, increase, decrease, remove }
}

export default useCartLine
