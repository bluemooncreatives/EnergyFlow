import mongoose from "mongoose"
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { TESTIMONIALS_TAG } from "@/lib/services/testimonialService"
import TestimonialModel from "@/models/Testimonial.model"

// PUT — update a single testimonial. Supports two intents from one endpoint:
//   • Full edit: { _id, name, review, testimonialRating }
//   • Visibility selection: { _id, status: 'draft' | 'live' }
// Only the fields present in the payload are applied, so the toggle never has
// to resend (and re-validate) the whole record.
export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const { _id } = payload || {}
        if (!_id || !mongoose.isValidObjectId(String(_id))) {
            return response(false, 400, 'Invalid testimonial id.')
        }

        const update = {}

        // Keep the legacy active flag aligned with the two visibility states.
        if (payload.status !== undefined) {
            if (!['draft', 'live'].includes(payload.status)) {
                return response(false, 400, 'Status must be draft or live.')
            }
            update.isDraft = payload.status === 'draft'
            update.isActive = !update.isDraft
        } else if (typeof payload.isActive === 'boolean') {
            update.isActive = payload.isActive
            update.isDraft = !payload.isActive
        }

        // Content edit — validate the editable fields together so a partial
        // edit can't slip past the schema.
        const hasContent =
            payload.name !== undefined ||
            payload.review !== undefined ||
            payload.testimonialRating !== undefined

        if (hasContent) {
            const schema = zSchema.pick({
                name: true, review: true, testimonialRating: true,
            })
            const validate = schema.safeParse(payload)
            if (!validate.success) {
                return response(false, 400, 'Invalid or missing fields.', validate.error)
            }
            update.name = validate.data.name
            update.review = validate.data.review
            update.rating = validate.data.testimonialRating
        }

        if (Object.keys(update).length === 0) {
            return response(false, 400, 'Nothing to update.')
        }

        const updated = await TestimonialModel.findOneAndUpdate(
            { _id, deletedAt: null },
            { $set: update },
            { new: true, runValidators: true }
        ).lean()

        if (!updated) {
            return response(false, 404, 'Testimonial not found.')
        }

        revalidateTag(TESTIMONIALS_TAG)
        return response(true, 200, 'Testimonial updated.')
    } catch (error) {
        return catchError(error)
    }
}
