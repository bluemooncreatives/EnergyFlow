import { createHash } from 'node:crypto'
import { z } from 'zod'
import { isAuthenticated } from '@/lib/authentication'
import cloudinary from '@/lib/cloudinary'
import { connectDB } from '@/lib/databaseConnection'
import { response } from '@/lib/helperFunction'
import { isCategoryCoverUrl } from '@/lib/categoryCover'
import MediaModel from '@/models/Media.model'

const uploadSchema = z.array(z.object({
    asset_id: z.string().trim().min(1).max(200),
    public_id: z.string().trim().min(1).max(500),
})).min(1).max(20)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function POST(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })
        const parsed = uploadSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) return response(false, 400, 'Provide between 1 and 20 uploaded images.', {}, { status: 400 })
        await connectDB()
        const saved = []
        const unique = [...new Map(parsed.data.map((item) => [item.asset_id, item])).values()]
        for (const item of unique) {
            // Cloudinary is authoritative for URL, size and media type.
            const asset = await cloudinary.api.resource(item.public_id, { resource_type: 'image', type: 'upload' })
            if (asset.asset_id !== item.asset_id || asset.resource_type !== 'image' || asset.type !== 'upload' ||
                !['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(asset.format) || !isCategoryCoverUrl(asset.secure_url)) {
                return response(false, 400, 'The uploaded asset is not a supported public image.', {}, { status: 400 })
            }
            if (!Number.isFinite(asset.bytes) || asset.bytes <= 0 || asset.bytes > MAX_IMAGE_BYTES) {
                return response(false, 413, 'Max image size is 5 MB.', {}, { status: 413 })
            }
            const existing = await MediaModel.findOne({ asset_id: asset.asset_id }).lean()
            if (existing?.deletedAt) return response(false, 409, 'This image is in the trash. Restore it from Media before using it.', {}, { status: 409 })
            // Stable IDs make retries safe across servers without a unique-index
            // migration of the existing media library.
            const id = existing?._id || createHash('sha256').update('cloudinary:' + asset.asset_id).digest('hex').slice(0, 24)
            const document = {
                asset_id: asset.asset_id, public_id: asset.public_id,
                secure_url: asset.secure_url, path: asset.public_id,
                thumbnail_url: asset.secure_url, deletedAt: null,
            }
            let media
            try {
                media = await MediaModel.findOneAndUpdate({ _id: id }, { $setOnInsert: document }, { upsert: true, new: true, runValidators: true })
            } catch (error) {
                if (error.code !== 11000) throw error
                media = await MediaModel.findById(id)
            }
            if (!media || media.deletedAt) return response(false, 409, 'This image became unavailable. Refresh the media library.', {}, { status: 409 })
            saved.push(media)
        }
        return response(true, 200, 'Images saved to the media library.', saved)
    } catch (error) {
        // Never destroy an upload on a failed/ambiguous database write.
        return response(false, error.http_code === 404 ? 400 : 503,
            error.http_code === 404 ? 'The uploaded image could not be found in Cloudinary.' : 'Could not save images. Your uploads are retained; please retry.',
            {}, { status: error.http_code === 404 ? 400 : 503 })
    }
}
