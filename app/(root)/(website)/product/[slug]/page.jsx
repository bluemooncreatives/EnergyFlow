import { notFound, permanentRedirect } from 'next/navigation'
import { resolveProductRoute } from '@/lib/services/productRouteService'
import { productPath, withProductQuery } from '@/lib/productRoute'

export default async function LegacyProductPage({ params, searchParams }) {
    const { slug } = await params
    const product = await resolveProductRoute(slug)
    if (!product) notFound()
    permanentRedirect(withProductQuery(productPath(product), await searchParams))
}
