import { revalidatePath, revalidateTag } from 'next/cache'

export function revalidateCatalogue() {
    for (const tag of [
        'storefront-product-details', 'storefront-featured-products',
        'storefront-bestseller-products', 'storefront-freshly-arrived-products',
        'storefront-daily-best-sells',
        'storefront-related-products', 'storefront-product-routes', 'storefront-home-categories',
        'storefront-shop-filters', 'storefront-shop-default-products', 'storefront-category-landing',
        // Page photos picked from the media library (gift boxes, about us)
        // fall back when that media is trashed, and return when restored.
        'storefront-page-content',
    ]) revalidateTag(tag)
    revalidatePath('/sitemap.xml')
}
