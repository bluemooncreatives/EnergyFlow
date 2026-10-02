import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'

// Admin: unread enquiry count for the sidebar badge.
export async function GET() {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()
    const unread = await GiftEnquiryModel.countDocuments({ isRead: false, deletedAt: null })

    return response(true, 200, 'Stats found.', { unread }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return catchError(error)
  }
}
