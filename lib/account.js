// Pure helpers behind the customer account area (dashboard, orders, profile).
// No framework or path-alias imports so they stay unit-testable with node:test.

// Order statuses grouped the way a customer thinks about them.
export const ORDER_STATUS_GROUPS = Object.freeze({
    active: ['pending', 'processing', 'shipped'],
    delivered: ['delivered'],
    cancelled: ['cancelled', 'unverified'],
})

// Orders that never turned into a sale do not count towards "total spent".
const NON_SPENDING_STATUSES = new Set(['cancelled', 'unverified'])

export const statusGroupOf = (status) => {
    const key = typeof status === 'string' ? status.toLowerCase() : ''
    for (const [group, statuses] of Object.entries(ORDER_STATUS_GROUPS)) {
        if (statuses.includes(key)) return group
    }
    // Legacy or unknown statuses read as "in progress" rather than vanishing.
    return 'active'
}

const toNumber = (value) => {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
}

// Units ordered (sum of quantities), falling back to line count for legacy rows.
export const orderItemCount = (order) => {
    const products = Array.isArray(order?.products) ? order.products : []
    const units = products.reduce((sum, p) => sum + Math.max(0, toNumber(p?.qty)), 0)
    return units || products.length
}

// First image of a populated variant, tolerating the different media shapes
// (aggregate lookup returns an array, populate may return a doc or an id).
export const productImage = (product) => {
    const media = product?.variantId?.media
    const first = Array.isArray(media) ? media[0] : media
    if (!first || typeof first !== 'object') return null
    return first.secure_url || first.url || first.filePath || null
}

// Up to `max` distinct product thumbnails for an order card.
export const orderThumbnails = (order, max = 3) => {
    const products = Array.isArray(order?.products) ? order.products : []
    const seen = new Set()
    const thumbs = []
    for (const p of products) {
        const src = productImage(p)
        const name = p?.name || p?.productId?.name || 'Product'
        const key = src || `name:${name}`
        if (seen.has(key)) continue
        seen.add(key)
        thumbs.push({ src, name })
        if (thumbs.length === max) break
    }
    return { thumbs, extra: Math.max(0, products.length - thumbs.length) }
}

// Short "Cashew 250g, Almonds +2 more" style line for an order.
export const orderProductSummary = (order) => {
    const names = (Array.isArray(order?.products) ? order.products : [])
        .map((p) => p?.name || p?.productId?.name)
        .filter(Boolean)
    if (names.length === 0) return 'No items'
    if (names.length === 1) return names[0]
    return `${names[0]} +${names.length - 1} more`
}

export const summarizeOrders = (orders = []) => {
    const summary = { total: 0, active: 0, delivered: 0, cancelled: 0, totalSpent: 0 }
    for (const order of Array.isArray(orders) ? orders : []) {
        summary.total += 1
        summary[statusGroupOf(order?.status)] += 1
        if (!NON_SPENDING_STATUSES.has(order?.status)) {
            summary.totalSpent += toNumber(order?.totalAmount)
        }
    }
    return summary
}

// Client-side filter for the orders list: status group + free-text search over
// order id and product names.
export const filterOrders = (orders = [], { status = 'all', query = '' } = {}) => {
    const needle = String(query || '').trim().toLowerCase()
    return (Array.isArray(orders) ? orders : []).filter((order) => {
        if (status !== 'all' && statusGroupOf(order?.status) !== status) return false
        if (!needle) return true
        if (String(order?.order_id || '').toLowerCase().includes(needle)) return true
        return (order?.products || []).some((p) =>
            String(p?.name || p?.productId?.name || '').toLowerCase().includes(needle)
        )
    })
}

export const paginate = (items = [], page = 1, perPage = 10) => {
    const list = Array.isArray(items) ? items : []
    const size = Math.max(1, Math.floor(toNumber(perPage)) || 1)
    const totalPages = Math.max(1, Math.ceil(list.length / size))
    const current = Math.min(Math.max(1, Math.floor(toNumber(page)) || 1), totalPages)
    const start = (current - 1) * size
    return { items: list.slice(start, start + size), page: current, totalPages, total: list.length }
}

const filled = (value) => typeof value === 'string' ? value.trim().length > 0 : Boolean(value)

// Fields that make checkout one-tap. Landmark is optional and not counted.
export const PROFILE_FIELDS = Object.freeze([
    { key: 'name', label: 'Full name', isFilled: (u) => filled(u?.name) },
    { key: 'phone', label: 'Phone number', isFilled: (u) => filled(u?.phone) },
    { key: 'avatar', label: 'Profile photo', isFilled: (u) => filled(u?.avatar?.url) },
    { key: 'address', label: 'Street address', isFilled: (u) => filled(u?.address) },
    { key: 'city', label: 'City', isFilled: (u) => filled(u?.city) },
    { key: 'state', label: 'State', isFilled: (u) => filled(u?.state) },
    { key: 'pincode', label: 'Pincode', isFilled: (u) => filled(u?.pincode) },
    { key: 'country', label: 'Country', isFilled: (u) => filled(u?.country) },
])

export const profileCompletion = (user) => {
    const missing = PROFILE_FIELDS.filter((f) => !f.isFilled(user)).map((f) => f.label)
    const done = PROFILE_FIELDS.length - missing.length
    const percent = Math.round((done / PROFILE_FIELDS.length) * 100)
    return { percent, missing, complete: missing.length === 0 }
}

// Saved address as display lines, or null when there is nothing usable to show.
export const addressLines = (user) => {
    const clean = (v) => (typeof v === 'string' ? v.trim() : '')
    const street = clean(user?.address)
    const landmark = clean(user?.landmark)
    const cityLine = [clean(user?.city), clean(user?.state)].filter(Boolean).join(', ')
    const region = [cityLine, clean(user?.pincode)].filter(Boolean).join(' - ')
    const lines = [street, landmark && `Near ${landmark}`, region, clean(user?.country)].filter(Boolean)
    return street || region ? lines : null
}

export const greetingFor = (date = new Date()) => {
    const hour = date instanceof Date && !Number.isNaN(date.getTime()) ? date.getHours() : 12
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export const firstName = (name) => {
    const first = String(name || '').trim().split(/\s+/)[0]
    return first || 'there'
}

export const initials = (name) => {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    const letters = parts.length === 1 ? parts[0].slice(0, 1) : parts[0][0] + parts[parts.length - 1][0]
    return letters.toUpperCase()
}

export const formatDate = (value, withTime = false) => {
    if (!value) return null
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    })
}

export const formatCurrency = (value) =>
    toNumber(value).toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })
