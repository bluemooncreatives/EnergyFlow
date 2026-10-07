import { z } from 'zod'
import { OCCASION_VALUES } from '../giftEnquiry.js'
import { ABOUT_PAGE_KEY, ABOUT_PAGE_LIMITS, DEFAULT_ABOUT_PAGE, mergeAboutPage } from './aboutPage.js'
import { DEFAULT_GIFT_PAGE, GIFT_PAGE_KEY, GIFT_PAGE_LIMITS, mergeGiftPage } from './giftPage.js'
import { IMAGE_POSITIONS } from './shared.js'

/* ================================================================
   PAGE CONTENT — validation
   One zod schema per page, shared by the admin editor (client) and
   /api/page-content/[key] (server), so the storefront can trust what
   it reads. Limits are generous enough for real copy and tight enough
   that no field can break a layout.
   ================================================================ */

const text = (max, { required = false, label = 'This field' } = {}) => {
    const base = z.string().trim().max(max, `${label} must be at most ${max} characters.`)
    return required ? base.min(1, `${label} is required.`) : base
}

const isStorefrontPath = (value) => /^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)

const isHttpsUrl = (value) => {
    if (!/^https:\/\//.test(value) || /[\\\s]/.test(value)) return false
    try {
        const url = new URL(value)
        return !url.username && !url.password
    } catch {
        return false
    }
}

const isCloudinaryImage = (value) => {
    if (!isHttpsUrl(value)) return false
    const url = new URL(value)
    return url.hostname === 'res.cloudinary.com' && !url.port && !url.search && !url.hash && /\/image\/upload\//.test(url.pathname)
}

const link = (label = 'Link') => z.string().trim().max(300, `${label} is too long.`).refine(
    (v) => isStorefrontPath(v) || isHttpsUrl(v),
    'Use a storefront path like /shop or a full https:// link.'
)

export const imageSchema = z.object({
    mediaId: z.string().trim().max(24).refine((v) => v === '' || /^[a-f0-9]{24}$/i.test(v), 'Pick the image again from the media library.'),
    url: z.string().trim().max(500).refine(
        (v) => v === '' || isCloudinaryImage(v) || (isStorefrontPath(v) && !v.startsWith('/api/')),
        'Pick the image from the media library.'
    ),
    alt: text(160, { label: 'Alt text' }),
    position: z.enum(IMAGE_POSITIONS),
}).superRefine((value, ctx) => {
    if (value.url && !value.alt) {
        ctx.addIssue({ code: 'custom', path: ['alt'], message: 'Describe the photo for screen readers.' })
    }
})

const list = (item, { min = 0, max, label }) =>
    z.array(item)
        .min(min, min === 1 ? `Add at least one ${label}.` : `Add at least ${min} ${label}s.`)
        .max(max, `Use at most ${max} ${label}s.`)

const tags = (max, itemMax = 32) => list(text(itemMax, { required: true, label: 'Tag' }), { max, label: 'tag' })

/* ── Gift boxes ─────────────────────────────────────────────── */

const G = GIFT_PAGE_LIMITS

export const giftPageSchema = z.object({
    hero: z.object({
        wordmark: text(24, { required: true, label: 'Headline' }),
        tagline: text(90, { label: 'Tagline' }),
        scrollLabel: text(30, { label: 'Scroll label' }),
        badge: text(36, { label: 'Photo pill' }),
        caption: text(200, { label: 'Photo caption' }),
        image: imageSchema,
    }),
    ticker: z.object({
        enabled: z.boolean(),
        items: list(text(40, { required: true, label: 'Ticker phrase' }), { max: G.tickerItems, label: 'phrase' }),
    }).superRefine((value, ctx) => {
        if (value.enabled && value.items.length < 2) {
            ctx.addIssue({ code: 'custom', path: ['items'], message: 'Add at least two phrases, or switch the ticker off.' })
        }
    }),
    collection: z.object({
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        noteTitle: text(60, { label: 'Note title' }),
        note: text(240, { label: 'Note' }),
        listTitle: text(30, { required: true, label: 'List title' }),
    }),
    occasions: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        label: text(120, { label: 'Side label' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        image: imageSchema,
        items: list(z.object({
            occasion: z.enum(OCCASION_VALUES, { errorMap: () => ({ message: 'Choose which enquiry occasion this opens.' }) }),
            title: text(40, { required: true, label: 'Title' }),
            note: text(120, { label: 'Note' }),
            audience: text(60, { label: 'Perfect for' }),
            includes: tags(G.occasionIncludes),
            product: z.string().trim().max(120).regex(/^[a-z0-9-]*$/, 'Use the box’s web address name, e.g. gift-box-black.'),
            image: imageSchema,
            thumb: imageSchema,
        }), { max: G.occasions, label: 'occasion' }),
    }),
    promise: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { required: true, label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        note: text(220, { label: 'Note' }),
        items: list(z.object({
            title: text(50, { required: true, label: 'Title' }),
            copy: text(200, { label: 'Copy' }),
            tags: tags(G.tags),
            image: imageSchema,
        }), { max: G.promises, label: 'card' }),
    }),
    testimonials: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { required: true, label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        image: imageSchema,
        items: list(z.object({
            quote: text(400, { required: true, label: 'Quote' }),
            name: text(60, { required: true, label: 'Name' }),
            role: text(60, { label: 'Role' }),
            company: text(60, { label: 'Company' }),
            rating: z.number().int().min(0).max(5),
            photo: imageSchema,
        }), { max: G.testimonials, label: 'testimonial' }),
    }),
    enquiry: z.object({
        eyebrow: text(40, { required: true, label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        description: text(240, { label: 'Description' }),
        perks: list(text(40, { required: true, label: 'Perk' }), { max: G.perks, label: 'perk' }),
    }),
    faq: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { required: true, label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        description: text(200, { label: 'Description' }),
        items: list(z.object({
            question: text(160, { required: true, label: 'Question' }),
            answer: text(800, { required: true, label: 'Answer' }),
        }), { max: G.faqs, label: 'question' }),
    }),
    cta: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        description: text(220, { label: 'Description' }),
        buttonLabel: text(30, { required: true, label: 'Button text' }),
        image: imageSchema,
    }),
})

/* ── About us ───────────────────────────────────────────────── */

const A = ABOUT_PAGE_LIMITS

export const aboutPageSchema = z.object({
    hero: z.object({
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'First line' }),
        titleAccent: text(60, { label: 'Second line' }),
        lead: text(320, { required: true, label: 'Lead' }),
        primaryLabel: text(30, { required: true, label: 'Primary button' }),
        secondaryLabel: text(30, { label: 'Secondary button' }),
        secondaryHref: link('Secondary link'),
        mosaic: z.object({
            left: imageSchema,
            centre: imageSchema,
            right: imageSchema,
        }),
        stats: list(z.object({
            value: text(20, { required: true, label: 'Value' }),
            label: text(40, { required: true, label: 'Label' }),
        }), { max: A.stats, label: 'figure' }),
    }),
    statement: z.object({ enabled: z.boolean() }),
    promise: z.object({
        enabled: z.boolean(),
        label: text(40, { required: true, label: 'Section label' }),
        statement: text(200, { required: true, label: 'Statement' }),
        photo: imageSchema,
        photoQuote: text(120, { label: 'Photo quote' }),
        pillars: list(text(40, { required: true, label: 'Promise' }), { max: A.pillars, label: 'promise' }),
        secondaryPhoto: imageSchema,
        secondaryText: text(200, { label: 'Supporting text' }),
        ctaLabel: text(30, { label: 'Button text' }),
        ctaHref: link('Button link'),
        timelineTitle: text(40, { label: 'Card title' }),
        timeline: list(z.object({
            label: text(30, { required: true, label: 'Label' }),
            value: text(20, { required: true, label: 'Value' }),
        }), { max: A.timeline, label: 'row' }),
    }),
    range: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(60, { required: true, label: 'Headline' }),
        searchPlaceholder: text(40, { label: 'Search placeholder' }),
        note: text(260, { label: 'Note' }),
    }),
    sourcing: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        indexLabel: text(40, { label: 'Index label' }),
        title: text(60, { required: true, label: 'First line' }),
        titleAccent: text(60, { label: 'Second line' }),
        lead: text(300, { label: 'Lead' }),
        image: imageSchema,
        photoEyebrow: text(40, { label: 'Photo eyebrow' }),
        photoTitle: text(60, { label: 'Photo title' }),
        steps: list(z.object({
            phase: text(30, { label: 'Phase' }),
            title: text(60, { required: true, label: 'Title' }),
            body: text(320, { required: true, label: 'Body' }),
            image: imageSchema,
        }), { max: A.steps, label: 'step' }),
    }),
    leadership: z.object({
        enabled: z.boolean(),
        label: text(40, { required: true, label: 'Section label' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        description: text(320, { label: 'Description' }),
        people: list(z.object({
            name: text(60, { required: true, label: 'Name' }),
            role: text(80, { label: 'Role' }),
            bio: text(1200, { label: 'Bio' }),
            quote: text(140, { label: 'Quote' }),
            photo: imageSchema,
        }), { max: A.people, label: 'person' }),
    }),
    testimonials: z.object({
        enabled: z.boolean(),
        label: text(40, { required: true, label: 'Section label' }),
        title: text(60, { required: true, label: 'Headline' }),
        image: imageSchema,
    }),
    work: z.object({
        enabled: z.boolean(),
        label: text(40, { required: true, label: 'Section label' }),
        title: text(60, { required: true, label: 'Headline' }),
        titleAccent: text(60, { label: 'Accent' }),
        description: text(320, { label: 'Description' }),
        tabs: list(z.object({
            label: text(24, { required: true, label: 'Tab label' }),
            title: text(60, { required: true, label: 'Title' }),
            body: text(320, { label: 'Body' }),
            ctaLabel: text(30, { required: true, label: 'Button text' }),
            ctaHref: link('Button link'),
            image: imageSchema,
        }), { max: A.tabs, label: 'tab' }),
    }),
    visit: z.object({
        enabled: z.boolean(),
        label: text(40, { required: true, label: 'Section label' }),
        statement: text(240, { required: true, label: 'Statement' }),
        ctaLabel: text(30, { required: true, label: 'Button text' }),
        note: text(160, { label: 'Note' }),
        photos: list(z.object({
            image: imageSchema,
            tag: text(30, { label: 'Tag' }),
            caption: text(80, { label: 'Caption' }),
        }), { max: A.photos, label: 'photo' }),
    }),
    related: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(40, { required: true, label: 'Headline' }),
        titleAccent: text(40, { label: 'Accent' }),
    }),
})

/* ── Registry ───────────────────────────────────────────────── */

export const PAGE_CONTENT = {
    [GIFT_PAGE_KEY]: {
        label: 'Gift boxes page',
        path: '/category/gift-boxes',
        schema: giftPageSchema,
        defaults: DEFAULT_GIFT_PAGE,
        merge: mergeGiftPage,
    },
    [ABOUT_PAGE_KEY]: {
        label: 'About us page',
        path: '/about-us',
        schema: aboutPageSchema,
        defaults: DEFAULT_ABOUT_PAGE,
        merge: mergeAboutPage,
    },
}

export const PAGE_CONTENT_KEYS = Object.keys(PAGE_CONTENT)

// "hero › image › alt: Describe the photo…" for the API's error message.
export const firstIssue = (error) => {
    const issue = error?.issues?.[0]
    return issue ? `${issue.path.join(' › ')}: ${issue.message}` : 'Invalid content.'
}
