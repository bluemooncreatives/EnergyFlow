'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Suspense, useState } from 'react'
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
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { FcGoogle } from "react-icons/fc"
import Link from 'next/link'
import { USER_DASHBOARD, WEBSITE_REGISTER, WEBSITE_RESETPASSWORD } from '@/routes/WebsiteRoute'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
import OTPVerification from '@/components/Application/OTPVerification'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { useRouter, useSearchParams } from 'next/navigation'
import { ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
const LoginPage = () => {
    const dispatch = useDispatch()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [otpVerificationLoading, setOtpVerificationLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
    const [otpEmail, setOtpEmail] = useState()
    const formSchema = zSchema.pick({
        email: true
    }).extend({
        password: z.string().min('3', 'Password field is required.')
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
            form.reset()
            showToast('success', loginResponse.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }


    // otp verification  
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
        <Card className="w-full max-w-5xl overflow-hidden border-0 bg-transparent py-0 shadow-none ring-0 gap-0">
            <CardContent className="relative flex overflow-hidden rounded-[var(--admin-shell-radius)] bg-card p-0 shadow-xl md:flex-row">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-black/60" />
                <div className="pointer-events-none absolute left-0 top-0 z-10 hidden overflow-hidden backdrop-blur-2xl md:flex">
                </div>
                <div className="relative hidden overflow-hidden bg-[var(--brand-primary)] p-8 text-sidebar-foreground md:block md:w-1/2 md:p-12">
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[64%]"
                        style={{ backgroundImage: "var(--auth-panel-gradient)" }}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[56%] bg-[linear-gradient(0deg,rgba(255,255,255,0.18),transparent_74%)] blur-2xl" />
                    <div className="relative z-20 flex h-full flex-col justify-between">
                        <div className='mb-8'>
                            <Image src={Logo.src} width={Logo.width} height={Logo.height} alt='logo' className='max-w-[76px]' unoptimized />
                            <p className="mt-6 max-w-sm text-sm text-white/75">
                                Sign in to review orders, manage your profile, and keep every interaction with Energyflow connected in one place.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="font-header text-5xl leading-none text-white">Welcome Back</p>
                            <p className="max-w-sm text-[15px] leading-relaxed text-white/70">Secure login with OTP verification keeps your account protected.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 bg-card p-8 text-card-foreground md:w-1/2 md:p-12">
                    {!otpEmail ? (
                        <>
                            <div className='mb-8 flex flex-col items-start'>
                                <h1 className='font-header text-5xl text-foreground'>Sign In</h1>
                                <p className='mt-2 text-left text-[15px] leading-relaxed text-muted-foreground'>Login into your account by filling out the form below.</p>
                            </div>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleLoginSubmit)} className='space-y-5'>
                                    <div>
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
                                    </div>
                                    <div>
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem className="relative">
                                                    <FormLabel className="text-sm text-foreground">Password</FormLabel>
                                                    <FormControl>
                                                        <Input type={isTypePassword ? 'password' : 'text'} placeholder="***********" className="form-field !pr-10" {...field} />
                                                    </FormControl>
                                                    <button className='absolute right-3 top-[32px] cursor-pointer text-muted-foreground hover:text-foreground' type='button' onClick={() => setIsTypePassword(!isTypePassword)}>
                                                        {isTypePassword ? (
                                                            <EyeOff className='size-4' />
                                                        ) : (
                                                            <Eye className='size-4' />
                                                        )}
                                                    </button>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className='pt-1'>
                                        <ButtonLoading loading={loading} type="submit" text="Login" variant="brand" className="h-9 w-full rounded-sm text-base font-semibold uppercase cursor-pointer" />
                                    </div>

                                    <div className="relative my-1">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 w-full rounded-lg"
                                        onClick={() => signIn('google', { callbackUrl: searchParams.get('callback') || USER_DASHBOARD })}
                                    >
                                        <FcGoogle className="mr-2 h-5 w-5" />
                                        Login with Google
                                    </Button>

                                    <div className='space-y-3 text-center text-sm'>
                                        <div className='flex justify-center items-center gap-1'>
                                            <p className='text-muted-foreground'>Don&apos;t have account?</p>
                                            <Link href={WEBSITE_REGISTER} className='font-semibold text-foreground underline underline-offset-4'>Create account</Link>
                                        </div>
                                        <div>
                                            <Link href={WEBSITE_RESETPASSWORD} className='font-semibold text-foreground underline underline-offset-4'>Forgot password?</Link>
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </>
                    ) : (
                        <OTPVerification email={otpEmail} onSubmit={handleOtpVerification} loading={otpVerificationLoading} />
                    )}
                </div>
            </CardContent>
        </Card>
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
