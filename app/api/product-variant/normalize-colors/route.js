import { revalidateTag } from "next/cache"
import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import { normalizeColor } from "@/lib/utils"
import ProductVariantModel from "@/models/ProductVariant.model"

// One-time (idempotent) migration: rewrites every existing variant's `color`
// to its canonical form so legacy free-text rows ("purple", "EMERALD",
// "Navy  Blue") collapse to the same value the write-path now enforces.
// Admin-only. Safe to run repeatedly — already-canonical rows are skipped, and
// it never touches `sku`, so it can't create duplicate-key conflicts.
export async function POST() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const variants = await ProductVariantModel.find({}).select('color').lean()

        const operations = []
        for (const variant of variants) {
            const normalized = normalizeColor(variant.color)
            if (normalized && normalized !== variant.color) {
                operations.push({
                    updateOne: {
                        filter: { _id: variant._id },
                        update: { $set: { color: normalized } },
                    }
                })
            }
        }

        if (operations.length > 0) {
            await ProductVariantModel.bulkWrite(operations)
            // Canonicalising labels can merge/rename colours, so refresh the shop
            // filter list and the homepage "Shop by Colour" section.
            revalidateTag('storefront-shop-filters')
            revalidateTag('storefront-home-colors')
        }

        return response(true, 200, `Color normalization complete. Updated ${operations.length} of ${variants.length} variants.`)

    } catch (error) {
        return catchError(error)
    }
}
