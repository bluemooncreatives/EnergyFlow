import { notFound } from 'next/navigation'
import { resolveProductRoute } from '@/lib/services/productRouteService'

export default async function ProductLayout({ children, params }) {
    const { slug } = await params
    if (!await resolveProductRoute(slug)) notFound()
    return children
}
