import { revalidatePath, revalidateTag } from 'next/cache'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { PAGE_CONTENT, firstIssue } from '@/lib/pageContent/schema'
import { collectImages } from '@/lib/pageContent/shared'
import { loadPageContent, pageContentTag } from '@/lib/services/pageContentService'
import MediaModel from '@/models/Media.model'
import PageContentModel from '@/models/PageContent.model'

const pageFor = async (params) => {
    const { key } = await params
    // Own keys only: "constructor" and friends are not pages.
    return Object.hasOwn(PAGE_CONTENT, key) ? { key, entry: PAGE_CONTENT[key] } : null
}

// GET — the page's content (defaults merged in) for the admin editor.
export async function GET(_request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })

        const page = await pageFor(params)
        if (!page) return response(false, 404, 'Unknown page.', {}, { status: 404 })

        return response(true, 200, `${page.entry.label} content.`, await loadPageContent(page.key))
    } catch (error) {
        return catchError(error)
    }
}

// PUT — publish new content. Body: { content, baseUpdatedAt }.
//   • The whole shape is validated by the schema the editor uses.
//   • Newly picked media must still be in the library; a pick that was
//     already saved keeps its reference even while trashed, so restoring the
//     photo brings it back (the storefront shows the automatic image
//     meanwhile).
//   • `baseUpdatedAt` is the version the editor loaded: if someone else has
//     published since, the save is refused instead of overwriting them.
export async function PUT(request, { params }) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) return response(false, 403, 'Unauthorized.', {}, { status: 403 })

        const page = await pageFor(params)
        if (!page) return response(false, 404, 'Unknown page.', {}, { status: 404 })

        const payload = await request.json().catch(() => null)
        const validate = page.entry.schema.safeParse(payload?.content)
        if (!validate.success) {
            return response(false, 400, firstIssue(validate.error), validate.error, { status: 400 })
        }
        const content = validate.data
        const baseUpdatedAt = typeof payload?.baseUpdatedAt === 'string' && !Number.isNaN(Date.parse(payload.baseUpdatedAt))
            ? payload.baseUpdatedAt
            : null

        await connectDB()

        const current = await PageContentModel.findOne({ key: page.key }).select('content').lean()
        const savedIds = new Set(collectImages(current?.content || {}).map((img) => img.mediaId).filter(Boolean))
        const picks = collectImages(content).filter((img) => img.mediaId)
        if (picks.length) {
            const ids = [...new Set(picks.map((img) => img.mediaId))]
            const live = await MediaModel.find({ _id: { $in: ids }, deletedAt: null, deletionPending: { $ne: true } })
                .select('secure_url')
                .lean()
            const urlById = new Map(live.map((media) => [String(media._id), media.secure_url]))
            for (const img of picks) {
                const url = urlById.get(img.mediaId)
                if (url) {
                    img.url = url
                } else if (!savedIds.has(img.mediaId)) {
                    return response(false, 400, 'One of the photos you picked is no longer in the media library. Choose another photo.', {}, { status: 400 })
                }
            }
        }

        const updatedBy = auth.email || ''
        let doc = null
        if (baseUpdatedAt) {
            doc = await PageContentModel.findOneAndUpdate(
                { key: page.key, updatedAt: new Date(baseUpdatedAt) },
                { $set: { content, updatedBy } },
                { new: true }
            ).lean()
        } else {
            try {
                doc = (await PageContentModel.create({ key: page.key, content, updatedBy })).toObject()
            } catch (error) {
                if (error?.code !== 11000) throw error
            }
        }

        if (!doc) {
            return response(
                false,
                409,
                'Someone else published changes to this page after you opened it. Reload to see their version before saving again.',
                {},
                { status: 409 }
            )
        }

        revalidateTag(pageContentTag(page.key))
        revalidatePath(page.entry.path)
        return response(true, 200, 'Published. The page is updated.', {
            content: page.entry.merge(JSON.parse(JSON.stringify(doc.content))),
            updatedAt: new Date(doc.updatedAt).toISOString(),
            updatedBy: doc.updatedBy || '',
        })
    } catch (error) {
        return catchError(error)
    }
}
