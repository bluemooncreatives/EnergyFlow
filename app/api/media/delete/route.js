import cloudinary from '@/lib/cloudinary'
import { connectDB } from '@/lib/databaseConnection'
import { response } from '@/lib/helperFunction'
import MediaModel from '@/models/Media.model'
import { isAuthenticated } from '@/lib/authentication'
import { revalidateCatalogue } from '@/lib/catalogueCache'

const validIds = (ids) => Array.isArray(ids) && ids.length > 0 && ids.length <= 100 && ids.every((id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))

export async function PUT(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const payload = await request.json().catch(() => null)
        if (!validIds(payload?.ids) || !['SD', 'RSD'].includes(payload?.deleteType)) return response(false, 400, 'Invalid media IDs or operation.', {}, { status: 400 })
        await connectDB()
        await MediaModel.updateMany({ _id: { $in: payload.ids } }, { $set: { deletedAt: payload.deleteType === 'SD' ? new Date() : null } })
        revalidateCatalogue()
        return response(true, 200, payload.deleteType === 'SD' ? 'Images moved into trash.' : 'Images restored.')
    } catch {
        return response(false, 503, 'Could not update media. Please retry.', {}, { status: 503 })
    }
}

export async function DELETE(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const payload = await request.json().catch(() => null)
        if (!validIds(payload?.ids) || payload.deleteType !== 'PD') return response(false, 400, 'Invalid media IDs or operation.', {}, { status: 400 })
        await connectDB()
        const media = await MediaModel.find({ _id: { $in: payload.ids } }).lean()
        if (media.some((item) => !item.deletedAt)) return response(false, 409, 'Move images to the trash before permanently deleting them.', {}, { status: 409 })
        if (!media.length) return response(true, 200, 'Images already deleted.')

        // Cloudinary cannot join a MongoDB transaction. Failed deletions stay in
        // trash; retries accept assets already absent from Cloudinary.
        const result = await cloudinary.api.delete_resources(media.map((item) => item.public_id), { resource_type: 'image', type: 'upload', invalidate: true })
        const removed = media.filter((item) => ['deleted', 'not_found', 'not found'].includes(result.deleted?.[item.public_id]))
        if (removed.length) await MediaModel.deleteMany({ _id: { $in: removed.map((item) => item._id) }, deletedAt: { $ne: null } })
        revalidateCatalogue()
        if (removed.length !== media.length) return response(false, 503, 'Some images could not be deleted. They remain in the trash; please retry.', {}, { status: 503 })
        return response(true, 200, 'Images deleted permanently.')
    } catch {
        return response(false, 503, 'Could not finish deletion. The media records are retained for retry.', {}, { status: 503 })
    }
}
