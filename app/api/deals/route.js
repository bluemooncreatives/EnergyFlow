import '@/models/Category.model'
import mongoose from "mongoose"
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import { annotateSellable, loadSellableScope } from "@/lib/services/sellability"
import { DEALS_TAG } from "@/lib/services/dealsService"
import "@/models/Media.model"


// Keep only well-formed, unique ObjectIds so a malformed payload can never
// throw a Mongoose CastError or let duplicates skew the sort order.
const sanitizeIds = (rawIds) => {
    if (!Array.isArray(rawIds)) return []
    const seen = new Set()
    const valid = []
    for (const id of rawIds) {
        const str = String(id)
        if (mongoose.isValidObjectId(str) && !seen.has(str)) {
            seen.add(str)
            valid.push(str)
        }
    }
    return valid
}

// GET — current deal picks in their configured order (admin list)
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const [items, scope] = await Promise.all([
            ProductModel.find({ deletedAt: null, isDeal: true })
                .sort({ dealSortOrder: 1, createdAt: -1, _id: 1 })
                .select('name slug category sellingPrice mrp media dealSortOrder')
                .populate('media', 'secure_url alt')
                .populate({ path: 'category', select: 'slug name' })
                .lean(),
            loadSellableScope(),
        ])

        // Same rule the storefront applies: an unsellable pick is skipped there,
        // so flag it here and the admin list can say why it is missing.
        const annotated = annotateSellable(items, scope)

        return response(true, 200, 'Deal products fetched.', annotated)
    } catch (error) {
        return catchError(error)
    }
}

// POST — add one or more products to the deals list.
// Idempotent: already-added and deleted ids are ignored, and new entries are
// appended after the current highest rank.
export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()
        const ids = sanitizeIds(payload?.ids)

        if (ids.length === 0) {
            return response(false, 400, 'No valid products provided.')
        }

        // Only act on real, non-deleted products not already in the list.
        const candidates = await ProductModel.find({
            _id: { $in: ids },
            deletedAt: null,
            isDeal: { $ne: true }
        }).select('_id').lean()

        if (candidates.length === 0) {
            return response(false, 400, 'Selected products are already added or unavailable.')
        }

        // Append after the current max rank so existing order is preserved.
        const last = await ProductModel.findOne({ deletedAt: null, isDeal: true })
            .sort({ dealSortOrder: -1 })
            .select('dealSortOrder')
            .lean()
        let nextOrder = (last?.dealSortOrder ?? -1) + 1

        const candidateIds = new Set(candidates.map((product) => String(product._id)))
        const operations = ids.filter((id) => candidateIds.has(id)).map((id) => ({
            updateOne: {
                filter: { _id: id, deletedAt: null, isDeal: { $ne: true } },
                update: { $set: { isDeal: true, dealSortOrder: nextOrder++ } }
            }
        }))
        const result = await ProductModel.bulkWrite(operations)

        // Guard against a silent no-op write (e.g. a stale Mongoose model whose
        // schema predates these fields would strip them via strict mode). Without
        // this, the request would report success while nothing was persisted.
        if (!result.modifiedCount) {
            return response(false, 500, 'Could not persist deal products. Please restart the server and try again.')
        }

        revalidateTag(DEALS_TAG)
        return response(true, 200, `${result.modifiedCount} product(s) added to deals.`)
    } catch (error) {
        return catchError(error)
    }
}

// PUT — persist a new display order. Body: { order: [id, id, ...] }.
// Any id that is not currently in the list is silently skipped.
export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()
        const order = sanitizeIds(payload?.order)

        if (order.length === 0) {
            return response(false, 400, 'No valid order provided.')
        }

        const operations = order.map((id, index) => ({
            updateOne: {
                filter: { _id: id, deletedAt: null, isDeal: true },
                update: { $set: { dealSortOrder: index } }
            }
        }))
        await ProductModel.bulkWrite(operations)

        revalidateTag(DEALS_TAG)
        return response(true, 200, 'Deals order updated.')
    } catch (error) {
        return catchError(error)
    }
}

// DELETE — remove one or more products from the deals list.
export async function DELETE(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()
        const ids = sanitizeIds(payload?.ids)

        if (ids.length === 0) {
            return response(false, 400, 'No valid products provided.')
        }

        await ProductModel.updateMany(
            { _id: { $in: ids } },
            { $set: { isDeal: false, dealSortOrder: 0 } }
        )

        revalidateTag(DEALS_TAG)
        return response(true, 200, 'Removed from deals.')
    } catch (error) {
        return catchError(error)
    }
}
