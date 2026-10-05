import dynamic from 'next/dynamic'
import { getFreshlyArrivedProducts } from '@/lib/services/productService'

const PopularProductsSectionClient = dynamic(() => import('./PopularProductsSectionClient'))

// Shoppers see this grid as "Popular right now"; admins fill it from the
// Freshly Arrived curation screen (/admin/freshly-arrived).
const PopularProductsSection = async ({ tone, availability }) => {
    const products = await getFreshlyArrivedProducts()

    return <PopularProductsSectionClient products={products || []} tone={tone} availability={availability} />
}

export default PopularProductsSection
