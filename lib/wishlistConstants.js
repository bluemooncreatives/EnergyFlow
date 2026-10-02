// Shared by the wishlist API, its service and the client store, so both sides
// agree on what a valid entry is and how many a list may hold.

// Generous for a grocery catalogue, small enough that every request stays cheap.
export const MAX_WISHLIST_ITEMS = 100

const OBJECT_ID = /^[a-f0-9]{24}$/i

export const isObjectIdString = (value) => typeof value === 'string' && OBJECT_ID.test(value)

// Untrusted input (request bodies, a hand-edited localStorage) → unique,
// well-formed, lower-cased product ids in their original order, capped.
export const sanitizeWishlistIds = (input, max = MAX_WISHLIST_ITEMS) => {
    if (!Array.isArray(input)) return []
    const seen = new Set()
    const ids = []
    for (const value of input) {
        if (!isObjectIdString(value)) continue
        const id = value.toLowerCase()
        if (seen.has(id)) continue
        seen.add(id)
        ids.push(id)
        if (ids.length >= max) break
    }
    return ids
}
