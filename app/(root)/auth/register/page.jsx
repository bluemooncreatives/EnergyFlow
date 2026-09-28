'use client'
import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import axios from 'axios'
import Link from 'next/link'
import { LockKeyhole, Mail, User } from 'lucide-react'
import { zSchema } from '@/lib/zodSchema'
import { Form } from "@/components/ui/form"
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { showToast } from '@/lib/showToast'
import AuthShell from '@/components/Application/Auth/AuthShell'
import { AuthAction, AuthAlt, AuthField, AuthHeader, AuthStep, AuthSubmit, PasswordRules } from '@/components/Application/Auth/AuthParts'
import { SuccessSeal } from '@/components/Application/Website/newsletter/NewsletterParts'

const ART = {
    title: 'Pure nutrition,',
    accent: 'one account away.',
    lead: 'Build your Energyflow profile once for faster checkout, order visibility and recommendations made for your taste.',
    perks: ['Faster checkout', 'Order visibility from cart to door', 'Verified by email'],
}

const RegisterPage = () => {
    const [loading, setLoading] = useState(false)
    // Set after a successful sign-up: the address the verification link went to.
    const [registered, setRegistered] = useState(null)
    const formSchema = zSchema.pick({
        name: true, email: true, password: true
    }).extend({
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords don’t match.',
        path: ['confirmPassword']
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const handleRegisterSubmit = async (values) => {
        try {
            setLoading(true)
            const { data: registerResponse } = await axios.post('/api/auth/register', values)
            if (!registerResponse.success) {
                throw new Error(registerResponse.message)
            }

            form.reset()
            // The API still succeeds when the verification email fails to send;
            // its message then says so and signing in resends the link.
            setRegistered({ email: values.email, emailSent: !/could not send/i.test(registerResponse.message) })
            showToast('success', registerResponse.message)

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthShell art={ART}>
            {!registered ? (
                <AuthStep key="form">
                    <AuthHeader
                        eyebrow="New here"
                        title="Create your"
                        accent="account"
                        lead="Set up your Energyflow profile in under a minute."
                    />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegisterSubmit)} className="ef-auth-form" noValidate>
                            <AuthField
                                control={form.control}
                                name="name"
                                label="Full name"
                                icon={User}
                                placeholder="Your full name"
                                autoComplete="name"
                            />
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
                            <AuthField
                                control={form.control}
                                name="password"
                                label="Password"
                                type="password"
                                icon={LockKeyhole}
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                            >
                                <PasswordRules control={form.control} />
                            </AuthField>
                            <AuthField
                                control={form.control}
                                name="confirmPassword"
                                label="Confirm password"
                                type="password"
                                icon={LockKeyhole}
                                placeholder="Type it once more"
                                autoComplete="new-password"
                            />
                            <AuthSubmit loading={loading} loadingText="Creating account…">Create account</AuthSubmit>
                            <AuthAlt>
                                Already have an account? <Link href={WEBSITE_LOGIN} className="ef-auth-link">Sign in</Link>
                            </AuthAlt>
                        </form>
                    </Form>
                </AuthStep>
            ) : (
                <AuthStep key="done">
                    <div className="ef-auth-status" role="status">
                        <div data-auth-item><SuccessSeal size="3.75rem" /></div>
                        {registered.emailSent ? (
                            <AuthHeader
                                eyebrow="Account created"
                                title="Check your"
                                accent="inbox"
                                lead={<>We sent a verification link to <strong>{registered.email}</strong>. Open it to activate your account, then sign in.</>}
                            />
                        ) : (
                            <AuthHeader
                                eyebrow="Account created"
                                title="One more"
                                accent="step"
                                lead={<>We couldn&apos;t send the verification email to <strong>{registered.email}</strong> just now. Sign in and we&apos;ll send it again.</>}
                            />
                        )}
                    </div>
                    <AuthAction href={WEBSITE_LOGIN}>Go to sign in</AuthAction>
                    <AuthAlt>
                        Wrong address? <button type="button" className="ef-auth-link" onClick={() => setRegistered(null)}>Start again</button>
                    </AuthAlt>
                </AuthStep>
            )}
        </AuthShell>
    )
}

export default RegisterPage
