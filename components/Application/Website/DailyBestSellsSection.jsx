import dynamic from 'next/dynamic'
import { dealHasEnded } from '@/lib/dealsShared'
import { getDealsSection } from '@/lib/services/dealsService'

const DailyBestSellsSectionClient = dynamic(() => import('./DailyBestSellsSectionClient'))

// Admin → Deals of the Month configures everything here: products, copy,
// countdown and banner.
const DailyBestSellsSection = async ({ tone }) => {
    const { settings, products } = await getDealsSection()

    // Switched off, nothing to show (no picks and nothing marked down), or a
    // custom deadline has passed: a deal rail with no live deal is worse than
    // no rail, so the whole section drops out. The deadline is checked here,
    // outside the cache, and again on the client as the timer runs out.
    if (!settings.section.enabled || !products?.length || dealHasEnded(settings.countdown)) return null

    return <DailyBestSellsSectionClient products={products} settings={settings} tone={tone} />
}

export default DailyBestSellsSection
