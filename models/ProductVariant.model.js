import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
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

ProductVariantSchema.index({ product: 1, size: 1, deletedAt: 1 })
ProductVariantSchema.index({ product: 1, sellingPrice: 1, deletedAt: 1 })

const ProductVariantModel = mongoose.models.ProductVariant || mongoose.model('ProductVariant', ProductVariantSchema, 'productvariants')
export default ProductVariantModel
