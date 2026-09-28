'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { addIntoCart, decreaseQuantity, increaseQuantity, removeFromCart } from '@/store/reducer/cartReducer'
import { useHydrated } from '@/hooks/useHydrated'
import { MAX_CART_QTY } from '@/lib/cartConstants'
import { showToast } from '@/lib/showToast'
import { WEBSITE_BUY_NOW } from '@/routes/WebsiteRoute'

// Cart actions for the pack currently selected on the product page. Shared by
// the buy box and the sticky bar so both always show the same cart line.
// The cart keys lines on productId + variantId, so switching pack size
// re-evaluates everything here.
export const useProductCart = (product, variant, image) => {
    const dispatch = useDispatch()
    const router = useRouter()
    const hydrated = useHydrated()
    const productId = product?._id
    const variantId = variant?._id

    const line = useSelector((store) =>
        variantId
            ? store.cartStore.products.find((p) => p.productId === productId && p.variantId === variantId) || null
            : null
    )

    // The persisted cart only exists on the client; match the server's empty
    // cart until hydration so the first paint never mismatches.
    const inCart = hydrated && Boolean(line)
    const cartQty = inCart ? line.qty : 0
    const key = useMemo(() => ({ productId, variantId }), [productId, variantId])

    const add = useCallback((qty = 1) => {
        if (!productId || !variantId) return false
        dispatch(addIntoCart({
            productId,
            variantId,
            name: product.name,
            url: product.slug,
            size: variant.size,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: image,
            qty,
        }))
        showToast('success', qty > 1 ? `${qty} × ${product.name} added to cart.` : `${product.name} added to cart.`)
        return true
    }, [dispatch, image, product, productId, variant, variantId])

    const increase = useCallback(() => {
        if (!inCart || cartQty >= MAX_CART_QTY) return
        dispatch(increaseQuantity(key))
    }, [cartQty, dispatch, inCart, key])

    // Stepping below one removes the line, the quick-commerce pattern.
    const decrease = useCallback(() => {
        if (!inCart) return
        if (cartQty <= 1) {
            dispatch(removeFromCart(key))
            showToast('success', 'Removed from cart.')
            return
        }
        dispatch(decreaseQuantity(key))
    }, [cartQty, dispatch, inCart, key])

    // Buy now checks out just this pack and leaves the cart alone.
    const buyNow = useCallback((qty = 1) => {
        if (!variantId) return
        router.push(WEBSITE_BUY_NOW(variantId, inCart ? cartQty : qty))
    }, [cartQty, inCart, router, variantId])

    return {
        canBuy: Boolean(productId && variantId && Number(variant?.sellingPrice) > 0),
        inCart,
        cartQty,
        atMax: cartQty >= MAX_CART_QTY,
        add,
        increase,
        decrease,
        buyNow,
    }
}

export default useProductCart
