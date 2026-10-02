import dynamic from 'next/dynamic'
import { COMPANY } from '@/lib/company'
import { getStoreStats, STAT_MINIMUMS } from '@/lib/services/storeStatsService'

const StoreStatsSectionClient = dynamic(() => import('./StoreStatsSectionClient'))

// Large counts are floored to two significant figures and marked "+"
// (1,247 → 1,200+), so the band reads cleanly and never overstates.
const roundDown = (n) => {
    if (n < 100) return { value: n, suffix: '' }
    const step = 10 ** (String(Math.floor(n)).length - 2)
    const value = Math.floor(n / step) * step
    return { value, suffix: value < n ? '+' : '' }
}

const formatCount = (n) => new Intl.NumberFormat('en-IN').format(n)

// Every figure the band can show, in display order. Each one only qualifies
// once it clears its minimum; the first four that do are shown.
const buildStats = (s) => [
    s.orders >= STAT_MINIMUMS.orders && {
        key: 'orders',
        icon: 'package',
        ...roundDown(s.orders),
        label: 'Orders served',
        caption: `Packed fresh in ${COMPANY.city} and sent to your door.`,
    },
    s.customers >= STAT_MINIMUMS.customers && {
        key: 'customers',
        icon: 'users',
        ...roundDown(s.customers),
        label: 'Kitchens stocked',
        caption: 'Different households who have ordered from us.',
    },
    s.pincodes >= STAT_MINIMUMS.pincodes && {
        key: 'pincodes',
        icon: 'map',
        ...roundDown(s.pincodes),
        label: 'Pincodes reached',
        caption: `From ${COMPANY.city} to doorsteps across India.`,
    },
    s.reviewCount >= STAT_MINIMUMS.reviews && s.ratingAvg > 0 && {
        key: 'rating',
        icon: 'star',
        value: s.ratingAvg,
        decimals: 1,
        suffix: '/5',
        label: 'Average rating',
        caption: `Across ${formatCount(s.reviewCount)} customer reviews.`,
    },
    s.products >= STAT_MINIMUMS.products && {
        key: 'products',
        icon: 'leaf',
        ...roundDown(s.products),
        label: 'Pantry essentials',
        caption: 'Dry fruits, seeds, oils and ghee on the shelf.',
    },
].filter(Boolean).slice(0, 4)

// "By the numbers": live figures from the store's own records. With fewer
// than three that clear their minimums the section drops out of the homepage
// (like the bestseller and testimonial sections) rather than showing thin or
// invented numbers.
const StoreStatsSection = async ({ tone }) => {
    let stats = []
    try {
        stats = buildStats(await getStoreStats())
    } catch {
        // A transient DB error must not take down the homepage.
        stats = []
    }

    if (stats.length < 3) return null

    return <StoreStatsSectionClient stats={stats} tone={tone} />
}

export default StoreStatsSection
