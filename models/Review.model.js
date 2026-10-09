import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return !this.isDraft },
    },

    // Unpublished copy has a display name without creating a customer account.
    reviewerName: { type: String, trim: true, required: function () { return this.isDraft } },
    isDraft: { type: Boolean, default: false },
    seedKey: { type: String, trim: true },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: { validator: Number.isInteger, message: 'Rating must be a whole number from 1 to 5.' },
    },
    title: {
        type: String,
        required: true,
    },
    review: {
        type: String,
        required: true,
    },

    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })

reviewSchema.index({ product: 1, deletedAt: 1 })
reviewSchema.index({ user: 1, product: 1, deletedAt: 1 })
reviewSchema.index({ seedKey: 1 }, { unique: true, sparse: true })

const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema, 'reviews')
export default ReviewModel
