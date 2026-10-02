import mongoose from 'mongoose'
import { BUDGET_VALUES, OCCASION_VALUES, STATUS_VALUES } from '@/lib/giftEnquiry'

// A corporate / bulk gifting enquiry from the gift-boxes page. Product names
// are snapshotted so the enquiry still reads correctly if a box is later
// renamed or deleted.
const giftEnquirySchema = new mongoose.Schema(
  {
    // Human-readable reference (e.g. GE-A7K3Q2XY) quoted in emails and the admin.
    ticketId: { type: String, trim: true, unique: true, sparse: true },
    // The signed-in customer who sent it (null for guests). Guests' enquiries
    // still show in an account whose verified email matches.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    company: { type: String, trim: true, maxlength: 120, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    city: { type: String, trim: true, maxlength: 60, default: '' },
    occasion: { type: String, enum: OCCASION_VALUES, required: true },
    quantity: { type: Number, required: true, min: 1 },
    budget: { type: String, enum: [...BUDGET_VALUES, ''], default: '' },
    deliveryDate: { type: Date, default: null },
    branding: { type: Boolean, default: false },
    products: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, trim: true },
        slug: { type: String, trim: true },
      },
    ],
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    // Page the enquiry was sent from, for the admin's context.
    pagePath: { type: String, trim: true, maxlength: 300, default: '' },
    status: { type: String, enum: STATUS_VALUES, default: 'new' },
    // Every status the enquiry has been in, oldest first — the customer's
    // tracking timeline. Enquiries created before this field read as [].
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: STATUS_VALUES },
        at: { type: Date, default: Date.now },
      },
    ],
    adminNotes: { type: String, trim: true, maxlength: 4000, default: '' },
    isRead: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

giftEnquirySchema.index({ deletedAt: 1, createdAt: -1 })
giftEnquirySchema.index({ email: 1, createdAt: -1 })
giftEnquirySchema.index({ isRead: 1, deletedAt: 1 })
giftEnquirySchema.index({ user: 1, createdAt: -1 })

const GiftEnquiryModel =
  mongoose.models.GiftEnquiry || mongoose.model('GiftEnquiry', giftEnquirySchema)

export default GiftEnquiryModel
