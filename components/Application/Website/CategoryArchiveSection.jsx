import dynamic from 'next/dynamic'
import { getHomeCategories } from '@/lib/services/categoryService'

// Heavy GSAP/ScrollTrigger client logic is split into its own chunk so it does
// not block parsing/hydration of the critical path.
const ArchiveSectionClient = dynamic(() => import('./ArchiveSectionClient'))

const WRITEUP =
    'Explore the full Energyflow range, category by category. Premium dry fruits and nuts for everyday ' +
    'energy, seeds and super foods for focused nutrition, roasted healthy snacks you can eat without ' +
    'a second thought, and millets, pulses, muesli and oats for wholesome meals. Go further and you ' +
    'will find berries and natural foods, organic and wellness products, cold pressed oils, A2 Gir ' +
    'cow bilona ghee, herbs and herbal powders, honey and natural sweeteners, and corporate and ' +
    'festive hampers ready to gift. Whether you are restocking your pantry, building a daily wellness ' +
    'routine, or choosing a thoughtful gift, start here and find exactly what you need.'

const mapCategory = (category) => ({
    id: `cat-${category.id}`,
    href: category.href,
    name: category.name,
    metaLabel: category.collectionLabel,
    secondaryLabel: String(category.year),
    previewImage: category.previewImage
})

const CategoryArchiveSection = async () => {
    const categories = await getHomeCategories()

    const items = (categories || []).map(mapCategory)

    // Nothing shoppable with an image yet: hide the section entirely rather than
    // render an empty archive on the live storefront.
    if (items.length === 0) return null

    return (
        <ArchiveSectionClient
            title="Categories"
            writeup={WRITEUP}
            columns={{ name: 'Category', meta: 'Collection', secondary: 'Year' }}
            items={items}
        />
    )
}

export default CategoryArchiveSection
