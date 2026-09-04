import dynamic from 'next/dynamic'
import { getFreshlyArrivedProducts } from '@/lib/services/productService'

const FeaturedProductClient = dynamic(() => import('./FeaturedProductClient'))

const FeaturedProduct = async () => {
    const products = await getFreshlyArrivedProducts()

    return <FeaturedProductClient products={products || []} />
}

export default FeaturedProduct
