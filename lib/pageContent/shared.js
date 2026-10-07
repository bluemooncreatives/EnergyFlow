/* ================================================================
   PAGE CONTENT — shared, dependency-free helpers
   Admin-editable copy, lists and photos for hand-designed storefront
   pages (gift boxes, about us). The storefront imports these readers;
   validation lives in schema.js (zod), which the admin form and the
   API share.
   ================================================================ */

export const IMAGE_POSITIONS = ['center', 'top', 'bottom', 'left', 'right']

// An image slot: a media-library pick (mediaId + its URL at pick time), or
// a built-in default URL with no mediaId. `url: ''` means "automatic": the
// section falls back to a product photo or brand artwork.
export const EMPTY_IMAGE = { mediaId: '', url: '', alt: '', position: 'center' }

export const image = (url = '', alt = '', position = 'center') => ({ mediaId: '', url, alt, position })

export const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

/**
 * Deep-merge a stored document over the defaults, so a field added in a later
 * release (or missing from an older document) always has a sane value and a
 * tampered document can never change a field's type.
 *
 *   • objects merge key by key, keeping only keys the defaults know;
 *   • arrays come whole from the stored document when it has one (an admin
 *     who removed every item meant it); each item is merged over the
 *     `templates[path]` item shape when there is one, otherwise only strings
 *     survive (every primitive list here is a list of strings);
 *   • primitives take the stored value only when its type matches.
 */
export const mergeContent = (base, override, templates = {}, path = '') => {
    if (Array.isArray(base)) {
        // A copy, so nothing downstream can edit the defaults through it.
        if (!Array.isArray(override)) return JSON.parse(JSON.stringify(base))
        const template = templates[path]
        if (isPlainObject(template)) {
            return override.filter(isPlainObject).map((item) => mergeContent(template, item, templates, `${path}[]`))
        }
        return override.filter((item) => typeof item === 'string')
    }
    if (isPlainObject(base)) {
        // Rebuilt even with nothing stored, so the result never shares an
        // object with the defaults.
        const source = isPlainObject(override) ? override : {}
        const out = {}
        for (const key of Object.keys(base)) {
            out[key] = mergeContent(base[key], source[key], templates, path ? `${path}.${key}` : key)
        }
        return out
    }
    if (override === undefined || override === null) return base
    return typeof override === typeof base ? override : base
}

// Every image slot in a content tree (for re-checking media-library picks).
export const collectImages = (node, found = []) => {
    if (Array.isArray(node)) {
        node.forEach((item) => collectImages(item, found))
    } else if (isPlainObject(node)) {
        if (typeof node.url === 'string' && typeof node.mediaId === 'string' && 'position' in node) {
            found.push(node)
        } else {
            Object.values(node).forEach((value) => collectImages(value, found))
        }
    }
    return found
}

// "01", "02" … for section and step numbers.
export const pad2 = (n) => String(n).padStart(2, '0')

// Split admin-written multi-paragraph text on blank lines.
export const paragraphs = (text) =>
    String(text || '')
        .split(/\n\s*\n/)
        .map((part) => part.replace(/\s+/g, ' ').trim())
        .filter(Boolean)

// Replace {tokens} with live values. A stat whose token resolves to nothing
// (or zero) is dropped by the caller rather than shown as "0+ products".
export const fillTokens = (text, values) => {
    let empty = false
    const out = String(text || '').replace(/\{(\w+)\}/g, (match, key) => {
        if (!(key in values)) return match
        const value = values[key]
        if (!value) empty = true
        return typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? '')
    })
    return { text: out, empty }
}
