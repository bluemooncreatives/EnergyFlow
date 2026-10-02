import { isValidObjectId } from 'mongoose'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'

const readIds = async (request) => {
  const payload = await request.json().catch(() => ({}))
  const ids = Array.isArray(payload?.ids) ? payload.ids.filter(isValidObjectId) : []
  return { ids, deleteType: payload?.deleteType }
}

// Soft delete (SD) or restore (RSD)
export async function PUT(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    const { ids, deleteType } = await readIds(request)
    if (!ids.length) {
      return response(false, 400, 'Invalid or empty id list.')
    }
    if (!['SD', 'RSD'].includes(deleteType)) {
      return response(false, 400, 'Delete type must be SD or RSD.')
    }

    await connectDB()

    const result = await GiftEnquiryModel.updateMany(
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

// Permanent delete (PD) — only for enquiries already in the trash.
export async function DELETE(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    const { ids } = await readIds(request)
    if (!ids.length) {
      return response(false, 400, 'Invalid or empty id list.')
    }

    await connectDB()

    const result = await GiftEnquiryModel.deleteMany({ _id: { $in: ids }, deletedAt: { $ne: null } })
    if (!result.deletedCount) {
      return response(false, 404, 'Data not found. Move enquiries to the trash before deleting them permanently.')
    }

    return response(true, 200, 'Deleted permanently.')
  } catch (error) {
    return catchError(error)
  }
}
