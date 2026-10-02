import mongoose from "mongoose";

// One row per saved product. A row (rather than an array on the user) makes
// add / remove single atomic writes, and the unique index makes a double-tap
// or two tabs saving the same product at once a harmless no-op.
const wishlistItemSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
}, { timestamps: true })

wishlistItemSchema.index({ user: 1, product: 1 }, { unique: true })
// Newest first, the order the wishlist page shows.
wishlistItemSchema.index({ user: 1, createdAt: -1 })

const WishlistItemModel = mongoose.models.WishlistItem || mongoose.model('WishlistItem', wishlistItemSchema, 'wishlistitems')
export default WishlistItemModel
