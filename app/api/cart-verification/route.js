import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import ProductVariantModel from "@/models/ProductVariant.model";

export async function POST(request) {
    try {
        await connectDB()
        const payload = await request.json()

        const cartItems = Array.isArray(payload) ? payload : []
        const variantIds = cartItems.map((cartItem) => cartItem.variantId).filter(Boolean)
        const variants = variantIds.length > 0
            ? await ProductVariantModel.find({ _id: { $in: variantIds } })
                .populate('product')
                .populate('media', 'secure_url')
                .lean()
            : []

        const variantById = new Map(
            variants.map((variant) => [variant._id.toString(), variant])
        )

        const verifiedCartData = cartItems.map((cartItem) => {
            const variant = variantById.get(cartItem.variantId?.toString())
            if (!variant) {
                return
            }
            return {
                productId: variant.product._id,
                variantId: variant._id,
                name: variant.product.name,
                url: variant.product.slug,
                size: variant.size,
                color: variant.color,
                mrp: variant.mrp,
                sellingPrice: variant.sellingPrice,
                media: variant?.media[0]?.secure_url,
                qty: cartItem.qty,
            }
        }).filter(Boolean)


        return response(true, 200, 'Verified Cart Data.', verifiedCartData)

    } catch (error) {
        return catchError(error)
    }
}
