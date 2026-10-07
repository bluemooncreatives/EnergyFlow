import { z } from 'zod'

/* ================================================================
   PRODUCT & VARIANT IMAGES — one ordered list
   A product's (or a variant's) `media` array is ordered, and the order is
   the display order everywhere on the storefront: the first image is the
   main one (product cards, the first photo of the product page gallery,
   cart and order thumbnails); the rest follow in the gallery in the same
   order. The admin sets it by dragging; these rules keep it trustworthy.
   Shared by the admin forms (client) and the API (server), so nothing here
   may import the database.
   ================================================================ */

export const MAX_PRODUCT_MEDIA = 15

const OBJECT_ID = /^[a-f0-9]{24}$/i

// Keep the first occurrence of each id, in order: a duplicate pick must not
// move an image or show it twice.
export const dedupeIds = (ids = []) => [...new Set(ids.map(String))]

// The `media` field of the product / variant schemas: 1–15 valid ids, in the
// admin's order, duplicates dropped.
export const mediaIdsSchema = z
    .array(z.string().trim().regex(OBJECT_ID, 'One of the images is not valid. Remove it and pick it again.'), {
        invalid_type_error: 'Images must be a list.',
        required_error: 'Add at least one image.',
    })
    .min(1, 'Add at least one image.')
    .transform(dedupeIds)
    .refine((ids) => ids.length <= MAX_PRODUCT_MEDIA, `Use at most ${MAX_PRODUCT_MEDIA} images.`)

/**
 * The pipeline of a `$lookup` into `medias` that returns a document's images
 * in its own saved order. A plain `$lookup` hands them back in collection
 * order, which silently changes the main image; this sorts by each image's
 * position in the id list instead.
 *
 *   { $lookup: { from: 'medias', let: { mediaIds: { $ifNull: ['$media', []] } },
 *                pipeline: orderedMediaPipeline({ project: { secure_url: 1 } }), as: 'media' } }
 *
 * liveOnly — skip trashed images (storefront reads). Order history keeps them.
 * limit    — e.g. 1 for "the main image".
 */
export const orderedMediaPipeline = ({ list = '$$mediaIds', liveOnly = true, project, limit } = {}) => [
    {
        $match: {
            $expr: liveOnly
                ? { $and: [{ $in: ['$_id', list] }, { $eq: ['$deletedAt', null] }, { $ne: ['$deletionPending', true] }] }
                : { $in: ['$_id', list] },
        },
    },
    { $addFields: { __position: { $indexOfArray: [list, '$_id'] } } },
    { $sort: { __position: 1 } },
    ...(limit ? [{ $limit: limit }] : []),
    // An inclusion projection drops the helper field by itself (and MongoDB
    // refuses to mix inclusion with exclusion); otherwise exclude it.
    { $project: project || { __position: 0 } },
]

// For the admin forms: why the current list can't be saved, or null. Mirrors
// the server's checks so the admin hears about it before submitting.
export const mediaSelectionProblem = (list = []) => {
    if (!list.length) return 'Add at least one image.'
    const trashed = list.filter((media) => media.unavailable).length
    if (trashed) return trashed === 1
        ? 'One image is in the media trash. Remove it before saving.'
        : `${trashed} images are in the media trash. Remove them before saving.`
    if (dedupeIds(list.map((media) => media._id)).length > MAX_PRODUCT_MEDIA) return `Use at most ${MAX_PRODUCT_MEDIA} images.`
    return null
}

// For the media library's Select button: a pick over the limit is refused.
export const mediaLimitMessage = (list = []) =>
    list.length > MAX_PRODUCT_MEDIA ? `Pick at most ${MAX_PRODUCT_MEDIA} images (you picked ${list.length}).` : null
