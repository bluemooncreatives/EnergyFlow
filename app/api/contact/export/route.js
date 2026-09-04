import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ContactModel from '@/models/Contact.model'

export async function GET(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()

    const contacts = await ContactModel.find({ deletedAt: null })
      .select('ticketId name email phone address subject message isRead createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return response(true, 200, 'Data found.', contacts)
  } catch (error) {
    return catchError(error)
  }
}
