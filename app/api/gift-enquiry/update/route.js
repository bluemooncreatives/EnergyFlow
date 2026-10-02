import { isValidObjectId } from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { STATUS_VALUES } from '@/lib/giftEnquiry'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'

// Admin: move an enquiry through the pipeline and keep internal notes.
// Body: { _id, status?, adminNotes? } — only the fields sent are changed.
export async function PUT(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    const body = await request.json().catch(() => ({}))
    const { _id, status, adminNotes } = body || {}

    if (!isValidObjectId(_id)) {
      return response(false, 400, 'Invalid enquiry id.')
    }

    const update = {}
    if (status !== undefined) {
      if (!STATUS_VALUES.includes(status)) return response(false, 400, 'Unknown status.')
      update.status = status
    }
    if (adminNotes !== undefined) {
      if (typeof adminNotes !== 'string') return response(false, 400, 'Notes must be text.')
      const notes = adminNotes.trim()
      if (notes.length > 4000) return response(false, 400, 'Notes are too long (4,000 characters max).')
      update.adminNotes = notes
    }
    if (!Object.keys(update).length) {
      return response(false, 400, 'Nothing to update.')
    }

    await connectDB()

    const current = await GiftEnquiryModel.findOne({ _id, deletedAt: null })
      .select('status statusHistory createdAt updatedAt')
      .lean()
    if (!current) {
      return response(false, 404, 'Enquiry not found (it may have been moved to trash).')
    }

    const ops = { $set: update }
    // A real status change goes on the customer's tracking timeline. Enquiries
    // created before the timeline existed get their earlier states seeded first.
    if (update.status && update.status !== current.status) {
      const seed = current.statusHistory?.length
        ? []
        : [
            { status: 'new', at: current.createdAt },
            ...(current.status !== 'new' ? [{ status: current.status, at: current.updatedAt }] : []),
          ]
      ops.$push = { statusHistory: { $each: [...seed, { status: update.status, at: new Date() }] } }
    }

    const enquiry = await GiftEnquiryModel.findOneAndUpdate(
      { _id, deletedAt: null },
      ops,
      { new: true, runValidators: true }
    ).lean()
    if (!enquiry) {
      return response(false, 404, 'Enquiry not found (it may have been moved to trash).')
    }

    return response(true, 200, 'Enquiry updated.', enquiry)
  } catch (error) {
    return catchError(error)
  }
}
