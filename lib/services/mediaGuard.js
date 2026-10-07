import MediaModel from '@/models/Media.model'

/* Server-side checks for a product's or variant's ordered image list (the
   shape rules live in lib/productMedia, shared with the admin forms). */

// The schema's own message for a bad image list ("Add at least one image."),
// so the admin is told why instead of a generic "Invalid or missing fields."
export const mediaIssueMessage = (zodError) =>
    zodError?.issues?.find((issue) => issue.path?.[0] === 'media')?.message || null

/**
 * Every picked image must still be in the library: not permanently deleted,
 * not in the trash and not mid-deletion. An image can be trashed in another
 * tab between picking it and saving, and a stale id would leave a hole in
 * the gallery (or, as the first id, no main image at all).
 *
 * Returns a message to show, or null when every image is usable.
 */
export const unavailableMediaMessage = async (ids = []) => {
    if (!ids.length) return 'Add at least one image.'
    const live = await MediaModel.find({ _id: { $in: ids }, deletedAt: null, deletionPending: { $ne: true } })
        .select('_id')
        .lean()
    const found = new Set(live.map((media) => String(media._id)))
    const missing = ids.filter((id) => !found.has(String(id)))
    if (!missing.length) return null
    return missing.length === 1
        ? 'One of the images was deleted or moved to the trash. Remove it and save again.'
        : `${missing.length} of the images were deleted or moved to the trash. Remove them and save again.`
}
