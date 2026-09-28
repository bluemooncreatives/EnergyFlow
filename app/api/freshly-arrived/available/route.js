import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import "@/models/Media.model"
import "@/models/Category.model"

// GET — products eligible to be added to freshly arrived: active and not already
// flagged. Optional ?q= filters by name for the picker's search box.
export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const q = (request.nextUrl.searchParams.get('q') || '').trim()

        const matchQuery = { deletedAt: null, isFreshlyArrived: { $ne: true } }
        if (q) {
            matchQuery.name = { $regex: q, $options: 'i' }
        }

        const products = await ProductModel.find(matchQuery)
            .sort({ createdAt: -1 })
            .limit(100)
            .select('name slug sellingPrice mrp media category')
            // First photo + category name so the admin picker can show a
            // visual, searchable grid instead of bare names.
            .populate({ path: 'media', select: 'secure_url', options: { perDocumentLimit: 1 } })
            .populate({ path: 'category', select: 'name' })
            .lean()

        return response(true, 200, 'Available products fetched.', products)
    } catch (error) {
        return catchError(error)
    }
}
