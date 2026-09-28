'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import axios from 'axios'
import { LockKeyhole } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { zSchema } from '@/lib/zodSchema'
import { Form } from '@/components/ui/form'
import { showToast } from '@/lib/showToast'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { AuthField, AuthHeader, AuthSubmit, PasswordRules } from './Auth/AuthParts'

// Last step of the reset flow: choose and confirm the new password, then
// back to sign in.
const UpdatePassword = ({ email, children }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(
            zSchema.pick({ email: true, password: true })
                .extend({ confirmPassword: z.string() })
                .refine((data) => data.password === data.confirmPassword, {
                    message: 'Passwords don’t match.',
                    path: ['confirmPassword'],
                })
        ),
        defaultValues: { email, password: '', confirmPassword: '' },
    })

    const handlePasswordUpdate = async (values) => {
        try {
            setLoading(true)
            const { data: passwordUpdate } = await axios.put('/api/auth/reset-password/update-password', values)
            if (!passwordUpdate.success) {
                throw new Error(passwordUpdate.message)
            }

            form.reset()
            showToast('success', passwordUpdate.message)
            router.push(WEBSITE_LOGIN)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <AuthHeader
                eyebrow="Almost done"
                title="Choose a new"
                accent="password"
                lead="Pick something you’ll remember. You’ll use it the next time you sign in."
            >
                {children}
            </AuthHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePasswordUpdate)} className="ef-auth-form" noValidate>
                    <AuthField
                        control={form.control}
                        name="password"
                        label="New password"
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
                    <AuthSubmit loading={loading} loadingText="Updating…">Update password</AuthSubmit>
                </form>
            </Form>
        </>
    )
}

export default UpdatePassword
