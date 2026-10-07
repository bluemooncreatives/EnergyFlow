import mongoose from 'mongoose'
import { connectDB } from '@/lib/databaseConnection'
import { MAX_WISHLIST_ITEMS, sanitizeWishlistIds } from '@/lib/wishlistConstants'
import ProductModel from '@/models/Product.model'
import UserModel from '@/models/User.model'
import WishlistItemModel from '@/models/Wishlist.model'
import { orderedMediaPipeline } from '@/lib/productMedia'

const toObjectIds = (ids) => ids.map((id) => new mongoose.Types.ObjectId(id))
const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

// A failure the shopper can act on; the route turns it into a response.
export class WishlistError extends Error {
    constructor(status, message, code) {
        super(message)
        this.status = status
        this.code = code
    }
}

// id → true (live) / false (soft-deleted, or its category is). Ids missing from
// the map no longer exist at all. "Live" mirrors what the shop lists.
const productStatus = async (ids) => {
    if (!ids.length) return new Map()
    const rows = await ProductModel.aggregate([
        { $match: { _id: { $in: toObjectIds(ids) } } },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                pipeline: [{ $project: { deletedAt: 1 } }],
                as: 'category',
            },
        },
        {
            $project: {
                live: {
                    $and: [
                        { $eq: [{ $ifNull: ['$deletedAt', null] }, null] },
                        { $gt: [{ $size: '$category' }, 0] },
                        { $eq: [{ $ifNull: [{ $arrayElemAt: ['$category.deletedAt', 0] }, null] }, null] },
                    ],
                },
            },
        },
    ])
    return new Map(rows.map((row) => [String(row._id), Boolean(row.live)]))
}

// Removed customers keep a valid token until it expires; don't write for them.
const assertActiveUser = async (userId) => {
    const active = await UserModel.exists({ _id: userId, deletedAt: null })
    if (!active) throw new WishlistError(401, 'Please sign in again to use your wishlist.', 'SESSION')
}

/**
 * The signed-in shopper's saved product ids, newest first. Products that are
 * hidden (soft-deleted, or in a deleted category) are left out but kept, so
 * they come back if the product is restored; rows whose product is gone for
 * good are cleaned up here.
 */
export const getUserWishlistIds = async (userId) => {
    await connectDB()
    const rows = await WishlistItemModel.find({ user: userId })
        .sort({ createdAt: -1, _id: -1 })
        .select('product')
        .lean()
    const ids = rows.map((row) => String(row.product))
    if (!ids.length) return []

    const status = await productStatus(ids)
    const gone = ids.filter((id) => !status.has(id))
    if (gone.length) {
        await WishlistItemModel.deleteMany({ user: userId, product: { $in: toObjectIds(gone) } })
    }
    return ids.filter((id) => status.get(id) === true)
}

export const addWishlistItem = async (userId, productId) => {
    await connectDB()
    await assertActiveUser(userId)

    const status = await productStatus([productId])
    if (status.get(productId) !== true) {
        throw new WishlistError(404, 'This product is no longer available.', 'UNAVAILABLE')
    }

    const already = await WishlistItemModel.exists({ user: userId, product: productId })
    if (!already) {
        const count = await WishlistItemModel.countDocuments({ user: userId })
        if (count >= MAX_WISHLIST_ITEMS) {
            throw new WishlistError(409, `Your wishlist is full (${MAX_WISHLIST_ITEMS} items). Remove something to save this.`, 'LIMIT')
        }
        try {
            await WishlistItemModel.create({ user: userId, product: productId })
        } catch (error) {
            // Saved by a parallel request in the meantime — the goal is met.
            if (error?.code !== 11000) throw error
        }
    }
    return getUserWishlistIds(userId)
}

export const removeWishlistItem = async (userId, productId) => {
    await connectDB()
    await WishlistItemModel.deleteOne({ user: userId, product: productId })
    return getUserWishlistIds(userId)
}

export const clearUserWishlist = async (userId) => {
    await connectDB()
    await WishlistItemModel.deleteMany({ user: userId })
    return []
}

/**
 * Folds a guest's on-device list (newest first) into the account on sign-in.
 * Already-saved and unavailable products are skipped, and only as many as fit
 * under the limit are added. Returns the merged list and what happened.
 */
export const mergeWishlist = async (userId, input) => {
    await connectDB()
    await assertActiveUser(userId)

    const ids = sanitizeWishlistIds(input)
    let added = 0
    let overLimit = 0

    if (ids.length) {
        const [status, existingRows, count] = await Promise.all([
            productStatus(ids),
            WishlistItemModel.find({ user: userId, product: { $in: toObjectIds(ids) } }).select('product').lean(),
            WishlistItemModel.countDocuments({ user: userId }),
        ])
        const existing = new Set(existingRows.map((row) => String(row.product)))
        const candidates = ids.filter((id) => status.get(id) === true && !existing.has(id))
        const room = Math.max(0, MAX_WISHLIST_ITEMS - count)
        const toInsert = candidates.slice(0, room)
        overLimit = candidates.length - toInsert.length

        if (toInsert.length) {
            // Keep the guest's order: the first id is the most recent save.
            const now = Date.now()
            const docs = toInsert.map((id, index) => ({
                user: userId,
                product: id,
                createdAt: new Date(now - index),
                updatedAt: new Date(now - index),
            }))
            try {
                const inserted = await WishlistItemModel.insertMany(docs, { ordered: false })
                added = inserted.length
            } catch (error) {
                // Duplicates from a concurrent merge are fine; anything else is not.
                const duplicateOnly = error?.code === 11000
                    || (Array.isArray(error?.writeErrors) && error.writeErrors.every((e) => (e?.code ?? e?.err?.code) === 11000))
                if (!duplicateOnly) throw error
                added = error?.insertedDocs?.length ?? error?.result?.insertedCount ?? 0
            }
        }
    }

    return { ids: await getUserWishlistIds(userId), added, overLimit }
}

/**
 * Card data for saved products, in the order given — the same shape the shop
 * API returns, so the storefront ProductCard renders it unchanged. Hidden
 * products are left out (the caller compares to see what disappeared). A live
 * product without any live pack size comes back with `defaultVariant: null`,
 * which the card shows as unavailable rather than dropping it silently.
 */
export const getWishlistProducts = async (input) => {
    const ids = sanitizeWishlistIds(input)
    if (!ids.length) return []
    await connectDB()

    const products = await ProductModel.aggregate([
        { $match: { _id: { $in: toObjectIds(ids) }, deletedAt: null } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $match: { 'category.deletedAt': null } },
        {
            $lookup: {
                from: 'productvariants',
                let: { productId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $project: { _id: 1, size: 1, mrp: 1, sellingPrice: 1 } },
                    { $limit: 1 },
                ],
                as: 'matchedVariants',
            },
        },
        {
            $lookup: {
                from: 'reviews',
                let: { productId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [{ $eq: ['$product', '$$productId'] }, { $eq: ['$deletedAt', null] }] } } },
                    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
                ],
                as: 'reviewStats',
            },
        },
        {
            $lookup: {
                from: 'medias',
                let: { mediaIds: { $ifNull: ['$media', []] } },
                // In the admin's order, so the saved item shows its main image.
                pipeline: orderedMediaPipeline({ project: { _id: 1, secure_url: 1, alt: 1 } }),
                as: 'media',
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                category: { name: 1, slug: 1 },
                mrp: 1,
                sellingPrice: 1,
                discountPercentage: 1,
                ratingAvg: { $ifNull: [{ $arrayElemAt: ['$reviewStats.avg', 0] }, 0] },
                ratingCount: { $ifNull: [{ $arrayElemAt: ['$reviewStats.count', 0] }, 0] },
                defaultVariant: { $ifNull: [{ $arrayElemAt: ['$matchedVariants', 0] }, null] },
                media: 1,
            },
        },
    ])

    const byId = new Map(products.map((product) => [String(product._id), product]))
    return toPlainObject(ids.map((id) => byId.get(id)).filter(Boolean))
}
