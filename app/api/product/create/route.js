import CategoryModel from '@/models/Category.model'
import mongoose from 'mongoose'
import { revalidateCatalogue } from '@/lib/catalogueCache'
import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { mediaIssueMessage, unavailableMediaMessage } from "@/lib/services/mediaGuard"
import { validatePricing } from "@/lib/pricing"
import ProductModel from "@/models/Product.model"
import { encode } from "entities"

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const schema = zSchema.pick({
            name: true,
            parentSku: true,
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
            return response(false, 400, mediaIssueMessage(validate.error) || 'Invalid or missing fields.', validate.error)
        }

        // The image list is ordered (first = main image); every image in it must
        // still be in the library.
        const mediaError = await unavailableMediaMessage(validate.data.media)
        if (mediaError) {
            return response(false, 400, mediaError)
        }

        const productData = validate.data

        if (!mongoose.isValidObjectId(productData.category) || !await CategoryModel.exists({ _id: productData.category, deletedAt: null })) {
            return response(false, 400, 'Choose an active category.', {}, { status: 400 })
        }
        const slugOwner = await ProductModel.exists({

            $or: [{ slug: productData.slug }, { routeSlugs: productData.slug }],
        })
        if (slugOwner) return response(false, 409, 'This product slug is already reserved. Choose another slug.', {}, { status: 409 })

        // Server is authoritative on pricing: enforce SP <= MRP and derive the
        // discount, ignoring whatever the client sent.
        const pricing = validatePricing(productData.mrp, productData.sellingPrice)
        if (!pricing.ok) {
            return response(false, 400, pricing.message)
        }

        const newProduct = new ProductModel({
            name: productData.name,
            parentSku: productData.parentSku,
            slug: productData.slug,
            category: productData.category,
            mrp: productData.mrp,
            sellingPrice: productData.sellingPrice,
            discountPercentage: pricing.discountPercentage,
            description: encode(productData.description),
            media: productData.media,
        })

        await newProduct.save()

        // The Freshly Arrived section tops up with the newest products, so a new
        // product can change what it shows — refresh that cache.
        revalidateCatalogue()
        revalidateTag('storefront-freshly-arrived-products')
        // A new product changes its category's product count and may become the
        // representative image for the homepage "Categories" section.
        revalidateTag('storefront-home-categories')
        // A product created with a discount belongs on the deal rail, and the
        // Popular Products grid tops up with the newest products.
        revalidateTag('storefront-daily-best-sells')

        return response(true, 200, 'Product added successfully.', { _id: newProduct._id })

    } catch (error) {
        if (error.code === 11000 || error.errors?.slug) {
            return response(false, 409, 'The SKU or slug is already reserved. Choose a unique value.', {}, { status: 409 })
        }
        return catchError(error)
    }
}
