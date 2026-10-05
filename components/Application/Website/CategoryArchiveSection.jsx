import dynamic from 'next/dynamic'
import { getCategoryShowcase } from '@/lib/services/categoryService'
import { CATEGORY_ART } from './storefront/categoryArt'
import { resolveCategoryArt } from '@/lib/categoryCover'

// GSAP-driven client logic is split into its own chunk so it does not block
// parsing/hydration of the critical path.
const CategoryShowcaseClient = dynamic(() => import('./CategoryShowcaseClient'))

const WRITEUP =
    'Explore the full Energyflow range, category by category. Premium dry fruits and nuts for everyday ' +
    'energy, seeds and super foods for focused nutrition, roasted healthy snacks you can eat without ' +
    'a second thought, and millets, pulses, muesli and oats for wholesome meals. Go further and you ' +
    'will find berries and natural foods, organic and wellness products, cold pressed oils, A2 Gir ' +
    'cow bilona ghee, herbs and herbal powders, honey and natural sweeteners, and corporate and ' +
    'festive hampers ready to gift. Whether you are restocking your pantry, building a daily wellness ' +
    'routine, or choosing a thoughtful gift, start here and find exactly what you need.'

const mapCategory = (category) => {
    const art = resolveCategoryArt(category, CATEGORY_ART[category.slug])
    return {
    id: `cat-${category.id}`,
    href: category.href,
    name: category.name,
    count: category.productCount || 0,
    previewImage: art.src,
    alt: art.alt,
    imagePosition: art.position || 'center',
    priceFrom: category.priceFrom,
    maxDiscount: category.maxDiscount || 0,
    products: category.products || [],
    }
}

const CategoryArchiveSection = async ({ tone }) => {
    const categories = await getCategoryShowcase()

    const items = (categories || []).map(mapCategory)

    // No active categories with products: hide the empty showcase.
    if (items.length === 0) return null

    return <CategoryShowcaseClient items={items} writeup={WRITEUP} tone={tone} />
}

export default CategoryArchiveSection
