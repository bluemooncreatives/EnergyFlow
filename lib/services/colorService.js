import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { normalizeColor } from '@/lib/utils'
import ProductVariantModel from '@/models/ProductVariant.model'
import '@/models/Product.model'
import '@/models/Media.model'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

// "Shop by Colour" mirrors the Categories archive: a capped list of the most
// shoppable colours, each with a representative product image.
const HOME_COLOR_COUNT = 9

// Active-product join reused by both passes: a variant only counts if its parent
// product exists and is not soft-deleted (a colour with only trashed products
// must not surface, and its shop link would return nothing).
const activeProductLookup = {
    $lookup: {
        from: 'products',
        let: { pid: '$product' },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $eq: ['$_id', '$$pid'] },
                            { $eq: ['$deletedAt', null] }
                        ]
                    }
                }
            },
            { $project: { _id: 1, media: 1, createdAt: 1 } }
        ],
        as: 'prod'
    }
}

// Resolve the first non-deleted media asset from an array of media ids.
const firstUsableMediaLookup = (mediaIdsExpr, as) => ({
    $lookup: {
        from: 'medias',
        let: { mediaIds: { $ifNull: [mediaIdsExpr, []] } },
        pipeline: [
            {
                $match: {
                    $expr: {
                        $and: [
                            { $in: ['$_id', '$$mediaIds'] },
                            { $eq: ['$deletedAt', null] }
                        ]
                    }
                }
            },
            { $project: { _id: 0, secure_url: 1, alt: 1 } },
            { $limit: 1 }
        ],
        as
    }
})

const fetchHomeColors = async () => {
    await connectDB()

    // 1) Rank colours by how many distinct active products are available in each.
    //    Group on a case/whitespace-normalised key so legacy mixed-case rows
    //    ("Emerald" + "EMERALD") collapse into one colour.
    const ranked = await ProductVariantModel.aggregate([
        { $match: { deletedAt: null } },
        activeProductLookup,
        { $match: { 'prod.0': { $exists: true } } },
        { $addFields: { prod: { $arrayElemAt: ['$prod', 0] } } },
        {
            $group: {
                _id: { $toLower: { $trim: { input: '$color' } } },
                displayName: { $first: '$color' },
                products: { $addToSet: '$prod._id' },
                latest: { $max: '$prod.createdAt' }
            }
        },
        { $project: { displayName: 1, latest: 1, count: { $size: '$products' } } },
        { $sort: { count: -1, displayName: 1 } },
        { $limit: HOME_COLOR_COUNT }
    ])

    if (!ranked.length) return []

    const topKeys = ranked.map((row) => row._id)

    // 2) Pick a representative image per colour: prefer the variant's own media
    //    (shows the product in that colour), falling back to the parent product's
    //    media. Newest product first so the image stays fresh.
    const imageRows = await ProductVariantModel.aggregate([
        { $match: { deletedAt: null } },
        { $addFields: { colorKey: { $toLower: { $trim: { input: '$color' } } } } },
        { $match: { colorKey: { $in: topKeys } } },
        activeProductLookup,
        { $match: { 'prod.0': { $exists: true } } },
        { $addFields: { prod: { $arrayElemAt: ['$prod', 0] } } },
        firstUsableMediaLookup('$media', 'variantImg'),
        firstUsableMediaLookup('$prod.media', 'productImg'),
        {
            $addFields: {
                img: {
                    $ifNull: [
                        { $arrayElemAt: ['$variantImg', 0] },
                        { $arrayElemAt: ['$productImg', 0] }
                    ]
                }
            }
        },
        { $match: { img: { $ne: null } } },
        { $sort: { 'prod.createdAt': -1, _id: -1 } },
        { $group: { _id: '$colorKey', image: { $first: '$img' } } }
    ])

    const imageByKey = new Map(imageRows.map((row) => [row._id, row.image]))

    // 3) Keep only colours with a usable image, preserving the popularity order.
    const colors = ranked
        .filter((row) => imageByKey.has(row._id))
        .map((row) => {
            // Canonicalise the label for display + the shop filter link.
            const name = normalizeColor(row.displayName) || row.displayName
            const image = imageByKey.get(row._id)
            return {
                id: row._id,
                name,
                href: `${WEBSITE_SHOP}?color=${encodeURIComponent(name)}`,
                productCount: row.count,
                stylesLabel: `${row.count} ${row.count === 1 ? 'Style' : 'Styles'}`,
                year: row.latest ? new Date(row.latest).getFullYear() : new Date().getFullYear(),
                previewImage: image?.secure_url || ''
            }
        })
        .filter((color) => color.previewImage)

    return toPlainObject(colors)
}

export const getHomeColors = unstable_cache(
    fetchHomeColors,
    ['storefront-home-colors'],
    {
        revalidate: 300,
        tags: ['storefront-home-colors']
    }
)
