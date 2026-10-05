import { z } from 'zod'
import { NEWSLETTER_LAYOUTS, NEWSLETTER_THEMES } from './newsletterShared'

/* ================================================================
   NEWSLETTER — shared settings shape
   Imported by the admin form (client), the settings API (server) and
   the storefront service, so defaults and validation live in one place.
   Nothing here touches mongoose, so it is safe in client bundles; the
   storefront itself imports the zod-free helpers from newsletterShared.
   ================================================================ */

export {
    NEWSLETTER_LAYOUTS,
    NEWSLETTER_THEMES,
    NEWSLETTER_SOURCES,
    NEWSLETTER_EMAIL_REGEX,
    isNewsletterPathAllowed,
} from './newsletterShared'

// Storefront paths the popup never interrupts by default: the buying flow.
export const DEFAULT_EXCLUDED_PATHS = ['/cart', '/checkout', '/order-details']

export const DEFAULT_NEWSLETTER_SETTINGS = {
    popup: {
        enabled: true,
        layout: 'split',
        theme: 'pine',
        imagePosition: 'left',
        image: { url: '', alt: '' },
        eyebrow: 'The Energyflow club',
        title: 'Fresh drops,',
        titleAccent: 'first dibs',
        description:
            'Join the list for new harvests, member-only deals and simple recipes that make healthy snacking easy.',
        perks: ['Early access to new harvests', 'Members-only offers', 'No spam, ever'],
        offer: {
            enabled: false,
            badge: '10% OFF',
            couponCode: '',
            note: 'Your welcome code, on your first order.',
        },
        collectName: false,
        placeholder: 'Enter your email address',
        buttonText: 'Join the club',
        declineText: 'Maybe later',
        consentText: 'By subscribing you agree to receive marketing emails from Energyflow. Unsubscribe anytime.',
        successTitle: "You're in!",
        successMessage: "Welcome to the club. Keep an eye on your inbox - the good stuff is on its way.",
        successButtonText: 'Start shopping',
        teaser: { enabled: true, text: 'Join the club' },
    },
    behavior: {
        delaySeconds: 8,
        scrollPercent: 0,
        exitIntent: true,
        dismissDays: 7,
        pages: 'all',
        excludePaths: DEFAULT_EXCLUDED_PATHS,
        showOnDesktop: true,
        showOnMobile: true,
    },
    section: {
        enabled: true,
        theme: 'sun',
        eyebrow: 'Newsletter',
        title: 'Good things,',
        titleAccent: 'in your inbox',
        description:
            'Seasonal harvests, restocks of the favourites and member-only deals - twice a month, never more.',
        perks: ['Members-only deals', 'New harvests first', 'Recipes & tips'],
        showOffer: true,
        collectName: false,
        placeholder: 'Your email address',
        buttonText: 'Subscribe',
        consentText: 'We respect your inbox. Unsubscribe with one click.',
        successMessage: "You're subscribed! Check your inbox for a welcome note from us.",
    },
    footer: {
        enabled: true,
        title: 'Stay in the loop',
        description: 'New harvests and member-only deals, straight to your inbox.',
        buttonText: 'Subscribe',
    },
    emails: {
        welcomeEnabled: true,
        welcomeSubject: 'Welcome to the Energyflow club',
        notifyAdmin: false,
    },
}

/* ── Validation ─────────────────────────────────────────────── */

const text = (max, { required = false, label = 'This field' } = {}) => {
    const base = z.string().trim().max(max, `${label} must be at most ${max} characters.`)
    return required ? base.min(1, `${label} is required.`) : base
}

const perksSchema = z
    .array(text(60, { label: 'Perk' }))
    .max(4, 'Add at most 4 perks.')
    .transform((list) => list.filter(Boolean))

// Paths are stored normalised: leading slash, no trailing slash, no query.
const pathListSchema = z
    .array(z.string().trim().max(120))
    .max(30, 'Add at most 30 paths.')
    .transform((list) =>
        [...new Set(
            list
                .map((p) => p.split(/[?#]/)[0].trim())
                .filter(Boolean)
                .map((p) => ('/' + p.replace(/^\/+/, '')).replace(/\/+$/, '') || '/')
        )]
    )

export const newsletterSettingsSchema = z.object({
    popup: z.object({
        enabled: z.boolean(),
        layout: z.enum(NEWSLETTER_LAYOUTS),
        theme: z.enum(NEWSLETTER_THEMES),
        imagePosition: z.enum(['left', 'right']),
        image: z.object({
            url: z.string().trim().max(500).refine(
                (v) => v === '' || /^https:\/\/res\.cloudinary\.com\//.test(v) || v.startsWith('/'),
                'Pick the image from the media library.'
            ),
            alt: text(140, { label: 'Alt text' }),
        }),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(40, { required: true, label: 'Headline' }),
        titleAccent: text(40, { label: 'Accent' }),
        description: text(240, { label: 'Description' }),
        perks: perksSchema,
        offer: z.object({
            enabled: z.boolean(),
            badge: text(14, { label: 'Badge' }),
            couponCode: z.string().trim().toUpperCase().max(40),
            note: text(90, { label: 'Offer note' }),
        }),
        collectName: z.boolean(),
        placeholder: text(60, { required: true, label: 'Placeholder' }),
        buttonText: text(28, { required: true, label: 'Button text' }),
        declineText: text(50, { label: 'Decline text' }),
        consentText: text(220, { label: 'Consent text' }),
        successTitle: text(40, { required: true, label: 'Success title' }),
        successMessage: text(220, { label: 'Success message' }),
        successButtonText: text(28, { required: true, label: 'Success button' }),
        teaser: z.object({
            enabled: z.boolean(),
            text: text(28, { label: 'Teaser text' }),
        }),
    }).superRefine((popup, ctx) => {
        if (popup.offer.enabled && !popup.offer.couponCode) {
            ctx.addIssue({ code: 'custom', path: ['offer', 'couponCode'], message: 'Choose the coupon to hand out.' })
        }
        if (popup.offer.enabled && !popup.offer.badge) {
            ctx.addIssue({ code: 'custom', path: ['offer', 'badge'], message: 'Badge text is required for an offer.' })
        }
        if (popup.teaser.enabled && !popup.teaser.text) {
            ctx.addIssue({ code: 'custom', path: ['teaser', 'text'], message: 'Teaser text is required.' })
        }
    }),
    behavior: z.object({
        delaySeconds: z.coerce.number().int().min(0, 'Min 0 seconds.').max(120, 'Max 120 seconds.'),
        scrollPercent: z.coerce.number().int().min(0, 'Min 0%.').max(100, 'Max 100%.'),
        exitIntent: z.boolean(),
        dismissDays: z.coerce.number().int().min(0, 'Min 0 days.').max(365, 'Max 365 days.'),
        pages: z.enum(['all', 'home']),
        excludePaths: pathListSchema,
        showOnDesktop: z.boolean(),
        showOnMobile: z.boolean(),
    }).superRefine((behavior, ctx) => {
        // Settings that would silently mean "never shows" are caught here.
        if (!behavior.showOnDesktop && !behavior.showOnMobile) {
            ctx.addIssue({ code: 'custom', path: ['showOnMobile'], message: 'Pick at least one device, or switch the popup off.' })
        }
        if (behavior.pages === 'home' && behavior.excludePaths.includes('/')) {
            ctx.addIssue({ code: 'custom', path: ['excludePaths'], message: 'The homepage is excluded, so the popup would never show.' })
        }
    }),
    section: z.object({
        enabled: z.boolean(),
        theme: z.enum(NEWSLETTER_THEMES),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(40, { required: true, label: 'Headline' }),
        titleAccent: text(40, { label: 'Accent' }),
        description: text(240, { label: 'Description' }),
        perks: perksSchema,
        showOffer: z.boolean(),
        collectName: z.boolean(),
        placeholder: text(60, { required: true, label: 'Placeholder' }),
        buttonText: text(28, { required: true, label: 'Button text' }),
        consentText: text(220, { label: 'Consent text' }),
        successMessage: text(220, { label: 'Success message' }),
    }),
    footer: z.object({
        enabled: z.boolean(),
        title: text(40, { required: true, label: 'Title' }),
        description: text(140, { label: 'Description' }),
        buttonText: text(28, { required: true, label: 'Button text' }),
    }),
    emails: z.object({
        welcomeEnabled: z.boolean(),
        welcomeSubject: text(120, { required: true, label: 'Subject' }),
        notifyAdmin: z.boolean(),
    }),
})

/* ── Merge ──────────────────────────────────────────────────── */

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Deep-merge a stored document over the defaults so a field added in a later
// release (or missing from an older document) always has a sane value.
// Arrays and scalars from the stored side win as-is.
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

export const mergeNewsletterSettings = (stored) =>
    deepMerge(DEFAULT_NEWSLETTER_SETTINGS, stored || {})
