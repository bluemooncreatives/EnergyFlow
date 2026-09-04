import { createSlice } from "@reduxjs/toolkit";
import { MAX_CART_QTY, MIN_CART_QTY } from "@/lib/cartConstants";

const initialState = {
    count: 0,
    products: []
}

// Coerce any incoming quantity into the allowed [MIN, MAX] band. Guards against
// NaN / undefined / negative / over-cap values arriving from the UI or from a
// stale persisted (localStorage) cart.
const clampQty = (value) => {
    const n = Math.floor(Number(value))
    if (!Number.isFinite(n)) return MIN_CART_QTY
    return Math.min(MAX_CART_QTY, Math.max(MIN_CART_QTY, n))
}

export const cartReducer = createSlice({
    name: 'cartStore',
    initialState,
    reducers: {
        addIntoCart: (state, action) => {
            const payload = action.payload
            const addQty = clampQty(payload.qty)
            const existingProduct = state.products.findIndex(
                (product) => product.productId === payload.productId && product.variantId === payload.variantId
            )

            if (existingProduct < 0) {
                // New line — store the clamped quantity.
                state.products.push({ ...payload, qty: addQty })
                state.count = state.products.length
            } else {
                // Same product + variant already in the cart: merge by adding the
                // requested quantity onto the existing line (capped), instead of
                // silently ignoring the click.
                state.products[existingProduct].qty = clampQty(
                    state.products[existingProduct].qty + addQty
                )
            }
        },
        increaseQuantity: (state, action) => {
            const { productId, variantId } = action.payload
            const existingProduct = state.products.findIndex(
                (product) => product.productId === productId && product.variantId === variantId
            )

            if (existingProduct >= 0) {
                state.products[existingProduct].qty = clampQty(
                    state.products[existingProduct].qty + 1
                )
            }
        },
        decreaseQuantity: (state, action) => {
            const { productId, variantId } = action.payload
            const existingProduct = state.products.findIndex(
                (product) => product.productId === productId && product.variantId === variantId
            )

            if (existingProduct >= 0) {
                if (state.products[existingProduct].qty > 1) {
                    state.products[existingProduct].qty -= 1
                }
            }
        },
        removeFromCart: (state, action) => {
            const { productId, variantId } = action.payload

            state.products = state.products.filter((product) => !(product.productId === productId && product.variantId === variantId))

            state.count = state.products.length
        },
        clearCart: (state, action) => {
            state.products = []
            state.count = 0
        }

    }
})

export const {
    addIntoCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart
} = cartReducer.actions
export default cartReducer.reducer
