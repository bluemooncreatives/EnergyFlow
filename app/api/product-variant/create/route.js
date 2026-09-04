import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { validatePricing } from "@/lib/pricing"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()
        const payload = await request.json()

        const schema = zSchema.pick({
            product: true,
            sku: true,
            color: true,
            colorHex: true,
            size: true,
            mrp: true,
            sellingPrice: true,
            discountPercentage: true,
            media: true
        })


        const validate = schema.safeParse(payload)
        if (!validate.success) {
            return response(false, 400, 'Invalid or missing fields.', validate.error)
        }

        const variantData = validate.data

        // Server is authoritative on pricing: enforce SP <= MRP and derive the
        // discount, ignoring whatever the client sent.
        const pricing = validatePricing(variantData.mrp, variantData.sellingPrice)
        if (!pricing.ok) {
            return response(false, 400, pricing.message)
        }

        const product = await ProductModel.findOne({ _id: variantData.product, deletedAt: null }).select('parentSku').lean()

        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        const parentSku = (product.parentSku || '').trim()
        const sku = (variantData.sku || '').trim()
        const skuPrefix = `${parentSku}-`

        if (!parentSku) {
            return response(false, 400, 'Selected product parent SKU is missing.')
        }

        if (!sku) {
            return response(false, 400, 'SKU is required.')
        }

        if (!sku.startsWith(skuPrefix)) {
            return response(false, 400, 'SKU must start with parent SKU.')
        }

        if (sku === parentSku) {
            return response(false, 400, 'SKU cannot be same as parent SKU.')
        }

        if (sku === skuPrefix || !sku.slice(skuPrefix.length).trim()) {
            return response(false, 400, 'Please add a suffix to SKU.')
        }

        const newProductVariant = new ProductVariantModel({
            product: variantData.product,
            color: variantData.color,
            colorHex: variantData.colorHex || '',
            size: variantData.size,
            sku,
            mrp: variantData.mrp,
            sellingPrice: variantData.sellingPrice,
            discountPercentage: pricing.discountPercentage,
            media: variantData.media,
        })

        await newProductVariant.save()

        // A new variant can introduce a new colour/size — refresh the shop filter
        // list and the homepage "Shop by Colour" section.
        revalidateTag('storefront-shop-filters')
        revalidateTag('storefront-home-colors')

        return response(true, 200, 'Product Variant added successfully.')

    } catch (error) {
        return catchError(error)
    }
}