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
        const hasSizeGuide = Object.prototype.hasOwnProperty.call(payload || {}, 'sizeGuide')
        if (payload && payload.sizeGuide === '') {
            payload.sizeGuide = null
        }

        const schema = zSchema.pick({
            _id: true,
            name: true,
            slug: true,
            category: true,
            sizeGuide: true,
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
        if (hasSizeGuide) {
            getProduct.sizeGuide = validatedData.sizeGuide ?? null
        }
        getProduct.mrp = validatedData.mrp
        getProduct.sellingPrice = validatedData.sellingPrice
        getProduct.discountPercentage = pricing.discountPercentage
        getProduct.description = encode(validatedData.description)
        getProduct.media = validatedData.media
        await getProduct.save()

        // Re-categorising a product or changing its media can change category
        // counts and the homepage "Categories" representative image.
        revalidateTag('storefront-home-categories')

        return response(true, 200, 'Product updated successfully.')

    } catch (error) {
        return catchError(error)
    }
}