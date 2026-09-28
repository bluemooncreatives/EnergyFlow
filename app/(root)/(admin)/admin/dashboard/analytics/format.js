// Number / date formatting shared by every analytics panel (en-IN, IST).

export const inr = (value, { compact = false } = {}) => {
    const n = Number(value) || 0
    if (compact && Math.abs(n) >= 1000) {
        // ₹1.2K, ₹3.4L, ₹1.1Cr — the Indian scale shoppers and owners use.
        if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 1)}Cr`
        if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 0 : 1)}L`
        return `₹${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`
    }
    return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: n % 1 ? 2 : 0 })
}

export const num = (value) => (Number(value) || 0).toLocaleString('en-IN')

export const pct = (value, dp = 1) => `${(Number(value) || 0).toFixed(dp).replace(/\.0$/, '')}%`

export const share = (part, total) => (total ? (Number(part) / Number(total)) * 100 : 0)

const IST = 'Asia/Kolkata'

// Bucket key ("2026-09-28", "2026-09") → axis / tooltip label.
export const bucketLabel = (key, granularity, long = false) => {
    if (!key) return ''
    if (granularity === 'month') {
        const [y, m] = key.split('-').map(Number)
        return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString('en-IN', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' })
    }
    const d = new Date(`${key}T12:00:00Z`)
    const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC', ...(long ? { weekday: 'short' } : {}) })
    return granularity === 'week' ? (long ? `Week of ${label}` : label) : label
}

export const dateTime = (value) =>
    value ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: IST }) : '—'

export const shortDate = (value) =>
    value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: IST }) : '—'

export const relative = (value) => {
    if (!value) return ''
    const diff = Date.now() - new Date(value).getTime()
    const m = Math.round(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m} min ago`
    const h = Math.round(m / 60)
    if (h < 24) return `${h} h ago`
    return `${Math.round(h / 24)} d ago`
}

export const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const PAYMENT_METHOD_LABEL = { cod: 'Cash on delivery', full: 'Prepaid', partial: 'Part prepaid', unknown: 'Unknown' }
export const PAYMENT_STATUS_LABEL = { fully_paid: 'Paid', partial_paid: 'Part paid', unpaid: 'Unpaid' }
export const NEWSLETTER_SOURCE_LABEL = { popup: 'Popup', section: 'Homepage band', footer: 'Footer', unknown: 'Other' }
