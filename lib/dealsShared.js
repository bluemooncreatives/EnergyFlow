/* ================================================================
   DEALS OF THE MONTH — defaults and readers, free of zod and mongoose
   so the storefront rail can import them without either landing in its
   client bundle. Validation lives in dealsConfig.js, which re-exports
   all of this. The products are curated separately (Product.isDeal).
   ================================================================ */

// The rail is one banner plus this many cards; the layout holds no more.
export const DEAL_SLOTS = 3

export const DEFAULT_DEAL_BANNER_IMAGE = '/assets/images/banner/gift-box-deal.jpg'

export const COUNTDOWN_MODES = ['month-end', 'custom', 'off']

export const DEFAULT_DEAL_SETTINGS = {
    section: {
        enabled: true,
        eyebrow: 'Limited time',
        title: 'Deals of',
        titleAccent: 'the month',
        description: 'Our deepest markdowns right now, while stock lasts.',
    },
    countdown: {
        mode: 'month-end',
        // ISO timestamp; only read when mode is 'custom'.
        endsAt: '',
        label: 'Offer ends in',
    },
    banner: {
        title: 'Gift Boxes, Ready To Send',
        copy: 'Festive, wedding and team gifting, packed and ready to go.',
        image: {
            url: '',
            alt: 'A wooden gift tray of raisins, cashews, almonds and pistachios beside a ribboned box',
        },
        buttonText: 'Shop now',
        link: '/shop',
    },
}

/* ── Reading ────────────────────────────────────────────────── */

export const isValidDate = (value) => Boolean(value) && !Number.isNaN(Date.parse(value))

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Deep-merge a stored document over the defaults so a field added in a later
// release (or missing from an older document) always has a sane value.
const deepMerge = (base, override) => {
    if (!isPlainObject(override)) return base
    const out = { ...base }
    for (const key of Object.keys(base)) {
        const next = override[key]
        if (next === undefined || next === null) continue
        out[key] = isPlainObject(base[key]) ? deepMerge(base[key], next) : next
    }
    return out
}

export const mergeDealSettings = (stored) => deepMerge(DEFAULT_DEAL_SETTINGS, stored || {})

// The moment the countdown runs out, or null when there is no deadline.
// 'month-end' rolls over to the next month on the 1st, in the viewer's time.
export const dealDeadline = (countdown, now = new Date()) => {
    if (countdown?.mode === 'custom') return isValidDate(countdown.endsAt) ? new Date(countdown.endsAt) : null
    if (countdown?.mode === 'month-end') return new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return null
}

// A custom deadline that has passed ends the deal: the section stops showing.
export const dealHasEnded = (countdown, now = new Date()) =>
    countdown?.mode === 'custom' && (!isValidDate(countdown.endsAt) || Date.parse(countdown.endsAt) <= now.getTime())
