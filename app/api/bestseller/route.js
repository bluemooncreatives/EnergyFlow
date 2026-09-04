import mongoose from "mongoose"
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ProductModel from "@/models/Product.model"
import "@/models/Media.model"

const BESTSELLER_TAG = 'storefront-bestseller-products'

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

// GET — current bestsellers in their configured order (admin panel list)
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const bestsellers = await ProductModel.find({ deletedAt: null, isBestseller: true })
            .sort({ bestsellerSortOrder: 1, createdAt: -1, _id: 1 })
            .select('name slug sellingPrice mrp media bestsellerSortOrder')
            .populate('media', 'secure_url alt')
            .lean()

        return response(true, 200, 'Bestsellers fetched.', bestsellers)
    } catch (error) {
        return catchError(error)
    }
}

// POST — add one or more products to the bestseller list.
// Idempotent: already-bestseller and already-deleted ids are ignored, and new
// entries are appended after the current highest rank.
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

        // Only act on real, non-deleted products that are not already bestsellers.
        const candidates = await ProductModel.find({
            _id: { $in: ids },
            deletedAt: null,
            isBestseller: { $ne: true }
        }).select('_id').lean()

        if (candidates.length === 0) {
            return response(false, 400, 'Selected products are already bestsellers or unavailable.')
        }

        // Append after the current max rank so existing order is preserved.
        const last = await ProductModel.findOne({ deletedAt: null, isBestseller: true })
            .sort({ bestsellerSortOrder: -1 })
            .select('bestsellerSortOrder')
            .lean()
        let nextOrder = (last?.bestsellerSortOrder ?? -1) + 1

        const operations = candidates.map((product) => ({
            updateOne: {
                filter: { _id: product._id },
                update: { $set: { isBestseller: true, bestsellerSortOrder: nextOrder++ } }
            }
        }))
        const result = await ProductModel.bulkWrite(operations)

        // Guard against a silent no-op write (e.g. a stale Mongoose model whose
        // schema predates these fields would strip them via strict mode). Without
        // this, the request would report success while nothing was persisted.
        if (!result.modifiedCount) {
            return response(false, 500, 'Could not persist bestsellers. Please restart the server and try again.')
        }

        revalidateTag(BESTSELLER_TAG)
        return response(true, 200, `${result.modifiedCount} product(s) added to bestsellers.`)
    } catch (error) {
        return catchError(error)
    }
}

// PUT — persist a new display order. Body: { order: [id, id, ...] }.
// Any id that is not a current bestseller is silently skipped.
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
                filter: { _id: id, deletedAt: null, isBestseller: true },
                update: { $set: { bestsellerSortOrder: index } }
            }
        }))
        await ProductModel.bulkWrite(operations)

        revalidateTag(BESTSELLER_TAG)
        return response(true, 200, 'Bestseller order updated.')
    } catch (error) {
        return catchError(error)
    }
}

// DELETE — remove one or more products from the bestseller list.
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
            { $set: { isBestseller: false, bestsellerSortOrder: 0 } }
        )

        revalidateTag(BESTSELLER_TAG)
        return response(true, 200, 'Removed from bestsellers.')
    } catch (error) {
        return catchError(error)
    }
}
