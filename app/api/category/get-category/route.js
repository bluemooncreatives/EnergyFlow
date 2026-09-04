import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";

import CategoryModel from "@/models/Category.model";

const CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
}

export async function GET() {
    try {

        await connectDB()

        const getCategory = await CategoryModel.find({ deletedAt: null }).select('name slug').lean()

        if (!getCategory) {
            return response(false, 404, 'Category not found.', {}, { headers: CACHE_HEADERS })
        }

        return response(true, 200, 'Category found.', getCategory, { headers: CACHE_HEADERS })

    } catch (error) {
        return catchError(error)
    }
}
