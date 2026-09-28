'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { ArrowRight, Loader2, MailCheck, X } from 'lucide-react'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import AuthShell from '@/components/Application/Auth/AuthShell'
import { AuthHeader, AuthStep } from '@/components/Application/Auth/AuthParts'
import { SuccessSeal } from '@/components/Application/Website/newsletter/NewsletterParts'

const ART = {
    title: 'Almost',
    accent: 'there.',
    lead: 'One click on the link we emailed confirms the address is yours.',
    perks: ['Keeps your account yours', 'Order updates reach the right inbox'],
}
const SEAL = { ring: 'Verify email ✦ Welcome aboard ✦ ', icon: MailCheck }

const STATES = {
    loading: {
        eyebrow: 'One moment',
        title: 'Verifying your',
        accent: 'email',
        lead: 'Checking your link. This only takes a second.',
    },
    success: {
        eyebrow: 'All set',
        title: 'Email',
        accent: 'verified',
        lead: 'Your account is active. Sign in to start shopping.',
    },
    error: {
        eyebrow: 'Link problem',
        title: 'Link',
        accent: 'expired',
        lead: 'This link has expired or was already used. Sign in and we’ll email you a fresh one.',
    },
}

const StatusIcon = ({ status }) => {
    if (status === 'success') return <SuccessSeal size="3.75rem" />
    if (status === 'error') {
        return (
            <span className="ef-seal ef-auth-status__icon ef-auth-status__icon--error" style={{ width: '3.75rem', height: '3.75rem' }}>
                <X strokeWidth={3} aria-hidden="true" />
            </span>
        )
    }
    return (
        <span className="ef-seal ef-seal--sun ef-auth-status__icon" style={{ width: '3.75rem', height: '3.75rem' }}>
            <Loader2 strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
        </span>
    )
}

const EmailVerification = () => {
    const { token } = useParams()
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let isActive = true
        const verify = async () => {
            try {
                const { data: verificationResponse } = await axios.post('/api/auth/verify-email', { token })
                if (isActive) setStatus(verificationResponse?.success ? 'success' : 'error')
            } catch {
                if (isActive) setStatus('error')
            }
        }

        if (token) verify()
        else setStatus('error')

        return () => {
            isActive = false
        }
    }, [token])

    const copy = STATES[status]

    return (
        <AuthShell art={ART} seal={SEAL}>
            <AuthStep key={status}>
                <div className="ef-auth-status" role="status" aria-live="polite">
                    <div data-auth-item><StatusIcon status={status} /></div>
                    <AuthHeader {...copy} />
                </div>
                {status !== 'loading' && (
                    <Link href={WEBSITE_LOGIN} className="ef-nl-submit" data-auth-item>
                        <span>{status === 'success' ? 'Sign in' : 'Go to sign in'}</span>
                        <ArrowRight aria-hidden="true" />
                    </Link>
                )}
            </AuthStep>
        </AuthShell>
    )
}

export default EmailVerification
