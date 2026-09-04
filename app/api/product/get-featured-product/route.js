import { catchError, response } from "@/lib/helperFunction";
import { getFeaturedProducts } from "@/lib/services/productService";

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
}

export async function GET() {
    try {
        const getProduct = await getFeaturedProducts()

        if (!getProduct || !getProduct.length) {
            return response(false, 404, 'Product not found.', {}, { headers: CACHE_HEADERS })
        }

        return response(true, 200, 'Product found.', getProduct, { headers: CACHE_HEADERS })

    } catch (error) {
        return catchError(error)
    }
}
