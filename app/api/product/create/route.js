import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
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
        if (payload && payload.sizeGuide === '') {
            payload.sizeGuide = null
        }

        const schema = zSchema.pick({
            name: true,
            parentSku: true,
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

        const productData = validate.data

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
            sizeGuide: productData.sizeGuide ?? null,
            mrp: productData.mrp,
            sellingPrice: productData.sellingPrice,
            discountPercentage: pricing.discountPercentage,
            description: encode(productData.description),
            media: productData.media,
        })

        await newProduct.save()

        // The Freshly Arrived section tops up with the newest products, so a new
        // product can change what it shows — refresh that cache.
        revalidateTag('storefront-freshly-arrived-products')
        // A new product changes its category's product count and may become the
        // representative image for the homepage "Categories" section.
        revalidateTag('storefront-home-categories')

        return response(true, 200, 'Product added successfully.', { _id: newProduct._id })

    } catch (error) {
        return catchError(error)
    }
}