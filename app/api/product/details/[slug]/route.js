import { catchError, response } from "@/lib/helperFunction";
import { getProductDetailsBySlug } from "@/lib/services/productService";
import { resolveProductRoute } from '@/lib/services/productRouteService';
import { productPath } from '@/lib/productRoute';

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360'
}

export async function GET(request, { params }) {
    try {
        const getParams = await params
        const slug = getParams.slug

        const searchParams = request.nextUrl.searchParams
        const size = searchParams.get('size')

        const resolved = await resolveProductRoute(slug)
        const productData = resolved ? await getProductDetailsBySlug(resolved.slug, size, resolved._id) : null
        if (!productData) {
            return response(false, 404, 'Product not found.', {}, { status: 404, headers: { 'Cache-Control': 'no-store' } })
        }

        return response(true, 200, 'Product data found.', { ...productData, canonicalPath: productPath(resolved) }, { headers: CACHE_HEADERS })

    } catch (error) {
        return catchError(error)
    }
}
