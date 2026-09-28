'use client'
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import axios from 'axios'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { zSchema } from '@/lib/zodSchema'
import { Form } from "@/components/ui/form"
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import UpdatePassword from '@/components/Application/UpdatePassword'
import AuthShell from '@/components/Application/Auth/AuthShell'
import { AuthAlt, AuthField, AuthHeader, AuthProgress, AuthStep, AuthSubmit } from '@/components/Application/Auth/AuthParts'

const ART = {
    title: 'Locked out?',
    accent: 'We’ve got you.',
    lead: 'We’ll email a one-time code so only you can set a new password.',
    perks: ['Code valid for 10 minutes', 'Sent to your account email', 'A new password in three steps'],
}
const STEPS = ['Email', 'Code', 'New password']

const ResetPassword = () => {
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [otpEmail, setOtpEmail] = useState()
    const [isOtpVerified, setIsOtpVerified] = useState(false)

    const form = useForm({
        resolver: zodResolver(zSchema.pick({ email: true })),
        defaultValues: { email: "" }
    })

    const handleEmailVerification = async (values) => {
        try {
            setEmailVerificationLoading(true)
            const { data: sendOtpResponse } = await axios.post('/api/auth/reset-password/send-otp', values)
            if (!sendOtpResponse.success) throw new Error(sendOtpResponse.message)
            setOtpEmail(values.email)
            showToast('success', sendOtpResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setEmailVerificationLoading(false)
        }
    }

    const handleOtpVerification = async (values) => {
        try {
            setOtpVerificationLoading(true)
            const { data: otpResponse } = await axios.post('/api/auth/reset-password/verify-otp', values)
            if (!otpResponse.success) throw new Error(otpResponse.message)
            showToast('success', otpResponse.message)
            setIsOtpVerified(true)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setOtpVerificationLoading(false)
        }
    }

    const step = !otpEmail ? 0 : !isOtpVerified ? 1 : 2
    const progress = <AuthProgress steps={STEPS} current={step} />

    return (
        <AuthShell art={ART}>
            {step === 0 && (
                <AuthStep key="email">
                    <AuthHeader
                        eyebrow="Password help"
                        title="Reset your"
                        accent="password"
                        lead="Enter the email on your account and we’ll send you a reset code."
                    >
                        {progress}
                    </AuthHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleEmailVerification)} className="ef-auth-form" noValidate>
                            <AuthField
                                control={form.control}
                                name="email"
                                label="Email"
                                type="email"
                                icon={Mail}
                                placeholder="you@example.com"
                                autoComplete="email"
                                inputMode="email"
                            />
                            <AuthSubmit loading={emailVerificationLoading} loadingText="Sending code…">Send code</AuthSubmit>
                            <AuthAlt>
                                Remembered it? <Link href={WEBSITE_LOGIN} className="ef-auth-link">Sign in</Link>
                            </AuthAlt>
                        </form>
                    </Form>
                </AuthStep>
            )}

            {step === 1 && (
                <AuthStep key="otp">
                    <OTPVerification
                        email={otpEmail}
                        onSubmit={handleOtpVerification}
                        loading={otpVerificationLoading}
                        onBack={() => setOtpEmail('')}
                    >
                        {progress}
                    </OTPVerification>
                </AuthStep>
            )}

            {step === 2 && (
                <AuthStep key="password">
                    <UpdatePassword email={otpEmail}>{progress}</UpdatePassword>
                </AuthStep>
            )}
        </AuthShell>
    )
}

export default ResetPassword
