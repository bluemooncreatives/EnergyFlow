import ShopClient from '@/components/Application/Website/ShopClient'
import { getDefaultShopProducts, getShopFilters, getShopProducts } from '@/lib/services/shopService'

import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import { CloudinaryPreconnect } from '@/lib/seo'

const DESCRIPTION =
    'Shop dry fruits, nuts, dried berries, seeds, superfoods, flavoured makhana, healthy snacks, Ayurvedic herbs, chocolates and dry fruit gift boxes online. Delivered across India.'

const TITLE = 'Shop Dry Fruits, Nuts & Healthy Snacks Online'

const BASE_METADATA = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/shop' },
    openGraph: {
        title: `${TITLE} | Energyflow`,
        description: DESCRIPTION,
        url: '/shop',
    },
    twitter: {
        title: `${TITLE} | Energyflow`,
        description: DESCRIPTION,
    },
}

// Only bare /shop is an indexable document. A single-category view is the
// same listing as its /category/… landing page, so it points its canonical
// there; searches, filters, sorts and pages are endless permutations that
// stay crawlable (follow) but out of the index.
export async function generateMetadata({ searchParams }) {
    const params = (await searchParams) ?? {}
    const keys = Object.keys(params).filter((key) => params[key] !== undefined && params[key] !== '')
    if (keys.length === 0) return BASE_METADATA

    const category = typeof params.category === 'string' ? params.category : ''
    if (keys.length === 1 && category && !category.includes(',')) {
        return { ...BASE_METADATA, alternates: { canonical: WEBSITE_CATEGORY(category.toLowerCase()) } }
    }

    return { ...BASE_METADATA, robots: { index: false, follow: true } }
}

const buildSearchParamString = (searchParams) => {
    if (!searchParams) return ''
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => params.append(key, item))
        } else if (value !== undefined && value !== null) {
            params.set(key, value)
        }
    })
    return params.toString()
}

const Shop = async ({ searchParams }) => {
    const resolvedSearchParams = (await searchParams) ?? {}
    const initialSearchParamsString = buildSearchParamString(resolvedSearchParams)
    const [filters, { products, total, totalPages }] = await Promise.all([
        getShopFilters(),
        // Bare /shop (no filters/search/sort) serves the cached default page;
        // any query param falls through to the fully dynamic aggregation.
        initialSearchParamsString === ''
            ? getDefaultShopProducts()
            : getShopProducts({
                size: resolvedSearchParams?.size,
                minPrice: resolvedSearchParams?.minPrice,
                maxPrice: resolvedSearchParams?.maxPrice,
                category: resolvedSearchParams?.category,
                bestseller: resolvedSearchParams?.bestseller,
                freshlyArrived: resolvedSearchParams?.freshlyArrived,
                q: resolvedSearchParams?.q,
                sort: resolvedSearchParams?.sort,
                limit: resolvedSearchParams?.limit,
                page: resolvedSearchParams?.page,
            })
    ])

    return (
        <>
            <CloudinaryPreconnect />
            <ShopClient
                initialFilters={filters}
                initialProducts={products}
                initialTotal={total}
                initialTotalPages={totalPages}
                initialSearchParamsString={initialSearchParamsString}
            />
        </>
    )
}

export default Shop
