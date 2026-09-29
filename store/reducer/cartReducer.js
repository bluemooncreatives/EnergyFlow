import { createSelector, createSlice } from "@reduxjs/toolkit";
import { clampQty } from "@/lib/cartConstants";

const initialState = {
    count: 0,
    products: []
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
        },
        // Undo for a removal: puts the line back where it was. A no-op if the
        // same line was re-added in the meantime.
        restoreCartLine: (state, action) => {
            const { line, index } = action.payload || {}
            if (!line?.productId || !line?.variantId) return
            const exists = state.products.some(
                (product) => product.productId === line.productId && product.variantId === line.variantId
            )
            if (exists) return
            const at = Math.min(Math.max(0, Number(index) || 0), state.products.length)
            state.products.splice(at, 0, { ...line, qty: clampQty(line.qty) })
            state.count = state.products.length
        },
        // Refreshes stored lines with server prices (a persisted cart can be days
        // old). `requested` is the variantIds that were sent: any of them missing
        // from `lines` is no longer sold and is dropped. Lines added while the
        // request was in flight are left alone, and quantities are never touched.
        syncCartLines: (state, action) => {
            const { requested = [], lines = [] } = action.payload || {}
            const sent = new Set(requested)
            const fresh = new Map(lines.map((line) => [line.variantId, line]))

            state.products = state.products
                .filter((product) => !sent.has(product.variantId) || fresh.has(product.variantId))
                .map((product) => {
                    const line = fresh.get(product.variantId)
                    if (!line) return product
                    return {
                        ...product,
                        name: line.name,
                        url: line.url,
                        categorySlug: line.categorySlug,
                        size: line.size,
                        mrp: line.mrp,
                        sellingPrice: line.sellingPrice,
                        media: product.media || line.media,
                    }
                })
            state.count = state.products.length
        }

    }
})

export const {
    addIntoCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    restoreCartLine,
    syncCartLines
} = cartReducer.actions

// Totals every cart surface shows (header badge, drawer, bottom bar, cart
// page), computed once per cart change. `units` counts packs, not lines.
export const selectCartSummary = createSelector(
    [(store) => store.cartStore.products],
    (products) => {
        let units = 0
        let subtotal = 0
        let mrpTotal = 0
        for (const product of products) {
            const qty = Number(product.qty) || 0
            const price = Number(product.sellingPrice) || 0
            units += qty
            subtotal += price * qty
            mrpTotal += (Number(product.mrp) || price) * qty
        }
        return {
            lines: products.length,
            units,
            subtotal,
            mrpTotal,
            savings: Math.max(0, mrpTotal - subtotal),
        }
    }
)
export default cartReducer.reducer
