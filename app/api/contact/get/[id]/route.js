import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import ContactModel from '@/models/Contact.model'
import { isValidObjectId } from 'mongoose'

export async function GET(request, { params }) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()
    const { id } = await params

    if (!isValidObjectId(id)) {
      return response(false, 400, 'Invalid contact id.')
    }

    const contact = await ContactModel.findById(id).lean()
    if (!contact) {
      return response(false, 404, 'Contact not found.')
    }

    // Auto-mark as read when admin opens it
    if (!contact.isRead) {
      await ContactModel.findByIdAndUpdate(id, { isRead: true })
      contact.isRead = true
    }

    return response(true, 200, 'Contact found.', contact)
  } catch (error) {
    return catchError(error)
  }
}
