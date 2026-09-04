'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import axios from 'axios'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

const EmailVerification = ({ params }) => {
    const { token } = params
    const [status, setStatus] = useState('loading')

    useEffect(() => {
        let isActive = true
        const verify = async () => {
            try {
                setStatus('loading')
                const { data: verificationResponse } = await axios.post('/api/auth/verify-email', { token })
                if (isActive) {
                    setStatus(verificationResponse?.success ? 'success' : 'error')
                }
            } catch (error) {
                if (isActive) {
                    setStatus('error')
                }
            }
        }

        if (token) {
            verify()
        }

        return () => {
            isActive = false
        }
    }, [token])

    const ui = useMemo(() => {
        if (status === 'success') {
            return {
                icon: <CheckCircle2 className="size-6 text-emerald-600 animate-[pulse_2.4s_ease-in-out_infinite]" />,
                tone: 'text-emerald-600 ring-emerald-500/20 bg-emerald-500/10',
                title: 'Email verified successfully',
                description: 'You can now sign in to your account.',
                cta: { label: 'Go to Login', href: WEBSITE_LOGIN },
                showButton: true,
            }
        }

        if (status === 'error') {
            return {
                icon: <XCircle className="size-6 text-destructive animate-[pulse_2.6s_ease-in-out_infinite]" />,
                tone: 'text-destructive ring-destructive/20 bg-destructive/10',
                title: 'Verification failed',
                description: 'The link may be expired or already used. Sign in to request a new one.',
                cta: { label: 'Go to Login', href: WEBSITE_LOGIN },
                showButton: true,
            }
        }

        return {
            icon: <Loader2 className="size-6 animate-spin text-muted-foreground" />,
            tone: 'text-muted-foreground ring-foreground/10 bg-muted',
            title: 'Verifying your email',
            description: 'Please wait while we validate your link.',
            cta: { label: 'Go to Login', href: WEBSITE_LOGIN },
            showButton: false,
        }
    }, [status])

    return (
        <Card className="w-full max-w-md overflow-hidden border bg-card py-0 shadow-md">
            <CardContent className="flex flex-col items-center gap-4 px-8 py-7 text-center">
                <div className={`relative flex size-12 items-center justify-center rounded-full ring-1 ${ui.tone}`}>
                    <span className={`absolute inset-0 rounded-full ${status === 'loading' ? 'animate-pulse bg-muted/60' : 'bg-current/10'}`} />
                    <span className="relative z-10">{ui.icon}</span>
                </div>
                <div className="space-y-1">
                    <h1 className="font-header text-2xl text-foreground">{ui.title}</h1>
                    <p className="text-[15px] leading-relaxed text-muted-foreground">{ui.description}</p>
                </div>
                {ui.showButton && (
                    <Button asChild size="lg" className="mt-2 w-full">
                        <Link href={ui.cta.href}>{ui.cta.label}</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

export default EmailVerification
