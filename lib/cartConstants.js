// Single source of truth for cart quantity limits. Used by the cart reducer,
// the product detail buy-box, the cart page stepper AND the server-side order
// validation so the UI cap and the backend guard can never drift apart.
export const MAX_CART_QTY = 10
export const MIN_CART_QTY = 1
