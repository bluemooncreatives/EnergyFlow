// Single source of truth for cart quantity limits. Used by the cart reducer,
// the product detail buy-box, the cart page stepper AND the server-side order
// validation so the UI cap and the backend guard can never drift apart.
export const MAX_CART_QTY = 10
export const MIN_CART_QTY = 1

// Coerce any incoming quantity into the allowed [MIN, MAX] band. Guards against
// NaN / undefined / negative / over-cap values arriving from the UI, the URL
// (buy-now links) or a stale persisted (localStorage) cart.
export const clampQty = (value) => {
    const n = Math.floor(Number(value))
    if (!Number.isFinite(n)) return MIN_CART_QTY
    return Math.min(MAX_CART_QTY, Math.max(MIN_CART_QTY, n))
}

// Flat delivery charge (₹) added once to every order. Shared by the cart
// surfaces, checkout and server-side pricing so the shown and charged totals
// always match.
export const DELIVERY_CHARGE = 99
