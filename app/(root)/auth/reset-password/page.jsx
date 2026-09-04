'use client'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
import Logo from '@/public/assets/images/hero/logo.png'
import Image from 'next/image'
import { zodResolver } from "@hookform/resolvers/zod"
import { zSchema } from '@/lib/zodSchema'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import ButtonLoading from '@/components/Application/ButtonLoading'
import Link from 'next/link'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import UpdatePassword from '@/components/Application/UpdatePassword'

const ResetPassword = () => {
    const [emailVerificationLoading, setEmailVerificationLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [otpEmail, setOtpEmail] = useState()
    const [isOtpVerified, setIsOtpVerified] = useState(false)
    const formSchema = zSchema.pick({ email: true })

    const form = useForm({
        resolver: zodResolver(formSchema),
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

    return (
        <Card className="w-full max-w-5xl overflow-hidden border-0 bg-transparent py-0 shadow-none ring-0 gap-0">
            <CardContent className="relative flex overflow-hidden rounded-[var(--admin-shell-radius)] bg-card p-0 shadow-xl md:flex-row">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-black/60" />

                {/* Left panel */}
                <div className="relative hidden overflow-hidden bg-[var(--brand-primary)] p-8 text-sidebar-foreground md:block md:w-1/2 md:p-12">
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[64%]"
                        style={{ backgroundImage: "var(--auth-panel-gradient)" }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[56%] bg-[linear-gradient(0deg,rgba(255,255,255,0.18),transparent_74%)] blur-2xl" />
                    <div className="relative z-20 flex h-full flex-col justify-between">
                        <div className='mb-8'>
                            <Image src={Logo.src} width={Logo.width} height={Logo.height} alt='logo' className='max-w-[60px]' unoptimized />
                            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/70">
                                Enter your email and we&apos;ll send you a one-time code to securely reset your password.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="font-header text-5xl leading-none text-white">Reset Password</p>
                            <p className="max-w-sm text-[15px] leading-relaxed text-white/70">Your account security is our priority.</p>
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <div className="relative z-20 bg-card p-8 text-card-foreground md:w-1/2 md:p-12">
                    {!otpEmail ? (
                        <>
                            <div className='mb-8 flex flex-col items-start'>
                                <h1 className='font-header text-5xl text-foreground'>Forgot Password?</h1>
                                <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>Enter your email address and we&apos;ll send you a reset code.</p>
                            </div>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleEmailVerification)} className='space-y-5'>
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm text-foreground">Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="example@gmail.com" className="form-field" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className='pt-1'>
                                        <ButtonLoading loading={emailVerificationLoading} type="submit" text="Send OTP" variant="brand" className="h-9 w-full rounded-sm text-base font-semibold uppercase cursor-pointer" />
                                    </div>
                                    <div className='text-center text-sm'>
                                        <div className='flex justify-center items-center gap-1'>
                                            <p className='text-muted-foreground'>Remember your password?</p>
                                            <Link href={WEBSITE_LOGIN} className='font-semibold text-foreground underline underline-offset-4'>Sign in</Link>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </>
                    ) : (
                        <>
                            {!isOtpVerified
                                ? <OTPVerification email={otpEmail} onSubmit={handleOtpVerification} loading={otpVerificationLoading} />
                                : <UpdatePassword email={otpEmail} />
                            }
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default ResetPassword
