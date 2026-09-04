'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/useFetch'
import { zSchema } from '@/lib/zodSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Dropzone from 'react-dropzone'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import userIcon from '@/public/assets/images/user.png'
import { Camera, User } from 'lucide-react'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { z } from 'zod'
import ChangePasswordSection from '@/components/Application/Website/ChangePasswordSection'

const breadCrumbData = {
    title: 'Profile',
    links: [{ label: 'Profile' }]
}

const Profile = () => {
    const dispatch = useDispatch()
    const { data: user } = useFetch('/api/profile/get')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState()
    const [file, setFile] = useState()
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024

    // Profile address fields are a saved convenience for faster checkout, so they
    // are OPTIONAL here (a user can save just their name). Empty string is allowed.
    const optional = (field) => field.or(z.literal('')).optional()
    const formSchema = z.object({
        name: zSchema.shape.name,
        phone: optional(zSchema.shape.phone),
        address: optional(zSchema.shape.address),
        landmark: zSchema.shape.landmark,
        city: optional(zSchema.shape.city),
        state: optional(zSchema.shape.state),
        pincode: optional(zSchema.shape.pincode),
        country: optional(zSchema.shape.country),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            address: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            country: "",
        }
    })

    const [email, setEmail] = useState("")
    const [hasPassword, setHasPassword] = useState(false)

    useEffect(() => {
        if (user && user.success) {
            const userData = user.data
            setHasPassword(Boolean(userData?.hasPassword))
            form.reset({
                name: userData?.name || "",
                phone: userData?.phone || "",
                address: userData?.address || "",
                landmark: userData?.landmark || "",
                city: userData?.city || "",
                state: userData?.state || "",
                pincode: userData?.pincode || "",
                country: userData?.country || "",
            })

            setEmail(userData?.email || "")
            setPreview(userData?.avatar?.url)
        }
    }, [user])


    const handleFileSelection = (files) => {
        const file = files[0]
        if (!file) {
            return
        }
        if (file.size > MAX_IMAGE_BYTES) {
            showToast('error', 'Upload failed. Max image size is 5 MB.')
            return
        }
        const preview = URL.createObjectURL(file)
        setPreview(preview)
        setFile(file)
    }

    const updateProfile = async (values) => {
        setLoading(true)
        try {
            let formData = new FormData()
            if (file) {
                formData.set('file', file)
            }
            formData.set('name', values.name ?? '')
            formData.set('phone', values.phone ?? '')
            formData.set('address', values.address ?? '')
            formData.set('landmark', values.landmark ?? '')
            formData.set('city', values.city ?? '')
            formData.set('state', values.state ?? '')
            formData.set('pincode', values.pincode ?? '')
            formData.set('country', values.country ?? '')

            const { data: response } = await axios.put('/api/profile/update', formData)
            if (!response.success) {
                throw new Error(response.message)
            }

            showToast('success', response.message)
            dispatch(login(response.data))
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
              <div className="space-y-6">
                <div className="rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background">

                    {/* Section header */}
                    <div className="flex items-center gap-2 border-b border-[var(--dark-red)]/20 px-5 py-4">
                        <User className="size-4 text-[var(--brand-primary)]" />
                        <h2 className="text-lg font-semibold text-[var(--brand-primary)]">
                            My Profile
                        </h2>
                    </div>

                    <div className="p-5 sm:p-6">
                        <Form {...form}>
                            <form className='grid md:grid-cols-2 grid-cols-1 gap-5' onSubmit={form.handleSubmit(updateProfile)}>
                                {/* Avatar */}
                                <div className='md:col-span-2 col-span-1 flex justify-center items-center'>
                                    <div className="flex flex-col items-center gap-2">
                                        <Dropzone
                                            onDrop={(acceptedFiles) => handleFileSelection(acceptedFiles)}
                                            maxSize={MAX_IMAGE_BYTES}
                                            accept={{ 'image/*': [] }}
                                        >
                                            {({ getRootProps, getInputProps }) => (
                                                <div {...getRootProps()}>
                                                    <input {...getInputProps()} />
                                                    <Avatar className="w-28 h-28 relative group border-2 border-[var(--dark-red)]/40 transition-all duration-200 hover:border-[var(--dark-red)]">
                                                        <AvatarImage src={preview ? preview : userIcon.src} />
                                                        <div className='absolute z-50 w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 justify-center items-center border-2 border-[var(--dark-red)] rounded-full group-hover:flex hidden cursor-pointer bg-black/20'>
                                                            <Camera className='size-4 text-white' />
                                                        </div>
                                                    </Avatar>
                                                </div>
                                            )}
                                        </Dropzone>
                                        <p className="text-sm text-foreground/60">Max image size: 5 MB.</p>
                                    </div>
                                </div>

                                {/* Name */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Name</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="Enter your name" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Phone */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Phone</FormLabel>
                                                <FormControl>
                                                    <PhoneInput placeholder="Enter your phone number" className="h-11 text-base font-semibold text-[var(--brand-primary)]" value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Email (account identity — read only) */}
                                <div className='mb-3 md:col-span-2 col-span-1'>
                                    <FormItem>
                                        <FormLabel className="text-[13px] text-foreground/60">Email</FormLabel>
                                        <Input
                                            type="email"
                                            value={email}
                                            readOnly
                                            disabled
                                            className="h-11 text-base font-semibold text-[var(--brand-primary)] opacity-80"
                                        />
                                        <p className="mt-1 text-xs text-foreground/50">Your account email can&apos;t be changed here.</p>
                                    </FormItem>
                                </div>

                                {/* Address divider */}
                                <div className='md:col-span-2 col-span-1 -mb-1 mt-2'>
                                    <p className="text-sm font-semibold text-[var(--brand-primary)]">Saved Address</p>
                                    <p className="text-xs text-foreground/50">We&apos;ll use this to pre-fill your checkout. You can change it anytime.</p>
                                </div>

                                {/* Address line */}
                                <div className='mb-3 md:col-span-2 col-span-1'>
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Address (Flat, House no., Building, Street, Area)</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="e.g. 12B, Sunrise Apartments, MG Road, Andheri West" className="min-h-[90px] text-base font-semibold text-[var(--brand-primary)] resize-y" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Landmark */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="landmark"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Landmark (optional)</FormLabel>
                                                <FormControl>
                                                    <Input type="text" placeholder="e.g. Near City Mall" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Pincode */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="pincode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Pincode</FormLabel>
                                                <FormControl>
                                                    <Input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="e.g. 400058" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* City */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">City</FormLabel>
                                                <FormControl>
                                                    <Input type="text" autoComplete="address-level2" placeholder="e.g. Mumbai" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* State */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">State</FormLabel>
                                                <FormControl>
                                                    <Input type="text" autoComplete="address-level1" placeholder="e.g. Maharashtra" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Country */}
                                <div className='mb-3'>
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] text-foreground/60">Country</FormLabel>
                                                <FormControl>
                                                    <Input type="text" autoComplete="country-name" placeholder="e.g. India" className="h-11 text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Submit */}
                                <div className='mb-3 md:col-span-2 col-span-1'>
                                    <ButtonLoading
                                        loading={loading}
                                        type="submit"
                                        text="Save Changes"
                                        variant="brand"
                                        className="h-11 px-8 text-base font-semibold cursor-pointer"
                                    />
                                </div>
                            </form>
                        </Form>
                    </div>

                </div>

                {/* Password & security */}
                <ChangePasswordSection
                    hasPassword={hasPassword}
                    onPasswordSet={() => setHasPassword(true)}
                />
              </div>
            </UserPanelLayout>
        </div>
    )
}

export default Profile

