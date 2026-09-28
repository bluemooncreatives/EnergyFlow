import mongoose from 'mongoose'

/**
 * NewsletterSettings — a single document (key: 'default') holding everything
 * the admin can customise: popup copy/design/offer, when and where it opens,
 * the homepage newsletter band, the footer strip and the welcome email.
 *
 * The groups are stored as plain objects: their shape and limits are owned by
 * the zod schema in lib/newsletterConfig.js (shared with the admin form), and
 * reads are always deep-merged over the defaults there, so a group added in a
 * later release never comes back undefined.
 */
const newsletterSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
    },
    popup: { type: mongoose.Schema.Types.Mixed, default: {} },
    behavior: { type: mongoose.Schema.Types.Mixed, default: {} },
    section: { type: mongoose.Schema.Types.Mixed, default: {} },
    footer: { type: mongoose.Schema.Types.Mixed, default: {} },
    emails: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
)

const NewsletterSettingsModel =
  mongoose.models.NewsletterSettings ||
  mongoose.model('NewsletterSettings', newsletterSettingsSchema, 'newsletter_settings')

export default NewsletterSettingsModel
