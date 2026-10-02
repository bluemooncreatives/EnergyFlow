import mongoose from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'
import UserModel from '@/models/User.model'

// Customer: their corporate / bulk gifting enquiries, newest first, for the
// account's "Enquiries" page (polled, so admin status changes show up live).
//
// Ownership: enquiries sent while signed in carry the user id. Ones sent as a
// guest are included only when the account's email is verified and matches,
// so a typed-in email never grants access on its own. Admin-only fields
// (internal notes, read flag) are never returned.
export async function GET(request) {
  try {
    const auth = await isAuthenticated('user', request)
    if (!auth.isAuth) {
      return response(false, 401, 'Please sign in to see your enquiries.')
    }
    if (!mongoose.Types.ObjectId.isValid(auth.userId)) {
      return response(true, 200, 'Enquiries.', [], { headers: { 'Cache-Control': 'no-store' } })
    }

    await connectDB()

    const userId = new mongoose.Types.ObjectId(auth.userId)
    const user = await UserModel.findById(userId).select('email isEmailVerified').lean()
    const verifiedEmail = user?.isEmailVerified && user.email ? String(user.email).toLowerCase() : null

    const enquiries = await GiftEnquiryModel.find({
      deletedAt: null,
      $or: [
        { user: userId },
        ...(verifiedEmail ? [{ user: null, email: verifiedEmail }] : []),
      ],
    })
      .select('ticketId company occasion quantity budget deliveryDate branding products status statusHistory createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    const data = enquiries.map((e) => ({
      ...e,
      products: (e.products || []).map((p) => ({ name: p.name, slug: p.slug })),
      // Pre-timeline enquiries: at least show when it was received.
      statusHistory: e.statusHistory?.length ? e.statusHistory : [{ status: 'new', at: e.createdAt }],
    }))

    return response(true, 200, 'Enquiries.', data, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return catchError(error)
  }
}
