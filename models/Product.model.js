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
    // All slugs owned by this product, including previous names. A unique
    // multikey index prevents another product from claiming a redirect alias.
    routeSlugs: { type: [String], default: undefined },
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
productSchema.index({ routeSlugs: 1 }, { unique: true, sparse: true })
productSchema.pre('validate', async function () {
    if (!this.isNew && !this.isModified('slug')) return
    const previous = this.isNew ? null : await this.constructor.findById(this._id).select('slug routeSlugs').lean()
    const slugs = [...new Set([...(previous?.routeSlugs || []), previous?.slug, this.slug].filter(Boolean))]
    const conflict = await this.constructor.exists({
        _id: { $ne: this._id }, $or: [{ slug: { $in: slugs } }, { routeSlugs: { $in: slugs } }],
    })
    if (conflict) this.invalidate('slug', 'This slug is already reserved by another product. Choose a different slug.')
    this.routeSlugs = slugs
})
// Drives the storefront Bestsellers query: active bestsellers, ordered by rank.
productSchema.index({ isBestseller: 1, deletedAt: 1, bestsellerSortOrder: 1 })
// Drives the storefront Freshly Arrived query: active picks, ordered by rank.
productSchema.index({ isFreshlyArrived: 1, deletedAt: 1, freshlyArrivedSortOrder: 1 })
const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema, 'products')
export default ProductModel
