import MediaModel from '@/models/Media.model'
import { isCategoryCoverUrl } from '@/lib/categoryCover'

export const validCategoryCover = async (id) => {
    if (!id) return true
    const media = await MediaModel.findOne({ _id: id, deletedAt: null }).select('secure_url').lean()
    return Boolean(media && isCategoryCoverUrl(media.secure_url))
}
