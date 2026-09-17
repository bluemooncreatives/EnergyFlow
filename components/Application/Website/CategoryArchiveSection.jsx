import dynamic from 'next/dynamic'
import { getHomeCategories } from '@/lib/services/categoryService'

// Heavy GSAP/ScrollTrigger client logic is split into its own chunk so it does
// not block parsing/hydration of the critical path.
const ArchiveSectionClient = dynamic(() => import('./ArchiveSectionClient'))

const WRITEUP =
    'Discover signature silhouettes, everyday essentials, and statement pieces curated for every ' +
    'wardrobe. Each category brings together styles designed for comfort, movement, and everyday ' +
    'confidence, from relaxed daily basics to elevated looks for special moments. Explore collections ' +
    'that balance fit, fabric, and finish, so every piece feels as good as it looks. Whether you are ' +
    'building a capsule wardrobe, updating seasonal staples, or searching for one standout outfit, this ' +
    'archive helps you find the right mood, shape, and style with ease.'

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
