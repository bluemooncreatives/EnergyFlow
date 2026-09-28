import { revalidatePath, revalidateTag } from 'next/cache'

export function revalidateCatalogue() {
    for (const tag of [
        'storefront-product-details', 'storefront-featured-products',
        'storefront-bestseller-products', 'storefront-freshly-arrived-products',
        'storefront-popular-products', 'storefront-daily-best-sells',
        'storefront-related-products', 'storefront-home-categories',
        'storefront-shop-filters', 'storefront-shop-default-products', 'storefront-category-landing',
    ]) revalidateTag(tag)
    revalidatePath('/sitemap.xml')
}
