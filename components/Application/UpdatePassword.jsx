'use client'
import { Card, CardContent } from '@/components/ui/card'
import { useState } from 'react'
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

import axios from 'axios'
import { showToast } from '@/lib/showToast'
import { useRouter } from 'next/navigation'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
const UpdatePassword = ({ email }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isTypePassword, setIsTypePassword] = useState(true)
    const formSchema = zSchema.pick({
        email: true, password: true
    }).extend({
        confirmPassword: z.string()
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Password and confirm password must be same.',
        path: ['confirmPassword']
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: email,
            password: "",
            confirmPassword: "",
        },
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

        <div>
            <div className='text-center'>
                <h1 className='text-3xl font-bold'>Update Password</h1>
                <p>Create new password by filling below form.</p>
            </div>
            <div className='mt-5'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handlePasswordUpdate)} >

                        <div className='mb-5'>
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className="relative">
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="***********" className="form-field" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className='mb-5'>
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem className="relative">
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input type={isTypePassword ? 'password' : 'text'} placeholder="***********" className="form-field !pr-10" {...field} />
                                        </FormControl>
                                        <button className='absolute top-[32px] right-3 cursor-pointer text-muted-foreground hover:text-foreground' type='button' onClick={() => setIsTypePassword(!isTypePassword)}>
                                            {isTypePassword ?
                                                <EyeOff className='size-4' />
                                                :
                                                <Eye className='size-4' />
                                            }
                                        </button>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className='mb-3'>
                            <ButtonLoading loading={loading} type="submit" text="Update Password" variant="brand" className="h-9 w-full rounded-sm text-base font-semibold uppercase cursor-pointer" />
                        </div>
                    </form>
                </Form>
            </div>
        </div>

    )
}

export default UpdatePassword