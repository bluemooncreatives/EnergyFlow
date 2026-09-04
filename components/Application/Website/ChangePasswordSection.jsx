'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { zSchema } from '@/lib/zodSchema'
import { showToast } from '@/lib/showToast'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Eye, EyeOff, Lock } from 'lucide-react'

/**
 * Lets a signed-in user set (Google accounts that never had one) or change their
 * password. `hasPassword` toggles between "Set a Password" and "Change Password".
 */
const ChangePasswordSection = ({ hasPassword = false, onPasswordSet }) => {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const formSchema = z.object({
        currentPassword: z.string().optional(),
        password: zSchema.shape.password,
        confirmPassword: z.string(),
    })
        .refine((data) => data.password === data.confirmPassword, {
            message: 'New password and confirm password must be the same.',
            path: ['confirmPassword'],
        })
        // Current password is only required when the account already has one.
        .refine((data) => !hasPassword || (data.currentPassword && data.currentPassword.length > 0), {
            message: 'Please enter your current password.',
            path: ['currentPassword'],
        })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            currentPassword: '',
            password: '',
            confirmPassword: '',
        },
    })

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: res } = await axios.put('/api/profile/change-password', {
                currentPassword: values.currentPassword || undefined,
                password: values.password,
                confirmPassword: values.confirmPassword,
            })
            if (!res.success) {
                throw new Error(res.message)
            }
            showToast('success', res.message)
            form.reset()
            onPasswordSet?.()
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background">
            <div className="flex items-center gap-2 border-b border-[var(--dark-red)]/20 px-5 py-4">
                <Lock className="size-4 text-[var(--brand-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--brand-primary)]">
                    {hasPassword ? 'Change Password' : 'Set a Password'}
                </h2>
            </div>

            <div className="p-5 sm:p-6">
                {!hasPassword && (
                    <p className="mb-5 rounded-md border border-[var(--dark-red)]/15 bg-[var(--brand-warm-bg)]/40 px-4 py-3 text-sm text-foreground/70">
                        Your account currently signs in with Google. Set a password to also be able to log in with your email and password.
                    </p>
                )}

                <Form {...form}>
                    <form className="grid grid-cols-1 gap-5 md:max-w-md" onSubmit={form.handleSubmit(onSubmit)}>

                        {hasPassword && (
                            <FormField
                                control={form.control}
                                name="currentPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[13px] text-foreground/60">Current Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" autoComplete="current-password" placeholder="Enter current password" className="form-field" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="relative">
                                    <FormLabel className="text-[13px] text-foreground/60">New Password</FormLabel>
                                    <FormControl>
                                        <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter new password" className="form-field !pr-10" {...field} />
                                    </FormControl>
                                    <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-[31px] cursor-pointer text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[13px] text-foreground/60">Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter new password" className="form-field" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div>
                            <ButtonLoading
                                loading={loading}
                                type="submit"
                                text={hasPassword ? 'Update Password' : 'Set Password'}
                                variant="brand"
                                className="h-11 px-8 text-base font-semibold cursor-pointer"
                            />
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default ChangePasswordSection
