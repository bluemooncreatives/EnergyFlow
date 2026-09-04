import { catchError, response } from "@/lib/helperFunction";
import { getShopProducts } from "@/lib/services/shopService";

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180'
}

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams

        const result = await getShopProducts({
            size: searchParams.get('size'),
            color: searchParams.get('color'),
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            category: searchParams.get('category'),
            bestseller: searchParams.get('bestseller'),
            freshlyArrived: searchParams.get('freshlyArrived'),
            q: searchParams.get('q'),
            sort: searchParams.get('sort'),
            limit: searchParams.get('limit'),
            page: searchParams.get('page'),
        })

        return response(true, 200, 'Product data found.', result, { headers: CACHE_HEADERS })

    } catch (error) {
        return catchError(error)
    }
}
