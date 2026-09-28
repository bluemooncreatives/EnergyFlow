import mongoose from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

const validIds = (ids) =>
  Array.isArray(ids) ? ids.map(String).filter((id) => mongoose.isValidObjectId(id)) : []

// Soft delete (SD) or restore (RSD)
export async function PUT(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()
    const payload = await request.json()
    const ids = validIds(payload?.ids)
    const deleteType = payload?.deleteType

    if (ids.length === 0) {
      return response(false, 400, 'Invalid or empty id list.')
    }
    if (!['SD', 'RSD'].includes(deleteType)) {
      return response(false, 400, 'Delete type must be SD or RSD.')
    }

    const result = await NewsletterSubscriberModel.updateMany(
      { _id: { $in: ids } },
      { $set: { deletedAt: deleteType === 'SD' ? new Date() : null } }
    )
    if (!result.matchedCount) {
      return response(false, 404, 'Data not found.')
    }

    return response(true, 200, deleteType === 'SD' ? 'Moved to trash.' : 'Restored.')
  } catch (error) {
    return catchError(error)
  }
}

// Permanent delete (PD)
export async function DELETE(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()
    const payload = await request.json()
    const ids = validIds(payload?.ids)

    if (ids.length === 0) {
      return response(false, 400, 'Invalid or empty id list.')
    }

    const result = await NewsletterSubscriberModel.deleteMany({ _id: { $in: ids } })
    if (!result.deletedCount) {
      return response(false, 404, 'Data not found.')
    }

    return response(true, 200, 'Deleted permanently.')
  } catch (error) {
    return catchError(error)
  }
}
