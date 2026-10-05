import mongoose from 'mongoose'

/**
 * DealSettings — a single document (key: 'default') holding the homepage
 * Deals of the Month section: header copy, countdown and banner. The products
 * are curated on the Product model (isDeal / dealSortOrder).
 *
 * The groups are stored as plain objects: their shape and limits are owned by
 * the zod schema in lib/dealsConfig.js (shared with the admin form), and reads
 * are always deep-merged over the defaults there.
 */
const dealSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'default',
      unique: true,
    },
    section: { type: mongoose.Schema.Types.Mixed, default: {} },
    countdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    banner: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
)

const DealSettingsModel =
  mongoose.models.DealSettings ||
  mongoose.model('DealSettings', dealSettingsSchema, 'deal_settings')

export default DealSettingsModel
