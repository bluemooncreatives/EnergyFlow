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
        await MediaModel.updateMany({ _id: { $in: payload.ids }, deletionPending: { $ne: true } }, { $set: { deletedAt: payload.deleteType === 'SD' ? new Date() : null } })
        revalidateCatalogue()
        if (await MediaModel.exists({ _id: { $in: payload.ids }, deletionPending: true })) return response(false, 409, 'Permanent deletion has started for some images. Retry permanent deletion to finish; those images cannot be restored.', {}, { status: 409 })
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
        let media = await MediaModel.find({ _id: { $in: payload.ids } }).lean()
        if (media.some((item) => !item.deletedAt)) return response(false, 409, 'Move images to the trash before permanently deleting them.', {}, { status: 409 })
        if (!media.length) return response(true, 200, 'Images already deleted.')

        // Claim trashed records before the external call. A concurrent restore
        // can no longer make a soon-to-be-deleted asset live again.
        const requestedCount = media.length
        await MediaModel.updateMany({ _id: { $in: payload.ids }, deletedAt: { $ne: null } }, { $set: { deletionPending: true } })
        media = await MediaModel.find({ _id: { $in: payload.ids }, deletedAt: { $ne: null }, deletionPending: true }).lean()
        if (!media.length) return response(false, 409, 'These images were restored. Move them to trash before deleting.', {}, { status: 409 })

        // Cloudinary cannot join a MongoDB transaction. Failed deletions stay in
        // trash; retries accept assets already absent from Cloudinary.
        // Older libraries can contain duplicate records for one Cloudinary asset.
        // Removing one record must not destroy an image used by another record.
        const shared = new Set(await MediaModel.distinct('public_id', { public_id: { $in: media.map(item => item.public_id) }, _id: { $nin: media.map(item => item._id) } }))
        const publicIds = [...new Set(media.map(item => item.public_id).filter(id => !shared.has(id)))]
        const result = publicIds.length ? await cloudinary.api.delete_resources(publicIds, { resource_type: 'image', type: 'upload', invalidate: true }) : { deleted: {} }
        const removed = media.filter((item) => shared.has(item.public_id) || ['deleted', 'not_found', 'not found'].includes(result.deleted?.[item.public_id]))
        if (removed.length) await MediaModel.deleteMany({ _id: { $in: removed.map((item) => item._id) }, deletedAt: { $ne: null } })
        revalidateCatalogue()
        if (removed.length !== media.length) return response(false, 503, 'Some images could not be deleted. They remain in the trash; please retry.', {}, { status: 503 })
        if (media.length !== requestedCount) return response(false, 409, 'Some images were restored during deletion and were kept. Refresh the media library.', {}, { status: 409 })
        return response(true, 200, 'Images deleted permanently.')
    } catch {
        return response(false, 503, 'Could not finish deletion. The media records are retained for retry.', {}, { status: 503 })
    }
}
