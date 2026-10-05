import { revalidateCatalogue } from '@/lib/catalogueCache'
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { categoryUpdateSchema } from "@/lib/categoryConfig"
import { validCategoryCover } from '@/lib/services/categoryCoverService'
import CategoryModel from "@/models/Category.model"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json().catch(() => null)

        const validate = categoryUpdateSchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const { _id, updatedAt, ...fields } = validate.data

        const getCategory = await CategoryModel.findOne({ deletedAt: null, _id })
        if (!getCategory) {
            return response(false, 404, 'Data not found.')
        }

        // An unavailable, unchanged cover stays linked so restoring it works.
        if (fields.coverImage && fields.coverImage !== String(getCategory.coverImage) && !await validCategoryCover(fields.coverImage)) {
            return response(false, 400, 'This image is no longer available. Choose another image or remove the cover.', {}, { status: 400 })
        }
        if (fields.coverImage === null) {
            fields.coverAlt = ''
            fields.coverPosition = 'center'
        }
        const saved = await CategoryModel.findOneAndUpdate(
            { _id, deletedAt: null, ...(updatedAt ? { updatedAt: new Date(updatedAt) } : {}) },
            { $set: fields },
            { new: true, runValidators: true }
        )
        if (!saved) return response(false, 409, 'This category changed or was deleted in another tab. Reload it before saving again.', {}, { status: 409 })

        // Name/slug changes ripple to the shop filter list and the homepage
        // "Categories" section (label + shop link), so refresh those caches.
        revalidateCatalogue()
        revalidateTag('storefront-shop-filters')
        revalidateTag('storefront-home-categories')

        return response(true, 200, 'Category updated successfully.', { updatedAt: saved.updatedAt })

    } catch (error) {
        if (error.code === 11000) return response(false, 409, 'A category with this name or slug already exists.', {}, { status: 409 })
        return catchError(error)
    }
}
