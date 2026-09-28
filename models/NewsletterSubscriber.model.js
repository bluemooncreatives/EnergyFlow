import mongoose from 'mongoose'

/**
 * NewsletterSubscriber — one row per email address that opted in through the
 * storefront popup, the homepage newsletter band or the footer strip.
 * Unsubscribing never deletes the row (status flips to 'unsubscribed') so the
 * admin keeps an honest history and a returning visitor can opt back in.
 */
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },

    // Optional — only collected when the admin turns on the name field.
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },

    status: {
      type: String,
      enum: ['subscribed', 'unsubscribed'],
      default: 'subscribed',
      index: true,
    },

    // Where the opt-in happened, for the admin's per-source breakdown.
    source: {
      type: String,
      enum: ['popup', 'section', 'footer'],
      default: 'popup',
    },

    // The storefront path the visitor was on when they subscribed.
    pagePath: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },

    // Coupon handed out at sign-up (snapshot of the setting at that moment).
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },

    // Secret used by the one-click unsubscribe link in every newsletter email.
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)

newsletterSubscriberSchema.index({ deletedAt: 1, createdAt: -1 })

const NewsletterSubscriberModel =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema, 'newsletter_subscribers')

export default NewsletterSubscriberModel
