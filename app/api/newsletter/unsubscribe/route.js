import { connectDB } from '@/lib/databaseConnection'
import { catchError, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

const isValidToken = (token) => typeof token === 'string' && /^[a-f0-9]{48}$/.test(token)

// Public: one-click unsubscribe from the link in newsletter emails. The page
// at /newsletter/unsubscribe asks the visitor to confirm first, so link
// scanners that prefetch URLs never unsubscribe anyone by accident.
// Body: { token, resubscribe? }
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}))
        const { token } = body || {}
        if (!isValidToken(token)) {
            return response(false, 400, 'This unsubscribe link is invalid or has expired.')
        }

        await connectDB()

        const resubscribe = body.resubscribe === true
        const subscriber = await NewsletterSubscriberModel.findOneAndUpdate(
            { unsubscribeToken: token },
            {
                $set: resubscribe
                    ? { status: 'subscribed', unsubscribedAt: null, deletedAt: null }
                    : { status: 'unsubscribed', unsubscribedAt: new Date() },
            },
            { new: true }
        ).lean()

        if (!subscriber) {
            return response(false, 404, 'This unsubscribe link is invalid or has expired.')
        }

        return response(
            true,
            200,
            resubscribe ? "Welcome back — you're subscribed again." : "You've been unsubscribed.",
            { email: subscriber.email, status: subscriber.status }
        )
    } catch (error) {
        return catchError(error, 'Could not update your subscription. Please try again.')
    }
}
