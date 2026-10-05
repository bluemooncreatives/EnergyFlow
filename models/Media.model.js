import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema({
    asset_id: {
        type: String,
        required: true,
        trim: true
    },
    public_id: {
        type: String,
        required: true,
        trim: true
    },
    path: {
        type: String,
        required: true,
        trim: true
    },
    thumbnail_url: {
        type: String,
        required: true,
        trim: true
    },
    secure_url: {
        type: String,
        required: true,
        trim: true
    },

    alt: {
        type: String,
        trim: true
    },
    title: {
        type: String,
        trim: true
    },
    deletionPending: { type: Boolean, default: false },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

}, { timestamps: true })


if (mongoose.models.Media && !mongoose.models.Media.schema.path('deletionPending')) {
    mongoose.models.Media.schema.add({ deletionPending: mediaSchema.obj.deletionPending })
}
const MediaModel = mongoose.models.Media || mongoose.model('Media', mediaSchema, 'medias')
export default MediaModel
