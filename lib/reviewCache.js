import { revalidateTag } from 'next/cache'

export function revalidateReviews() {
    for (const tag of [
        'storefront-product-details',
        'storefront-related-products',
        'storefront-freshly-arrived-products',
        'storefront-daily-best-sells',
        'storefront-shop-default-products',
        'storefront-home-categories',
        'storefront-shop-filters',
        'storefront-store-stats',
    ]) revalidateTag(tag)
}
