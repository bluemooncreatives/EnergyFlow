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
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import axios from 'axios'
import { showToast } from '@/lib/showToast'
const RegisterPage = () => {
    const [loading, setLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
    const formSchema = zSchema.pick({
        name: true, email: true, password: true
    }).extend({
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Password and confirm password must be same.',
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
            showToast('success', registerResponse.message)

        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
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
                            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/70">
                                Build your Energyflow identity once and unlock faster checkout, order visibility, and curated recommendations made for your taste.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="font-header text-5xl leading-none text-white">Get Started</p>
                            <p className="max-w-sm text-[15px] leading-relaxed text-white/70">Welcome to Energyflow — let&apos;s get started.</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 bg-card p-8 text-card-foreground md:w-1/2 md:p-12">
                    <div className='mb-8 flex flex-col items-start'>
                        <h1 className='font-header text-5xl text-foreground'>Create Account</h1>
                        <p className='mt-2 text-[15px] leading-relaxed text-muted-foreground'>Enter your details below to set up your Energyflow profile.</p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleRegisterSubmit)} className='space-y-5'>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm text-foreground">Full Name</FormLabel>
                                            <FormControl>
                                                <Input type="text" placeholder="Your Full Name" className="form-field" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
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
                                                <Input type="password" placeholder="***********" className="form-field" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem className="relative">
                                            <FormLabel className="text-sm text-foreground">Confirm Password</FormLabel>
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
                                <ButtonLoading loading={loading} type="submit" text="Create Account" variant="brand" className="h-9 w-full rounded-sm text-base font-semibold uppercase cursor-pointer" />
                            </div>

                            <div className='text-center text-sm'>
                                <div className='flex justify-center items-center gap-1'>
                                    <p className='text-muted-foreground'>Already have account?</p>
                                    <Link href={WEBSITE_LOGIN} className='font-semibold text-foreground underline underline-offset-4'>Login</Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    )
}

export default RegisterPage