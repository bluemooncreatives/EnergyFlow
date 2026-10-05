import { revalidateCatalogue } from '@/lib/catalogueCache'
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError,  response } from "@/lib/helperFunction"
import { categorySchema } from "@/lib/categoryConfig"
import { validCategoryCover } from '@/lib/services/categoryCoverService'
import CategoryModel from "@/models/Category.model"

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json().catch(() => null)

        const validate = categorySchema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        if (!await validCategoryCover(validate.data.coverImage)) {
            return response(false, 400, 'Choose an active Cloudinary image from the media library.')
        }
        const newCategory = new CategoryModel(validate.data)

        await newCategory.save()

        // The new category can change the shop filter list and the homepage
        // "Categories" section (once it has products), so refresh those caches.
        revalidateCatalogue()
        revalidateTag('storefront-shop-filters')
        revalidateTag('storefront-home-categories')

        return response(true, 200, 'Category added successfully.')

    } catch (error) {
        if (error.code === 11000) return response(false, 409, 'A category with this name or slug already exists.', {}, { status: 409 })
        return catchError(error)
    }
}
