import dynamic from 'next/dynamic'
import { getDailyBestSells } from '@/lib/services/productService'

const DailyBestSellsSectionClient = dynamic(() => import('./DailyBestSellsSectionClient'))

const DailyBestSellsSection = async () => {
    const products = await getDailyBestSells()

    // Nothing is discounted right now: a deal rail with no deals is worse than
    // no rail, so the whole section drops out.
    if (!products || products.length === 0) return null

    return <DailyBestSellsSectionClient products={products} />
}

export default DailyBestSellsSection
