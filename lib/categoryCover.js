export const COVER_POSITIONS = ['center', 'top', 'bottom', 'left', 'right']

export const isCategoryCoverUrl = (value) => {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' &&
            !url.port && !url.username && !url.password && !url.search && !url.hash &&
            /\/image\/upload\//.test(url.pathname)
    } catch {
        return false
    }
}

// Only populated, active library assets can override the automatic artwork.
export const categoryCover = (category) => {
    const media = category?.coverImage
    if (!media || media.deletedAt || !isCategoryCoverUrl(media.secure_url)) return null
    return {
        src: media.secure_url,
        alt: category.coverAlt || media.alt || category.name || '',
        position: COVER_POSITIONS.includes(category.coverPosition) ? category.coverPosition : 'center',
    }
}

export const resolveCategoryArt = (category, fallback = null) => category.cover || fallback || {
    src: category.previewImage || category.image || '',
    alt: category.alt || category.name || '',
    position: 'center',
}
