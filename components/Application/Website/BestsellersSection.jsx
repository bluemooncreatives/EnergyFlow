import dynamic from 'next/dynamic'
import { getBestsellerProducts } from '@/lib/services/productService'

const BestsellersSectionClient = dynamic(() => import('./BestsellersSectionClient'))

const BestsellersSection = async () => {
    const products = await getBestsellerProducts()

    // Nothing curated yet: hide the section entirely rather than render empty
    // placeholder cards on the live storefront.
    if (!products || products.length === 0) return null

    return <BestsellersSectionClient products={products} />
}

export default BestsellersSection
