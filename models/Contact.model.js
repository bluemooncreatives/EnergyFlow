import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    // Human-readable support reference (e.g. MS-A7K3Q2XY) shown to the
    // customer and the admin. Sparse so historical documents created before
    // this field existed (which have no ticketId) don't violate uniqueness.
    ticketId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

contactSchema.index({ deletedAt: 1, createdAt: -1 })
contactSchema.index({ email: 1 })

const ContactModel =
  mongoose.models.Contact || mongoose.model('Contact', contactSchema)

export default ContactModel
