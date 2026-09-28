'use client'
import { Suspense, useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import axios from 'axios'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { signIn } from 'next-auth/react'
import { LockKeyhole, Mail } from 'lucide-react'
import { zSchema } from '@/lib/zodSchema'
import { Form } from "@/components/ui/form"
import { USER_DASHBOARD, WEBSITE_REGISTER, WEBSITE_RESETPASSWORD } from '@/routes/WebsiteRoute'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { showToast } from '@/lib/showToast'
import { login } from '@/store/reducer/authReducer'
import OTPVerification from '@/components/Application/OTPVerification'
import AuthShell from '@/components/Application/Auth/AuthShell'
import { AuthAlt, AuthDivider, AuthField, AuthHeader, AuthStep, AuthSubmit, GoogleButton } from '@/components/Application/Auth/AuthParts'

const ART = {
    title: 'Good food,',
    accent: 'remembered.',
    lead: 'Sign in to review orders, manage your profile and keep everything with Energyflow in one place.',
    perks: ['Sign-ins confirmed by one-time code', 'Every order in one place', 'Faster checkout'],
}

const LoginPage = () => {
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [otpEmail, setOtpEmail] = useState()
    const formSchema = zSchema.pick({
        email: true
    }).extend({
        password: z.string().min(3, 'Password field is required.')
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const handleLoginSubmit = async (values) => {
        try {
            setLoading(true)
            const { data: loginResponse } = await axios.post('/api/auth/login', values)
            if (!loginResponse.success) {
                throw new Error(loginResponse.message)
            }

            setOtpEmail(values.email)
            // Keep the email so "Use a different email" comes back pre-filled.
            form.reset({ email: values.email, password: '' })
            showToast('success', loginResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleOtpVerification = async (values) => {
        try {
            setOtpVerificationLoading(true)
            const { data: otpResponse } = await axios.post('/api/auth/verify-otp', values)
            if (!otpResponse.success) {
                throw new Error(otpResponse.message)
            }
            setOtpEmail('')
            showToast('success', otpResponse.message)

            dispatch(login(otpResponse.data))

            if (searchParams.has('callback')) {
                router.push(searchParams.get('callback'))
            } else {
                otpResponse.data.role === 'admin' ? router.push(ADMIN_DASHBOARD) : router.push(USER_DASHBOARD)
            }

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setOtpVerificationLoading(false)
        }
    }

    return (
        <AuthShell art={ART}>
            {!otpEmail ? (
                <AuthStep key="credentials">
                    <AuthHeader
                        eyebrow="Welcome back"
                        title="Sign"
                        accent="in"
                        lead="Use your email and password, then confirm with a code we email you."
                    />
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="ef-auth-form" noValidate>
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
                                placeholder="Your password"
                                autoComplete="current-password"
                                action={<Link href={WEBSITE_RESETPASSWORD} className="ef-auth-link text-[0.8125rem]">Forgot password?</Link>}
                            />
                            <AuthSubmit loading={loading} loadingText="Signing in…">Continue</AuthSubmit>
                            <AuthDivider />
                            <GoogleButton onClick={() => signIn('google', { callbackUrl: searchParams.get('callback') || USER_DASHBOARD })} />
                            <AuthAlt>
                                New to Energyflow? <Link href={WEBSITE_REGISTER} className="ef-auth-link">Create an account</Link>
                            </AuthAlt>
                        </form>
                    </Form>
                </AuthStep>
            ) : (
                <AuthStep key="otp">
                    <OTPVerification
                        email={otpEmail}
                        onSubmit={handleOtpVerification}
                        loading={otpVerificationLoading}
                        onBack={() => setOtpEmail('')}
                    />
                </AuthStep>
            )}
        </AuthShell>
    )
}

const Login = () => {
    return (
        <Suspense fallback={null}>
            <LoginPage />
        </Suspense>
    )
}

export default Login
