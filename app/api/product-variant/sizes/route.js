import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import { sortSizes } from "@/lib/utils";
import ProductVariantModel from "@/models/ProductVariant.model";

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
}

// The admin variant form asks for `?fresh=1` so a pack size added on the
// previous save shows up immediately instead of after the CDN window.
const NO_STORE_HEADERS = {
    'Cache-Control': 'no-store'
}

export async function GET(request) {
    try {
        const headers = request.nextUrl.searchParams.get('fresh') ? NO_STORE_HEADERS : CACHE_HEADERS

        await connectDB()

        const getSize = await ProductVariantModel.aggregate([
            { $match: { deletedAt: null } },
            { $sort: { _id: 1 } },
            {
                $group: {
                    _id: "$size",
                    first: { $first: "$_id" }
                }
            },
            { $sort: { first: 1 } },
            { $project: { _id: 0, size: "$_id" } }
        ])

        if (!getSize.length) {
            return response(false, 404, 'Pack size not found.', {}, { headers })
        }

        // Ordered by pack weight rather than insertion order.
        const sizes = sortSizes(getSize.map(item => item.size))

        return response(true, 200, 'Pack size found.', sizes, { headers })

    } catch (error) {
        return catchError(error)
    }
}
