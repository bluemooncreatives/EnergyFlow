import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { zSchema } from "@/lib/zodSchema"
import { validatePricing } from "@/lib/pricing"
import ProductModel from "@/models/Product.model"
import ProductVariantModel from "@/models/ProductVariant.model"

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

        const validatedData = validate.data

        // Server is authoritative on pricing: enforce SP <= MRP and derive the
        // discount, ignoring whatever the client sent.
        const pricing = validatePricing(validatedData.mrp, validatedData.sellingPrice)
        if (!pricing.ok) {
            return response(false, 400, pricing.message)
        }

        const getProductVariant = await ProductVariantModel.findOne({ deletedAt: null, _id: validatedData._id })
        if (!getProductVariant) {
            return response(false, 404, 'Data not found.')
        }

        const product = await ProductModel.findOne({ _id: validatedData.product, deletedAt: null }).select('parentSku').lean()

        if (!product) {
            return response(false, 404, 'Product not found.')
        }

        const parentSku = (product.parentSku || '').trim()
        const sku = (validatedData.sku || '').trim()
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

        getProductVariant.product = validatedData.product
        getProductVariant.color = validatedData.color
        getProductVariant.colorHex = validatedData.colorHex || ''
        getProductVariant.size = validatedData.size
        getProductVariant.sku = sku
        getProductVariant.mrp = validatedData.mrp
        getProductVariant.sellingPrice = validatedData.sellingPrice
        getProductVariant.discountPercentage = pricing.discountPercentage
        getProductVariant.media = validatedData.media
        await getProductVariant.save()

        // Colour / media edits can change the shop filter list and the homepage
        // "Shop by Colour" section (label + representative image).
        revalidateTag('storefront-shop-filters')
        revalidateTag('storefront-home-colors')

        return response(true, 200, 'Product variant updated successfully.')

    } catch (error) {
        return catchError(error)
    }
}