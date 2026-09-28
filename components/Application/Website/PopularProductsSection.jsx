import dynamic from 'next/dynamic'
import { getPopularProducts } from '@/lib/services/productService'

const PopularProductsSectionClient = dynamic(() => import('./PopularProductsSectionClient'))

const PopularProductsSection = async ({ tone, availability }) => {
    const products = await getPopularProducts()

    return <PopularProductsSectionClient products={products || []} tone={tone} availability={availability} />
}

export default PopularProductsSection
