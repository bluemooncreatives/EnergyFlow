import mongoose from "mongoose";
import { normalizeColor } from "@/lib/utils";
import { normalizeHex } from "@/lib/colorMap";

const ProductVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    color: {
        type: String,
        required: true,
        trim: true,
        // Authoritative normalization point: runs on every assignment
        // (`new Model({color})` and `doc.color = x`), so the create and update
        // routes — which both persist via `document.save()` — can never store a
        // non-canonical color. Keeps the shop filter & product page free of
        // case/whitespace duplicates regardless of what the admin types.
        set: normalizeColor,
    },
    // Optional admin-picked swatch color. Stored lower-cased; when empty, the
    // UI falls back to the curated color dictionary (lib/colorMap). Lets any
    // custom color name ("Mocha", "Nude") render an exact shade.
    colorHex: {
        type: String,
        trim: true,
        default: '',
        set: normalizeHex,
    },
    size: {
        type: String,
        required: true,
        trim: true
    },

    mrp: {
        type: Number,
        required: true,
    },
    sellingPrice: {
        type: Number,
        required: true,
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    media: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media',
            required: true
        }
    ],

    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })

ProductVariantSchema.index({ product: 1, color: 1, size: 1, deletedAt: 1 })
ProductVariantSchema.index({ product: 1, sellingPrice: 1, deletedAt: 1 })

const ProductVariantModel = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema, 'productvariants')
export default ProductVariantModel
