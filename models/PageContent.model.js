import mongoose from 'mongoose'

/**
 * PageContent — one document per hand-designed storefront page ('gift-boxes',
 * 'about-us') holding its admin-editable copy, lists and photos.
 *
 * `content` is a plain object: its shape and limits are owned by the zod
 * schemas in lib/pageContent/schema.js (shared with the admin editor), and
 * reads are always deep-merged over the page's defaults, so a missing or
 * older document still renders the designed page.
 */
const pageContentSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        content: { type: mongoose.Schema.Types.Mixed, default: {} },
        // Who last published, for the admin's "last published by" line.
        updatedBy: { type: String, default: '' },
    },
    { timestamps: true, minimize: false }
)

const PageContentModel =
    mongoose.models.PageContent ||
    mongoose.model('PageContent', pageContentSchema, 'page_contents')

export default PageContentModel
