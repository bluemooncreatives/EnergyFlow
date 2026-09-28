'use client'

import { useState } from 'react'
import axios from 'axios'
import { Loader2, MailX, Mail } from 'lucide-react'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Confirm-first unsubscribe: email link scanners prefetch URLs, so the
// change only happens when a person presses the button.
const UnsubscribeClient = ({ token }) => {
    const [state, setState] = useState('confirm') // confirm | unsubscribed | resubscribed | error
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const send = async (resubscribe) => {
        setLoading(true)
        try {
            const { data } = await axios.post('/api/newsletter/unsubscribe', { token, resubscribe })
            if (!data.success) throw new Error(data.message)
            setMessage(data.message)
            setState(resubscribe ? 'resubscribed' : 'unsubscribed')
        } catch (error) {
            setMessage(error.message || 'Something went wrong. Please try again.')
            setState('error')
        } finally {
            setLoading(false)
        }
    }

    const invalid = !/^[a-f0-9]{48}$/.test(token)

    return (
        <section className="ef-section ef-section--page flex min-h-[80svh] items-center pt-32">
            <div className="ef-container">
                <div className="ef-card mx-auto flex max-w-lg flex-col items-center gap-5 p-8 text-center sm:p-12" style={{ borderRadius: 'var(--radius-tile)' }}>
                    <span className={`ef-seal ${state === 'unsubscribed' || invalid || state === 'error' ? 'ef-seal--pine' : 'ef-seal--sun'}`}>
                        {state === 'unsubscribed' || invalid || state === 'error' ? <MailX strokeWidth={1.75} /> : <Mail strokeWidth={1.75} />}
                    </span>

                    {invalid ? (
                        <>
                            <h1 className="ef-title ef-title--md">Link not valid</h1>
                            <p className="ef-lead">This unsubscribe link is incomplete or has expired. Use the link from your latest Energyflow email, or contact us and we&apos;ll remove you.</p>
                            <StoreButton href="/contact" variant="outline">Contact us</StoreButton>
                        </>
                    ) : state === 'confirm' ? (
                        <>
                            <h1 className="ef-title ef-title--md">Leaving so <span className="ef-title__accent">soon?</span></h1>
                            <p className="ef-lead">You&apos;ll stop getting new-harvest alerts and members-only deals. You can re-join any time.</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <StoreButton onClick={() => send(false)} disabled={loading} variant="primary">
                                    {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                                    Unsubscribe me
                                </StoreButton>
                                <StoreButton href={WEBSITE_SHOP} variant="outline">Keep me subscribed</StoreButton>
                            </div>
                        </>
                    ) : state === 'unsubscribed' ? (
                        <>
                            <h1 className="ef-title ef-title--md">You&apos;re unsubscribed</h1>
                            <p className="ef-lead" role="status">{message} Sorry to see you go — changed your mind?</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <StoreButton onClick={() => send(true)} disabled={loading} variant="accent">
                                    {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
                                    Re-subscribe
                                </StoreButton>
                                <StoreButton href={WEBSITE_SHOP} variant="outline" arrow>Continue shopping</StoreButton>
                            </div>
                        </>
                    ) : state === 'resubscribed' ? (
                        <>
                            <h1 className="ef-title ef-title--md">Welcome <span className="ef-title__accent">back!</span></h1>
                            <p className="ef-lead" role="status">{message}</p>
                            <StoreButton href={WEBSITE_SHOP} variant="primary" arrow>Continue shopping</StoreButton>
                        </>
                    ) : (
                        <>
                            <h1 className="ef-title ef-title--md">Something went wrong</h1>
                            <p className="ef-lead" role="alert">{message}</p>
                            <StoreButton onClick={() => setState('confirm')} variant="outline">Try again</StoreButton>
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default UnsubscribeClient
