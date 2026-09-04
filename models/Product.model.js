import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    parentSku: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    sizeGuide: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SizeGuide',
        default: null
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
    media: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Media',
            required: true
        }
    ],
    description: {
        type: String,
        required: true
    },
    isBestseller: {
        type: Boolean,
        default: false,
        index: true
    },
    // Lower number = appears earlier in the storefront Bestsellers carousel.
    // Only meaningful when isBestseller is true.
    bestsellerSortOrder: {
        type: Number,
        default: 0
    },
    isFreshlyArrived: {
        type: Boolean,
        default: false,
        index: true
    },
    // Lower number = appears earlier in the storefront Freshly Arrived section.
    // Only meaningful when isFreshlyArrived is true.
    freshlyArrivedSortOrder: {
        type: Number,
        default: 0
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })


productSchema.index({ category: 1 })
// Drives the storefront Bestsellers query: active bestsellers, ordered by rank.
productSchema.index({ isBestseller: 1, deletedAt: 1, bestsellerSortOrder: 1 })
// Drives the storefront Freshly Arrived query: active picks, ordered by rank.
productSchema.index({ isFreshlyArrived: 1, deletedAt: 1, freshlyArrivedSortOrder: 1 })
const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema, 'products')
export default ProductModel