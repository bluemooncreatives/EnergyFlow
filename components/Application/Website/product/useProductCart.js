'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { addIntoCart } from '@/store/reducer/cartReducer'
import { useCartLine } from '@/hooks/useCartLine'
import { showToast } from '@/lib/showToast'
import { WEBSITE_BUY_NOW } from '@/routes/WebsiteRoute'

// Cart actions for the pack currently selected on the product page. Shared by
// the buy box and the sticky bar so both always show the same cart line.
// The cart keys lines on productId + variantId, so switching pack size
// re-evaluates everything here.
export const useProductCart = (product, variant, image) => {
    const dispatch = useDispatch()
    const router = useRouter()
    const productId = product?._id
    const variantId = variant?._id
    const { qty: cartQty, inCart, atMax, increase, decrease } = useCartLine(productId, variantId)

    const add = useCallback((qty = 1) => {
        if (!productId || !variantId) return false
        dispatch(addIntoCart({
            productId,
            variantId,
            name: product.name,
            url: product.slug,
            categorySlug: product.category?.slug || product.categorySlug,
            size: variant.size,
            mrp: variant.mrp,
            sellingPrice: variant.sellingPrice,
            media: image,
            qty,
        }))
        showToast('success', qty > 1 ? `${qty} × ${product.name} added to cart.` : `${product.name} added to cart.`)
        return true
    }, [dispatch, image, product, productId, variant, variantId])

    // Buy now checks out just this pack and leaves the cart alone.
    const buyNow = useCallback((qty = 1) => {
        if (!variantId) return
        router.push(WEBSITE_BUY_NOW(variantId, inCart ? cartQty : qty))
    }, [cartQty, inCart, router, variantId])

    return {
        canBuy: Boolean(productId && variantId && Number(variant?.sellingPrice) > 0),
        inCart,
        cartQty,
        atMax,
        add,
        increase,
        decrease,
        buyNow,
    }
}

export default useProductCart
