import { revalidateTag } from 'next/cache'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { newsletterSettingsSchema } from '@/lib/newsletterConfig'
import { findActiveCoupon, loadNewsletterSettings, NEWSLETTER_TAG } from '@/lib/services/newsletterService'
import NewsletterSettingsModel from '@/models/NewsletterSettings.model'

// GET — the full settings (defaults merged in) for the admin customiser.
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const { settings, updatedAt } = await loadNewsletterSettings()
        return response(true, 200, 'Newsletter settings.', { settings, updatedAt })
    } catch (error) {
        return catchError(error)
    }
}

// PUT — replace the settings. The whole shape is validated by the same zod
// schema the admin form uses, so the storefront can trust what it reads.
export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const payload = await request.json().catch(() => null)
        const validate = newsletterSettingsSchema.safeParse(payload)
        if (!validate.success) {
            const first = validate.error.issues[0]
            return response(
                false,
                400,
                first ? `${first.path.join(' › ')}: ${first.message}` : 'Invalid settings.',
                validate.error
            )
        }

        const settings = validate.data

        await connectDB()

        // Never let the popup promise a code that can't be redeemed.
        if (settings.popup.offer.enabled) {
            const coupon = await findActiveCoupon(settings.popup.offer.couponCode)
            if (!coupon) {
                return response(
                    false,
                    400,
                    `Coupon "${settings.popup.offer.couponCode}" doesn't exist or has expired. Create or extend it under Coupons first.`
                )
            }
        }

        const doc = await NewsletterSettingsModel.findOneAndUpdate(
            { key: 'default' },
            { $set: settings },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean()

        revalidateTag(NEWSLETTER_TAG)
        return response(true, 200, 'Newsletter settings saved. The storefront is updated.', {
            updatedAt: doc?.updatedAt,
        })
    } catch (error) {
        return catchError(error)
    }
}
