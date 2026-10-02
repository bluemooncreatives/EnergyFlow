import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { BUDGETS, ENQUIRY_STATUSES, OCCASIONS, labelFor } from '@/lib/giftEnquiry'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'

// Admin: every live enquiry as flat rows for the table's CSV export, with
// option codes turned into the labels the team reads everywhere else.
export async function GET() {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()

    const enquiries = await GiftEnquiryModel.find({ deletedAt: null })
      .select('ticketId name company email phone city occasion quantity budget deliveryDate branding products message status adminNotes createdAt')
      .sort({ createdAt: -1 })
      .lean()

    const rows = enquiries.map((e) => ({
      ticketId: e.ticketId,
      name: e.name,
      company: e.company,
      email: e.email,
      phone: e.phone,
      city: e.city,
      occasion: labelFor(OCCASIONS, e.occasion),
      quantity: e.quantity,
      budget: labelFor(BUDGETS, e.budget),
      deliveryDate: e.deliveryDate ? new Date(e.deliveryDate).toISOString().slice(0, 10) : '',
      branding: e.branding ? 'Yes' : 'No',
      products: (e.products || []).map((p) => p.name).join(', '),
      message: e.message,
      status: labelFor(ENQUIRY_STATUSES, e.status),
      adminNotes: e.adminNotes,
      createdAt: e.createdAt,
    }))

    return response(true, 200, 'Data found.', rows)
  } catch (error) {
    return catchError(error)
  }
}
