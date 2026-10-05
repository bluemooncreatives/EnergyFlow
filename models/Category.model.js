import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    coverImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    coverAlt: { type: String, trim: true, maxlength: 200, default: '' },
    coverPosition: { type: String, enum: ['center', 'top', 'bottom', 'left', 'right'], default: 'center' },

    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })


// Add new paths to an existing development model during hot reload as well.
if (mongoose.models.Category && !mongoose.models.Category.schema.path('coverImage')) {
    mongoose.models.Category.schema.add({
        coverImage: categorySchema.obj.coverImage,
        coverAlt: categorySchema.obj.coverAlt,
        coverPosition: categorySchema.obj.coverPosition,
    })
}
const CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema, 'categories')
export default CategoryModel
