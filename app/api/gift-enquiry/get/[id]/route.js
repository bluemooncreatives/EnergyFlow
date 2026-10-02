import { isValidObjectId } from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'

export async function GET(request, { params }) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()
    const { id } = await params

    if (!isValidObjectId(id)) {
      return response(false, 400, 'Invalid enquiry id.')
    }

    // Opening an enquiry marks it read (clears it from the sidebar count).
    const enquiry = await GiftEnquiryModel.findOneAndUpdate(
      { _id: id },
      { $set: { isRead: true } },
      { new: true }
    ).lean()
    if (!enquiry) {
      return response(false, 404, 'Enquiry not found.')
    }

    return response(true, 200, 'Enquiry found.', enquiry)
  } catch (error) {
    return catchError(error)
  }
}
