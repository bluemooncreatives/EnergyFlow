import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

const DAY = 24 * 60 * 60 * 1000

// Admin: headline numbers for the Newsletter page — active list size, growth
// over the last 30 days (vs the 30 before), unsubscribes and a per-source split.
export async function GET() {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const now = Date.now()
        const last30 = new Date(now - 30 * DAY)
        const prev30 = new Date(now - 60 * DAY)
        const live = { deletedAt: null }

        const [active, unsubscribed, newLast30, newPrev30, bySource] = await Promise.all([
            NewsletterSubscriberModel.countDocuments({ ...live, status: 'subscribed' }),
            NewsletterSubscriberModel.countDocuments({ ...live, status: 'unsubscribed' }),
            NewsletterSubscriberModel.countDocuments({ ...live, subscribedAt: { $gte: last30 } }),
            NewsletterSubscriberModel.countDocuments({ ...live, subscribedAt: { $gte: prev30, $lt: last30 } }),
            NewsletterSubscriberModel.aggregate([
                { $match: { ...live, status: 'subscribed' } },
                { $group: { _id: '$source', count: { $sum: 1 } } },
            ]),
        ])

        const sources = { popup: 0, section: 0, footer: 0 }
        bySource.forEach(({ _id, count }) => {
            if (_id in sources) sources[_id] = count
        })

        return response(true, 200, 'Newsletter stats.', {
            active,
            unsubscribed,
            newLast30,
            newPrev30,
            sources,
        })
    } catch (error) {
        return catchError(error)
    }
}
