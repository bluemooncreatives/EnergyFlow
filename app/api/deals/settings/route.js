import { revalidateTag } from 'next/cache'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { dealSettingsSchema } from '@/lib/dealsConfig'
import { DEALS_TAG, loadDealSettings } from '@/lib/services/dealsService'
import DealSettingsModel from '@/models/DealSettings.model'

// GET — the full settings (defaults merged in) for the admin form.
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        const { settings, updatedAt } = await loadDealSettings()
        return response(true, 200, 'Deal settings.', { settings, updatedAt })
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
        const validate = dealSettingsSchema.safeParse(payload)
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
        // Store one canonical form for the deadline whatever the client sent,
        // and drop it entirely when no custom deadline is in use.
        settings.countdown.endsAt = settings.countdown.mode === 'custom'
            ? new Date(settings.countdown.endsAt).toISOString()
            : ''

        await connectDB()
        const doc = await DealSettingsModel.findOneAndUpdate(
            { key: 'default' },
            { $set: settings },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean()

        revalidateTag(DEALS_TAG)
        return response(true, 200, 'Deal settings saved. The storefront is updated.', {
            settings,
            updatedAt: doc?.updatedAt,
        })
    } catch (error) {
        return catchError(error)
    }
}
