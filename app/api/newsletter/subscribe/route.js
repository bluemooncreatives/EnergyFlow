import crypto from 'node:crypto'
import { newsletterWelcome } from '@/email/newsletterWelcome'
import { newsletterNotification } from '@/email/newsletterNotification'
import { siteUrl } from '@/email/_shared'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import { NEWSLETTER_EMAIL_REGEX, NEWSLETTER_SOURCES } from '@/lib/newsletterConfig'
import { findActiveCoupon, loadNewsletterSettings } from '@/lib/services/newsletterService'
import { sendMail } from '@/lib/sendMail'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

// Best-effort per-IP throttle: 6 attempts per 10 minutes. In-memory, so it
// resets on a cold start and is per-instance on serverless — enough to blunt
// a scripted flood from one client, not a substitute for an edge WAF.
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 6
const attempts = new Map()

const isThrottled = (ip) => {
    const now = Date.now()
    const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS)
    recent.push(now)
    attempts.set(ip, recent)
    if (attempts.size > 5000) {
        for (const [key, list] of attempts) {
            if (!list.some((t) => now - t < WINDOW_MS)) attempts.delete(key)
        }
    }
    return recent.length > MAX_ATTEMPTS
}

const clientIp = (request) =>
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

const newToken = () => crypto.randomBytes(24).toString('hex')

// Public: join the newsletter from the popup, homepage band or footer.
// Body: { email, name?, source, pagePath?, company? (honeypot) }
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))

        // Honeypot: a hidden field real visitors never fill. Pretend success so
        // bots don't learn to skip it.
        if (body?.company) {
            return response(true, 200, "You're subscribed!", { couponCode: null, alreadySubscribed: false })
        }

        if (isThrottled(clientIp(request))) {
            return response(false, 429, 'Too many attempts. Please try again in a few minutes.')
        }

        const email = String(body?.email || '').trim().toLowerCase()
        if (!email || email.length > 254 || !NEWSLETTER_EMAIL_REGEX.test(email)) {
            return response(false, 400, 'Please enter a valid email address.')
        }

        const name = String(body?.name || '').trim().slice(0, 80)
        const source = NEWSLETTER_SOURCES.includes(body?.source) ? body.source : 'popup'
        const pagePath = String(body?.pagePath || '').split(/[?#]/)[0].slice(0, 300)

        await connectDB()

        const { settings } = await loadNewsletterSettings()
        const { offer } = settings.popup

        // Only hand out a code that is still redeemable.
        const coupon = offer.enabled ? await findActiveCoupon(offer.couponCode) : null

        const existing = await NewsletterSubscriberModel.findOne({ email }).select('+unsubscribeToken')

        if (existing && existing.status === 'subscribed' && !existing.deletedAt) {
            // Already on the list: nothing to write, no duplicate welcome mail.
            // Still return the code so a returning subscriber can grab it again.
            return response(true, 200, "You're already on the list — welcome back!", {
                couponCode: coupon?.code || null,
                alreadySubscribed: true,
            })
        }

        let subscriber
        if (existing) {
            // Re-subscribe (after an unsubscribe or an admin trash).
            existing.status = 'subscribed'
            existing.deletedAt = null
            existing.unsubscribedAt = null
            existing.subscribedAt = new Date()
            existing.source = source
            existing.pagePath = pagePath
            if (name) existing.name = name
            if (coupon) existing.couponCode = coupon.code
            if (!existing.unsubscribeToken) existing.unsubscribeToken = newToken()
            subscriber = await existing.save()
        } else {
            try {
                subscriber = await NewsletterSubscriberModel.create({
                    email,
                    name,
                    source,
                    pagePath,
                    couponCode: coupon?.code || '',
                    unsubscribeToken: newToken(),
                })
            } catch (err) {
                // Two tabs submitting at once: the unique index wins the race.
                if (err?.code === 11000) {
                    return response(true, 200, "You're already on the list — welcome back!", {
                        couponCode: coupon?.code || null,
                        alreadySubscribed: true,
                    })
                }
                throw err
            }
        }

        // Emails are best-effort: the subscription is already saved and
        // sendMail never throws.
        const unsubscribeUrl = `${siteUrl()}/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`
        const mails = []
        if (settings.emails.welcomeEnabled) {
            mails.push(
                sendMail(
                    settings.emails.welcomeSubject,
                    email,
                    newsletterWelcome({ name, coupon, unsubscribeUrl }),
                    {
                        headers: {
                            'List-Unsubscribe': `<${unsubscribeUrl}>`,
                        },
                    }
                )
            )
        }
        if (settings.emails.notifyAdmin && process.env.NODEMAILER_EMAIL) {
            mails.push(
                sendMail(
                    `New newsletter subscriber — ${email}`,
                    process.env.NODEMAILER_EMAIL,
                    newsletterNotification({ email, name, source, pagePath })
                )
            )
        }
        await Promise.allSettled(mails)

        return response(true, 200, "You're subscribed!", {
            couponCode: coupon?.code || null,
            alreadySubscribed: false,
        })
    } catch (error) {
        return catchError(error, 'Could not subscribe right now. Please try again.')
    }
}
