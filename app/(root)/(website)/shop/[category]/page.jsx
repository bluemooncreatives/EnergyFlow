import { permanentRedirect } from 'next/navigation'
import { WEBSITE_CATEGORY } from '@/routes/WebsiteRoute'
import { withProductQuery } from '@/lib/productRoute'

export default async function ShopCategoryPage({ params, searchParams }) {
    const { category } = await params
    permanentRedirect(withProductQuery(WEBSITE_CATEGORY(encodeURIComponent(category.toLowerCase())), await searchParams))
}
