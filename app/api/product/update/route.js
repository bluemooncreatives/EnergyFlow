import CategoryModel from '@/models/Category.model'
import mongoose from 'mongoose'
import { revalidateCatalogue } from '@/lib/catalogueCache'
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { validatePricing } from "@/lib/pricing"
import ProductModel from "@/models/Product.model"
import { encode } from "entities"

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const schema = zSchema.pick({
            _id: true,
            name: true,
            slug: true,
            category: true,
            mrp: true,
            sellingPrice: true,
            discountPercentage: true,
            description: true,
            media: true
        })
        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const validatedData = validate.data

        if (!mongoose.isValidObjectId(validatedData.category) || !await CategoryModel.exists({ _id: validatedData.category, deletedAt: null })) {
            return response(false, 400, 'Choose an active category.', {}, { status: 400 })
        }
        const slugOwner = await ProductModel.exists({
            _id: { $ne: validatedData._id },
            $or: [{ slug: validatedData.slug }, { routeSlugs: validatedData.slug }],
        })
        if (slugOwner) return response(false, 409, 'This product slug is already reserved. Choose another slug.', {}, { status: 409 })

        // Server is authoritative on pricing: enforce SP <= MRP and derive the
        // discount, ignoring whatever the client sent.
        const pricing = validatePricing(validatedData.mrp, validatedData.sellingPrice)
        if (!pricing.ok) {
            return response(false, 400, pricing.message)
        }

        const getProduct = await ProductModel.findOne({ deletedAt: null, _id: validatedData._id })
        if (!getProduct) {
            return response(false, 404, 'Data not found.')
        }

        getProduct.name = validatedData.name
        getProduct.slug = validatedData.slug
        getProduct.category = validatedData.category
        getProduct.mrp = validatedData.mrp
        getProduct.sellingPrice = validatedData.sellingPrice
        getProduct.discountPercentage = pricing.discountPercentage
        getProduct.description = encode(validatedData.description)
        getProduct.media = validatedData.media
        await getProduct.save()

        // Re-categorising a product or changing its media can change category
        // counts and the homepage "Categories" representative image.
        revalidateCatalogue()
        revalidateTag('storefront-home-categories')
        // An edit to mrp/sellingPrice decides whether a product qualifies for
        // the Daily Best Sells rail at all, and both homepage rails render the
        // name, image and price that just changed.
        revalidateTag('storefront-daily-best-sells')

        return response(true, 200, 'Product updated successfully.')

    } catch (error) {
        if (error.code === 11000 || error.errors?.slug) {
            return response(false, 409, 'The SKU or slug is already reserved. Choose a unique value.', {}, { status: 409 })
        }
        return catchError(error)
    }
}