import mongoose from "mongoose";

const SIZE_GUIDE_TYPES = [
    "bottomwear",
    "maxi-skirt",
    "topwear",
    "dress-bodycon",
    "dress-flowy",
    "coord-set",
    "ethnic",
    "free-size",
]

const sizeGuideSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    type: {
        type: String,
        required: true,
        enum: SIZE_GUIDE_TYPES,
        trim: true,
        index: true,
    },
    columns: {
        type: [
            {
                type: String,
                trim: true,
            }
        ],
        required: true,
        validate: {
            validator: function (value) {
                if (!Array.isArray(value) || value.length === 0) return false
                const normalized = value.map((col) => String(col || "").trim())
                if (normalized.some((col) => !col)) return false
                const unique = new Set(normalized.map((col) => col.toLowerCase()))
                return unique.size === normalized.length
            },
            message: "Columns must be a non-empty array of unique strings.",
        },
    },
    rows: {
        type: [mongoose.Schema.Types.Mixed],
        required: true,
        validate: {
            validator: function (value) {
                if (!Array.isArray(value) || value.length === 0) return false
                return value.every((row) => {
                    if (!row || typeof row !== "object" || Array.isArray(row)) return false
                    return Object.keys(row).length > 0
                })
            },
            message: "Rows must be a non-empty array of objects.",
        },
    },
    note: {
        type: String,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true,
    },
}, { timestamps: true })

sizeGuideSchema.index({ type: 1, isActive: 1, deletedAt: 1 })

const SizeGuideModel = mongoose.models.SizeGuide || mongoose.model("SizeGuide", sizeGuideSchema, "sizeguides")
export default SizeGuideModel
