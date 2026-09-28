import mongoose from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

// Admin: manually unsubscribe / re-subscribe one address (e.g. a customer
// asked by email). Body: { _id, status: 'subscribed' | 'unsubscribed' }
export async function PUT(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    const payload = await request.json().catch(() => ({}))
    const { _id, status } = payload || {}
    if (!_id || !mongoose.isValidObjectId(String(_id))) {
      return response(false, 400, 'Invalid subscriber id.')
    }
    if (!['subscribed', 'unsubscribed'].includes(status)) {
      return response(false, 400, 'Status must be subscribed or unsubscribed.')
    }

    await connectDB()

    const updated = await NewsletterSubscriberModel.findOneAndUpdate(
      { _id, deletedAt: null },
      {
        $set: status === 'subscribed'
          ? { status, unsubscribedAt: null }
          : { status, unsubscribedAt: new Date() },
      },
      { new: true }
    ).lean()

    if (!updated) {
      return response(false, 404, 'Subscriber not found.')
    }

    return response(true, 200, status === 'subscribed' ? 'Subscriber re-subscribed.' : 'Subscriber unsubscribed.')
  } catch (error) {
    return catchError(error)
  }
}
