import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { mergeNewsletterSettings } from '@/lib/newsletterConfig'
import CouponModel from '@/models/Coupon.model'
import NewsletterSettingsModel from '@/models/NewsletterSettings.model'

export const NEWSLETTER_TAG = 'storefront-newsletter'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

// Full settings (defaults merged in). Server-only: includes the coupon code
// and email options, so it must never be passed to a client component as-is.
export const loadNewsletterSettings = async () => {
    await connectDB()
    const doc = await NewsletterSettingsModel.findOne({ key: 'default' }).lean()
    return {
        settings: mergeNewsletterSettings(doc ? toPlainObject(doc) : null),
        updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    }
}

// A coupon is only worth promising if it exists, is not trashed and has not
// expired. Returns the lean coupon or null.
export const findActiveCoupon = async (code) => {
    if (!code) return null
    await connectDB()
    return CouponModel.findOne({
        code: String(code).trim().toUpperCase(),
        deletedAt: null,
        validity: { $gt: new Date() },
    })
        .select('code discountPercentage minShoppingAmount validity')
        .lean()
}

const fetchPublicSettings = async () => {
    const { settings } = await loadNewsletterSettings()
    const { popup, behavior, section, footer } = settings

    // The code itself is revealed only by the subscribe API, after sign-up.
    // If the coupon has lapsed, drop the offer rather than advertise a dead one.
    const coupon = popup.offer.enabled ? await findActiveCoupon(popup.offer.couponCode) : null
    const offerLive = Boolean(popup.offer.enabled && coupon)
    const { couponCode, ...offer } = popup.offer

    return toPlainObject({
        popup: { ...popup, offer: { ...offer, enabled: offerLive } },
        behavior,
        section,
        footer,
    })
}

// Cached read for the storefront (layout, homepage band, footer). Invalidated
// by the admin settings route via revalidateTag(NEWSLETTER_TAG); the short
// revalidate also catches a coupon expiring on its own.
export const getPublicNewsletterSettings = unstable_cache(
    fetchPublicSettings,
    [NEWSLETTER_TAG],
    {
        revalidate: 300,
        tags: [NEWSLETTER_TAG],
    }
)
