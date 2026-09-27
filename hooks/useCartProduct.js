'use client'

import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { showToast } from '@/lib/showToast'
import { useHydrated } from '@/hooks/useHydrated'

// One place for "add this card's product to the cart". Storefront cards quick-add
// the product's default (cheapest) variant — the cart keys lines on variantId, so
// a product without a variant cannot be added and `canAdd` is false.
//
// The selector returns a boolean rather than the cart array, so a card only
// re-renders when ITS in-cart state flips, not on every cart change.
export const useCartProduct = (product) => {
    const dispatch = useDispatch()
    const variant = product?.defaultVariant || null
    const productId = product?._id
    const variantId = variant?._id

    const hydrated = useHydrated()
    const inCartStored = useSelector((store) =>
        Boolean(variantId) &&
        store.cartStore.products.some((item) => item.productId === productId && item.variantId === variantId)
    )
    // The persisted cart is client-only; match the server's empty cart until hydrated.
    const inCart = hydrated && inCartStored

    const addToCart = useCallback((event) => {
        event?.preventDefault?.()
        event?.stopPropagation?.()
        if (!product || !variant) return false

        dispatch(addIntoCart({
            productId: product._id,
            variantId: variant._id,
            name: product.name,
            url: product.slug,
            size: variant.size,
            mrp: variant.mrp ?? product.mrp,
            sellingPrice: variant.sellingPrice ?? product.sellingPrice,
            media: product?.media?.[0]?.secure_url || imgPlaceholder.src,
            qty: 1,
        }))
        showToast('success', `${product.name} added to cart.`)
        return true
    }, [dispatch, product, variant])

    return { variant, inCart, canAdd: Boolean(variant), addToCart }
}

export default useCartProduct
