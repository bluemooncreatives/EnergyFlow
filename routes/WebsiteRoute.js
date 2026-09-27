export const WEBSITE_HOME = "/"
export const WEBSITE_LOGIN = "/auth/login"
export const WEBSITE_REGISTER = "/auth/register"
export const WEBSITE_RESETPASSWORD = "/auth/reset-password"

export const WEBSITE_SHOP = "/shop"

export const WEBSITE_PRODUCT_DETAILS = (slug) => slug ? `/product/${slug}` : '/product'

export const WEBSITE_CART = "/cart"
export const WEBSITE_CHECKOUT = "/checkout"
// Buy now: a single-item checkout carried in the URL, so it never touches the
// cart and survives the sign-in redirect (the middleware keeps the query).
export const WEBSITE_BUY_NOW = (variantId, qty = 1) =>
    `${WEBSITE_CHECKOUT}?buy=${encodeURIComponent(variantId)}&qty=${qty}`

export const WEBSITE_ORDER_DETAILS = (order_id) => `/order-details/${order_id}`


// User routes 
export const USER_DASHBOARD = "/my-account"
export const USER_PROFILE = "/profile"
export const USER_ORDERS = "/orders"