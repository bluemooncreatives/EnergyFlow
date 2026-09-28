// Shared by server queries, cards, checkout, metadata and the sitemap.
// Persist slugs independently of display names so copy edits do not change URLs.
export function productPath(product, categorySlug) {
    const slug = typeof product === 'string' ? product : product?.slug || product?.url
    const category = categorySlug || product?.category?.slug || product?.categorySlug
    if (typeof slug !== 'string' || !slug.trim()) return '/shop'
    const segment = (value) => encodeURIComponent(value.trim().toLowerCase())
    // Old persisted carts only contain a product slug. The legacy route resolves
    // its current category from the database and permanently redirects.
    return typeof category === 'string' && category.trim()
        ? `/shop/${segment(category)}/${segment(slug)}`
        : `/product/${segment(slug)}`
}

export function withProductQuery(path, query = {}) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        for (const entry of Array.isArray(value) ? value : [value]) {
            if (typeof entry === 'string') params.append(key, entry)
        }
    }
    return params.size ? `${path}?${params}` : path
}
