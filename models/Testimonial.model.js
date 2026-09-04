import mongoose from "mongoose";

/**
 * Testimonial — admin-authored "Customer Reviews" shown in the homepage
 * "What They Say" section. This is deliberately separate from the product
 * Review model (Review.model.js): those are user-generated and tied to a
 * product + user, whereas testimonials are curated marketing content the
 * admin writes by hand (name + quote + star rating).
 */
const testimonialSchema = new mongoose.Schema({
    // Reviewer display name shown beneath the quote.
    name: {
        type: String,
        required: true,
        trim: true,
    },

    // The testimonial / quote body.
    review: {
        type: String,
        required: true,
        trim: true,
    },

    // Star rating, clamped to 1–5 at the schema level so a tampered payload
    // can never render a broken star row on the storefront.
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5,
    },

    // Lets the admin hide a testimonial from the storefront without deleting
    // it. Only active (and non-deleted) entries are served to the homepage.
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },

    // Display order on the storefront (ascending). New entries are appended
    // after the current highest rank; the admin can reorder later.
    sortOrder: {
        type: Number,
        default: 0,
        index: true,
    },

    // Soft-delete marker, consistent with the rest of the app's models.
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },

}, { timestamps: true })

testimonialSchema.index({ deletedAt: 1, isActive: 1, sortOrder: 1 })

const TestimonialModel = mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema, 'testimonials')
export default TestimonialModel
