import dynamic from 'next/dynamic'
import { getHomeCategories } from '@/lib/services/categoryService'
import { getHomeColors } from '@/lib/services/colorService'

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
    // Prefixed so a category id can never collide with a colour key.
    id: `cat-${category.id}`,
    href: category.href,
    name: category.name,
    metaLabel: category.collectionLabel,
    secondaryLabel: String(category.year),
    previewImage: category.previewImage
})

const mapColor = (color) => ({
    id: `col-${color.id}`,
    href: color.href,
    name: color.name,
    metaLabel: color.stylesLabel,
    secondaryLabel: String(color.year),
    previewImage: color.previewImage
})

const CategoryArchiveSection = async () => {
    const [categories, colors] = await Promise.all([
        getHomeCategories(),
        getHomeColors()
    ])

    const categoryItems = (categories || []).map(mapCategory)
    const colorItems = (colors || []).map(mapColor)

    // Nothing shoppable with an image yet: hide the section entirely rather than
    // render an empty archive on the live storefront.
    if (categoryItems.length === 0 && colorItems.length === 0) return null

    // Interleave categories and colours into one continuous list — Category,
    // Colour, Category, Colour … — with any leftover from the longer list
    // appended at the end.
    const items = []
    const max = Math.max(categoryItems.length, colorItems.length)
    for (let i = 0; i < max; i++) {
        if (categoryItems[i]) items.push(categoryItems[i])
        if (colorItems[i]) items.push(colorItems[i])
    }

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
