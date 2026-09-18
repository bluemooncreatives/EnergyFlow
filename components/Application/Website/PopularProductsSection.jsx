import dynamic from 'next/dynamic'
import { getPopularProducts } from '@/lib/services/productService'

const PopularProductsSectionClient = dynamic(() => import('./PopularProductsSectionClient'))

const PopularProductsSection = async () => {
    const products = await getPopularProducts()

    return <PopularProductsSectionClient products={products || []} />
}

export default PopularProductsSection
