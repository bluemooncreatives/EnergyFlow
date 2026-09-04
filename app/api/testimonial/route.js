import mongoose from "mongoose"
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { TESTIMONIALS_TAG } from "@/lib/services/testimonialService"
import TestimonialModel from "@/models/Testimonial.model"

// Keep only well-formed, unique ObjectIds so a malformed reorder/delete payload
// can never throw a Mongoose CastError or let duplicates skew the sort order.
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

// GET — every non-deleted testimonial in display order (admin panel list).
// Includes inactive ones so the admin can see/toggle hidden entries.
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const testimonials = await TestimonialModel.find({ deletedAt: null })
            .sort({ sortOrder: 1, createdAt: -1, _id: 1 })
            .select('name review rating isActive sortOrder')
            .lean()

        return response(true, 200, 'Testimonials fetched.', testimonials)
    } catch (error) {
        return catchError(error)
    }
}

// POST — create a new testimonial. Appended after the current highest rank so
// existing order is preserved.
export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const schema = zSchema.pick({
            name: true, review: true, testimonialRating: true,
        })
        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const { name, review, testimonialRating } = validate.data

        // Server owns the sort order — a client-supplied value is never trusted.
        const last = await TestimonialModel.findOne({ deletedAt: null })
            .sort({ sortOrder: -1 })
            .select('sortOrder')
            .lean()
        const nextOrder = (last?.sortOrder ?? -1) + 1

        await TestimonialModel.create({
            name,
            review,
            rating: testimonialRating,
            sortOrder: nextOrder,
        })

        revalidateTag(TESTIMONIALS_TAG)
        return response(true, 200, 'Testimonial added.')
    } catch (error) {
        return catchError(error)
    }
}

// PUT — persist a new display order. Body: { order: [id, id, ...] }.
// Any id that is not a current testimonial is silently skipped.
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
                filter: { _id: id, deletedAt: null },
                update: { $set: { sortOrder: index } },
            },
        }))
        await TestimonialModel.bulkWrite(operations)

        revalidateTag(TESTIMONIALS_TAG)
        return response(true, 200, 'Testimonial order updated.')
    } catch (error) {
        return catchError(error)
    }
}

// DELETE — soft-delete one or more testimonials. Body: { ids: [id, ...] }.
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
            return response(false, 400, 'No valid testimonials provided.')
        }

        await TestimonialModel.updateMany(
            { _id: { $in: ids }, deletedAt: null },
            { $set: { deletedAt: new Date() } }
        )

        revalidateTag(TESTIMONIALS_TAG)
        return response(true, 200, 'Testimonial(s) deleted.')
    } catch (error) {
        return catchError(error)
    }
}
