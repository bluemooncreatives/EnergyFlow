'use client'

import { useEffect, useState } from 'react'
import { zSchema } from '@/lib/zodSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp'
import { showToast } from '@/lib/showToast'
import { AuthAlt, AuthHeader, AuthMessage, AuthSubmit } from './Auth/AuthParts'

const RESEND_COOLDOWN = 30

/**
 * The 6-digit code step shared by sign in and password reset. Submits by
 * itself once the sixth digit lands; "Resend" is rate-limited client-side so
 * an impatient double tap doesn't send a burst of emails. `onBack` (optional)
 * returns to the previous screen to fix a mistyped email.
 */
const OTPVerification = ({ email, onSubmit, loading, onBack, children }) => {
    const [isResendingOtp, setIsResendingOtp] = useState(false)
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    const form = useForm({
        resolver: zodResolver(zSchema.pick({ otp: true, email: true })),
        defaultValues: { otp: '', email },
    })

    const submit = form.handleSubmit((values) => {
        if (!loading) onSubmit(values)
    })

    const resendOTP = async () => {
        try {
            setIsResendingOtp(true)
            const { data: resendOtpResponse } = await axios.post('/api/auth/resend-otp', { email })
            if (!resendOtpResponse.success) {
                throw new Error(resendOtpResponse.message)
            }
            form.resetField('otp')
            setCooldown(RESEND_COOLDOWN)
            showToast('success', resendOtpResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setIsResendingOtp(false)
        }
    }

    return (
        <>
            <AuthHeader
                eyebrow="Check your inbox"
                title="Enter your"
                accent="code"
                lead={<>We sent a 6-digit code to <strong>{email}</strong>. It&apos;s valid for 10 minutes.</>}
            >
                {children}
            </AuthHeader>

            <Form {...form}>
                <form onSubmit={submit} className="ef-auth-form" noValidate>
                    <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem data-auth-item className="gap-2.5">
                                <FormLabel className="ef-auth-label">One-time code</FormLabel>
                                <FormControl>
                                    <InputOTP
                                        maxLength={6}
                                        inputMode="numeric"
                                        pattern="^[0-9]*$"
                                        autoComplete="one-time-code"
                                        autoFocus
                                        onComplete={() => submit()}
                                        {...field}
                                    >
                                        <InputOTPGroup className="ef-auth-otp">
                                            {Array.from({ length: 6 }, (_, i) => (
                                                <InputOTPSlot key={i} index={i} />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </FormControl>
                                <AuthMessage />
                            </FormItem>
                        )}
                    />

                    <AuthSubmit loading={loading} loadingText="Verifying…">Verify &amp; continue</AuthSubmit>

                    <AuthAlt>
                        Didn&apos;t get it?{' '}
                        {cooldown > 0 ? (
                            <span aria-live="polite">Resend in {cooldown}s</span>
                        ) : (
                            <button type="button" className="ef-auth-link" onClick={resendOTP} disabled={isResendingOtp}>
                                {isResendingOtp ? 'Sending…' : 'Resend code'}
                            </button>
                        )}
                        {onBack && (
                            <>
                                <span aria-hidden="true"> · </span>
                                <button type="button" className="ef-auth-link" onClick={onBack}>Use a different email</button>
                            </>
                        )}
                    </AuthAlt>
                </form>
            </Form>
        </>
    )
}

export default OTPVerification
