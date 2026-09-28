import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

// Admin: every non-trashed subscriber for the CSV export (ready to import into
// Mailchimp / Brevo / Klaviyo).
export async function GET() {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()

    const subscribers = await NewsletterSubscriberModel.find({ deletedAt: null })
      .select('email name status source couponCode pagePath subscribedAt unsubscribedAt createdAt')
      .sort({ createdAt: -1 })
      .lean()

    // The CSV writer needs flat primitives — no ObjectIds or Dates.
    const rows = subscribers.map(({ _id, subscribedAt, unsubscribedAt, createdAt, ...rest }) => ({
      ...rest,
      subscribedAt: subscribedAt ? new Date(subscribedAt).toISOString() : '',
      unsubscribedAt: unsubscribedAt ? new Date(unsubscribedAt).toISOString() : '',
      createdAt: createdAt ? new Date(createdAt).toISOString() : '',
    }))

    return response(true, 200, 'Data found.', rows)
  } catch (error) {
    return catchError(error)
  }
}
