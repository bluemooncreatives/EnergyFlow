import { catchError, response } from "@/lib/helperFunction";
import { getProductDetailsBySlug } from "@/lib/services/productService";

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360'
}

export async function GET(request, { params }) {
    try {
        const getParams = await params
        const slug = getParams.slug

        const searchParams = request.nextUrl.searchParams
        const size = searchParams.get('size')
        const color = searchParams.get('color')

        const productData = await getProductDetailsBySlug(slug, size, color)
        if (!productData) {
            return response(false, 404, 'Product not found.', {}, { headers: CACHE_HEADERS })
        }

        return response(true, 200, 'Product data found.', productData, { headers: CACHE_HEADERS })

    } catch (error) {
        return catchError(error)
    }
}
