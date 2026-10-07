import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import { ABOUT_PAGE_KEY } from '@/lib/pageContent/aboutPage'
import { GIFT_PAGE_KEY } from '@/lib/pageContent/giftPage'
import { PAGE_CONTENT } from '@/lib/pageContent/schema'
import { collectImages } from '@/lib/pageContent/shared'
import MediaModel from '@/models/Media.model'
import PageContentModel from '@/models/PageContent.model'

// Every page's storefront read carries the shared tag (media-library edits
// refresh them all, see revalidateCatalogue) and its own (a save refreshes
// just that page).
export const PAGE_CONTENT_TAG = 'storefront-page-content'
export const pageContentTag = (key) => `${PAGE_CONTENT_TAG}-${key}`

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

/**
 * The page's full content (defaults merged in) for the admin editor, plus
 * when and by whom it was last published. `updatedAt` doubles as the
 * editor's version: a save against an older one is refused.
 */
export const loadPageContent = async (key) => {
    if (!Object.hasOwn(PAGE_CONTENT, key)) return null
    const entry = PAGE_CONTENT[key]
    await connectDB()
    const doc = await PageContentModel.findOne({ key }).lean()
    return {
        content: entry.merge(doc ? toPlainObject(doc.content) : null),
        updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
        updatedBy: doc?.updatedBy || '',
    }
}

// Media-library picks are re-checked on every storefront read: a photo the
// admin has since trashed (or is deleting) drops back to the section's
// automatic image, a restored one returns, and a re-uploaded asset's current
// URL is used. Built-in default photos carry no mediaId and pass untouched.
const resolveMedia = async (content) => {
    const picks = collectImages(content).filter((img) => img.mediaId)
    if (!picks.length) return content
    const ids = [...new Set(picks.map((img) => img.mediaId))]
    const live = await MediaModel.find({ _id: { $in: ids }, deletedAt: null, deletionPending: { $ne: true } })
        .select('secure_url')
        .lean()
    const urlById = new Map(live.map((media) => [String(media._id), media.secure_url]))
    for (const img of picks) img.url = urlById.get(img.mediaId) || ''
    return content
}

const fetchPublicContent = async (key) => {
    const loaded = await loadPageContent(key)
    // A deep copy: the merge can hand back the defaults' own arrays.
    return resolveMedia(toPlainObject(loaded.content))
}

const cachedPage = (key) => unstable_cache(
    () => fetchPublicContent(key),
    [PAGE_CONTENT_TAG, key],
    { revalidate: 300, tags: [PAGE_CONTENT_TAG, pageContentTag(key)] }
)

export const getGiftPageContent = cachedPage(GIFT_PAGE_KEY)
export const getAboutPageContent = cachedPage(ABOUT_PAGE_KEY)
