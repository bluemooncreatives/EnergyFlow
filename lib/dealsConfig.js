import { z } from 'zod'
import { COUNTDOWN_MODES, isValidDate } from './dealsShared'

/* ================================================================
   DEALS OF THE MONTH — shared settings shape
   Imported by the admin form (client), the settings API (server) and
   the storefront service, so defaults and validation live in one place.
   The storefront rail imports dealsShared.js directly to stay zod-free.
   ================================================================ */

export {
    DEAL_SLOTS,
    DEFAULT_DEAL_BANNER_IMAGE,
    COUNTDOWN_MODES,
    DEFAULT_DEAL_SETTINGS,
    mergeDealSettings,
    dealDeadline,
    dealHasEnded,
} from './dealsShared'

/* ── Validation ─────────────────────────────────────────────── */

const text = (max, { required = false, label = 'This field' } = {}) => {
    const base = z.string().trim().max(max, `${label} must be at most ${max} characters.`)
    return required ? base.min(1, `${label} is required.`) : base
}

export const dealSettingsSchema = z.object({
    section: z.object({
        enabled: z.boolean(),
        eyebrow: text(40, { label: 'Eyebrow' }),
        title: text(40, { required: true, label: 'Headline' }),
        titleAccent: text(40, { label: 'Accent' }),
        description: text(200, { label: 'Description' }),
    }),
    countdown: z.object({
        mode: z.enum(COUNTDOWN_MODES),
        endsAt: z.string().trim().max(40),
        label: text(30, { label: 'Timer label' }),
    }).superRefine((countdown, ctx) => {
        if (countdown.mode !== 'custom') return
        if (!isValidDate(countdown.endsAt)) {
            ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'Choose when the deal ends.' })
        } else if (Date.parse(countdown.endsAt) <= Date.now()) {
            ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end date must be in the future.' })
        }
    }),
    banner: z.object({
        title: text(60, { required: true, label: 'Banner title' }),
        copy: text(140, { label: 'Banner copy' }),
        image: z.object({
            url: z.string().trim().max(500).refine(
                (v) => v === '' || /^https:\/\/res\.cloudinary\.com\//.test(v) || v.startsWith('/'),
                'Pick the image from the media library.'
            ),
            alt: text(140, { label: 'Alt text' }),
        }),
        buttonText: text(24, { required: true, label: 'Button text' }),
        link: z.string().trim().max(300).refine(
            (v) => /^\/(?!\/)/.test(v) || /^https:\/\//.test(v),
            'Use a storefront path like /shop or a full https:// link.'
        ),
    }).superRefine((banner, ctx) => {
        // A custom photo needs its own description; the default photo has one.
        if (banner.image.url && !banner.image.alt) {
            ctx.addIssue({ code: 'custom', path: ['image', 'alt'], message: 'Describe the photo for screen readers.' })
        }
    }),
})
