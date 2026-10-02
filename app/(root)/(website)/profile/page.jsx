'use client'
import ButtonLoading from '@/components/Application/ButtonLoading'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import AccountCard from '@/components/Application/Website/account/AccountCard'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import { zSchema } from '@/lib/zodSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Dropzone from 'react-dropzone'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BadgeCheck, Camera, CircleAlert, MapPin, User } from 'lucide-react'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { login } from '@/store/reducer/authReducer'
import { z } from 'zod'
import Link from 'next/link'
import ChangePasswordSection from '@/components/Application/Website/ChangePasswordSection'
import { formatDate, initials, profileCompletion } from '@/lib/account'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { scrollToElement } from '@/lib/scroll'

const breadCrumbData = {
    title: 'Profile',
    links: [{ label: 'Profile' }]
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

// Profile address fields are a saved convenience for faster checkout, so they
// are OPTIONAL here (a user can save just their name). Empty string is allowed.
const optional = (field) => field.or(z.literal('')).optional()
const formSchema = z.object({
    name: z.string().trim().pipe(zSchema.shape.name),
    phone: optional(zSchema.shape.phone),
    address: optional(zSchema.shape.address),
    landmark: zSchema.shape.landmark,
    city: optional(zSchema.shape.city),
    state: optional(zSchema.shape.state),
    pincode: optional(zSchema.shape.pincode),
    country: optional(zSchema.shape.country),
})

const EMPTY_VALUES = {
    name: "",
    phone: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
}

const toFormValues = (userData) =>
    Object.fromEntries(Object.keys(EMPTY_VALUES).map((key) => [key, userData?.[key] || ""]))

const inputClass = "h-11 text-base font-semibold text-[var(--brand-primary)]"
const labelClass = "text-[13px] text-foreground/60"

const FieldSkeleton = ({ wide }) => (
    <div className={`space-y-2 ${wide ? 'md:col-span-2' : ''}`}>
        <span className="block h-3 w-20 animate-pulse rounded bg-border/60" />
        <span className="block h-11 w-full animate-pulse rounded-[var(--radius-sm)] bg-border/40" />
    </div>
)

const TextField = ({ form, name, label, className, ...inputProps }) => (
    <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
            <FormItem className={className}>
                <FormLabel className={labelClass}>{label}</FormLabel>
                <FormControl>
                    <Input type="text" className={inputClass} {...inputProps} {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
        )}
    />
)

const Profile = () => {
    const dispatch = useDispatch()
    const { data: user, loading: fetching, error, errorStatus, refetch } = useFetch('/api/profile/get')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState()
    const [file, setFile] = useState()
    const [account, setAccount] = useState(null)
    const objectUrlRef = useRef(null)

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: EMPTY_VALUES,
    })

    const isLoading = fetching || (!user && !error)
    const isDirty = form.formState.isDirty || Boolean(file)
    const watched = form.watch()
    const completion = profileCompletion({ ...watched, avatar: { url: preview } })

    useEffect(() => {
        if (user && user.success) {
            const userData = user.data
            setAccount({
                email: userData?.email || "",
                hasPassword: Boolean(userData?.hasPassword),
                isEmailVerified: Boolean(userData?.isEmailVerified),
                createdAt: userData?.createdAt || null,
            })
            form.reset(toFormValues(userData))
            setPreview(userData?.avatar?.url)
        }
    }, [user])

    // The security section renders only after the profile loads, so a
    // /profile#security link has to scroll once it exists.
    useEffect(() => {
        if (account && window.location.hash === '#security') {
            scrollToElement('security')
        }
    }, [Boolean(account)])

    // Release the local preview blob when it is replaced or the page unmounts.
    const setObjectPreview = (nextUrl) => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = nextUrl
    }
    useEffect(() => () => setObjectPreview(null), [])

    // Warn before leaving with unsaved edits.
    useEffect(() => {
        if (!isDirty) return
        const onBeforeUnload = (event) => {
            event.preventDefault()
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [isDirty])

    const handleFileSelection = (files) => {
        const selected = files[0]
        if (!selected) return
        if (selected.size > MAX_IMAGE_BYTES) {
            showToast('error', 'Upload failed. Max image size is 5 MB.')
            return
        }
        const url = URL.createObjectURL(selected)
        setObjectPreview(url)
        setPreview(url)
        setFile(selected)
    }

    const handleRejected = (rejections) => {
        const code = rejections?.[0]?.errors?.[0]?.code
        if (code === 'file-too-large') {
            showToast('error', 'Upload failed. Max image size is 5 MB.')
        } else if (code === 'file-invalid-type') {
            showToast('error', 'Please choose an image file (JPG, PNG or WebP).')
        } else if (code === 'too-many-files') {
            showToast('error', 'Please choose a single image.')
        } else {
            showToast('error', 'That file could not be used. Please try another image.')
        }
    }

    const discardChanges = () => {
        form.reset(toFormValues(user?.data))
        setObjectPreview(null)
        setPreview(user?.data?.avatar?.url)
        setFile(undefined)
    }

    const updateProfile = async (values) => {
        setLoading(true)
        try {
            const formData = new FormData()
            if (file) {
                formData.set('file', file)
            }
            for (const key of Object.keys(EMPTY_VALUES)) {
                formData.set(key, (values[key] ?? '').trim())
            }

            const { data: response } = await axios.put('/api/profile/update', formData)
            if (!response.success) {
                throw new Error(response.message)
            }

            showToast('success', response.message)
            dispatch(login(response.data))
            // The saved values become the new baseline, so the form is clean again.
            form.reset(toFormValues(response.data))
            setObjectPreview(null)
            setPreview(response.data?.avatar?.url)
            setFile(undefined)
        } catch (error) {
            showToast('error', error.response?.data?.message || error.message || 'Could not save your profile.')
        } finally {
            setLoading(false)
        }
    }

    if (!isLoading && error) {
        const sessionProblem = errorStatus === 401 || errorStatus === 404
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumbData} />
                <UserPanelLayout>
                    <AccountCard>
                        <EmptyState
                            icon={CircleAlert}
                            tone="danger"
                            title={sessionProblem ? 'Your session has ended' : 'We couldn’t load your profile'}
                            description={sessionProblem
                                ? 'Please sign in again to manage your profile.'
                                : 'Something went wrong on our side. Please try again in a moment.'}
                            action={sessionProblem ? (
                                <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                                    <Link href={`${WEBSITE_LOGIN}?callback=/profile`}>Sign in</Link>
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={refetch} className="h-11 px-8 text-base font-semibold">Try again</Button>
                            )}
                        />
                    </AccountCard>
                </UserPanelLayout>
            </div>
        )
    }

    const memberSince = formatDate(account?.createdAt)

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className="space-y-6">
                    <Form {...form}>
                        <form className="space-y-6" onSubmit={form.handleSubmit(updateProfile)} noValidate>
                            <AccountCard icon={User} title="My Profile" description="Your personal details and contact information.">
                                <div className="p-5 sm:p-6">
                                    {/* Identity row */}
                                    <div className="flex flex-col gap-5 border-b border-line-soft pb-6 sm:flex-row sm:items-center">
                                        <Dropzone
                                            onDrop={handleFileSelection}
                                            onDropRejected={handleRejected}
                                            maxSize={MAX_IMAGE_BYTES}
                                            maxFiles={1}
                                            multiple={false}
                                            accept={{ 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] }}
                                            disabled={isLoading || loading}
                                        >
                                            {({ getRootProps, getInputProps, isDragActive }) => (
                                                <div
                                                    {...getRootProps({
                                                        className: 'group relative w-fit cursor-pointer rounded-full outline-none focus-visible:ring-3 focus-visible:ring-brand/40',
                                                        'aria-label': 'Change profile photo',
                                                    })}
                                                >
                                                    <input {...getInputProps()} data-testid="avatar-input" />
                                                    {isLoading ? (
                                                        <span className="block size-24 animate-pulse rounded-full bg-border/60" />
                                                    ) : (
                                                        <Avatar className={`size-24 border-2 transition-colors ${isDragActive ? 'border-brand' : 'border-brand/30 group-hover:border-brand'}`}>
                                                            <AvatarImage src={preview} alt="Profile photo" className="object-cover" />
                                                            <AvatarFallback className="bg-brand text-2xl font-semibold text-on-brand">
                                                                {initials(watched.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full border-2 border-surface-card bg-brand text-on-brand shadow-sm">
                                                        <Camera className="size-3.5" aria-hidden="true" />
                                                    </span>
                                                </div>
                                            )}
                                        </Dropzone>

                                        <div className="min-w-0 flex-1">
                                            {isLoading ? (
                                                <div className="space-y-2">
                                                    <span className="block h-5 w-40 animate-pulse rounded bg-border/60" />
                                                    <span className="block h-3.5 w-56 max-w-full animate-pulse rounded bg-border/60" />
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="truncate text-lg font-semibold text-[var(--brand-primary)]">
                                                        {watched.name?.trim() || 'Your name'}
                                                    </p>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-foreground/60">
                                                        <span className="max-w-full truncate">{account?.email}</span>
                                                        {account?.isEmailVerified && (
                                                            <span className="inline-flex items-center gap-1 text-[var(--success)]">
                                                                <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified
                                                            </span>
                                                        )}
                                                        {memberSince && <span>Member since {memberSince}</span>}
                                                    </div>
                                                    <p className="mt-2 text-xs text-foreground/50">
                                                        {file ? `New photo selected: ${file.name}` : 'Click or drop an image to change your photo. JPG, PNG or WebP, up to 5 MB.'}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {!isLoading && (
                                            <div className="w-full sm:w-44" data-testid="profile-percent">
                                                <div className="flex items-baseline justify-between text-[13px]">
                                                    <span className="text-foreground/60">Profile</span>
                                                    <span className="font-semibold text-brand">{completion.percent}%</span>
                                                </div>
                                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-well" aria-hidden="true">
                                                    <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${completion.percent}%` }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Personal details */}
                                    <div className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-2">
                                        {isLoading ? (
                                            <>
                                                <FieldSkeleton />
                                                <FieldSkeleton />
                                                <FieldSkeleton wide />
                                            </>
                                        ) : (
                                            <>
                                                <TextField form={form} name="name" label="Name" placeholder="Enter your name" autoComplete="name" maxLength={50} />
                                                <FormField
                                                    control={form.control}
                                                    name="phone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className={labelClass}>Phone</FormLabel>
                                                            <FormControl>
                                                                <PhoneInput placeholder="Enter your phone number" className={inputClass} value={field.value} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {/* Email (account identity — read only) */}
                                                <FormItem className="md:col-span-2">
                                                    <FormLabel className={labelClass}>Email</FormLabel>
                                                    <Input
                                                        type="email"
                                                        value={account?.email || ''}
                                                        readOnly
                                                        disabled
                                                        className={`${inputClass} opacity-80`}
                                                    />
                                                    <p className="text-xs text-foreground/50">Your account email can&apos;t be changed here.</p>
                                                </FormItem>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </AccountCard>

                            <AccountCard icon={MapPin} title="Saved Address" description="We'll use this to pre-fill your checkout. You can change it anytime.">
                                <div className="grid grid-cols-1 gap-5 p-5 sm:p-6 md:grid-cols-2">
                                    {isLoading ? (
                                        <>
                                            <FieldSkeleton wide />
                                            <FieldSkeleton />
                                            <FieldSkeleton />
                                            <FieldSkeleton />
                                            <FieldSkeleton />
                                        </>
                                    ) : (
                                        <>
                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel className={labelClass}>Address (Flat, House no., Building, Street, Area)</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="e.g. 12B, Sunrise Apartments, MG Road, Andheri West" autoComplete="street-address" maxLength={250} className="min-h-[90px] resize-y text-base font-semibold text-[var(--brand-primary)]" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <TextField form={form} name="landmark" label="Landmark (optional)" placeholder="e.g. Near City Mall" maxLength={120} />
                                            <TextField form={form} name="pincode" label="Pincode" placeholder="e.g. 400058" inputMode="numeric" autoComplete="postal-code" maxLength={12} />
                                            <TextField form={form} name="city" label="City" placeholder="e.g. Mumbai" autoComplete="address-level2" maxLength={60} />
                                            <TextField form={form} name="state" label="State" placeholder="e.g. Maharashtra" autoComplete="address-level1" maxLength={60} />
                                            <TextField form={form} name="country" label="Country" placeholder="e.g. India" autoComplete="country-name" maxLength={60} />
                                        </>
                                    )}
                                </div>

                                {/* Save bar */}
                                <div className="flex flex-col-reverse gap-3 border-t border-line-soft bg-surface-well/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                    <p className="text-[13px] text-foreground/60" aria-live="polite">
                                        {isDirty ? 'You have unsaved changes.' : 'All changes saved.'}
                                    </p>
                                    <div className="flex gap-3">
                                        {isDirty && (
                                            <Button type="button" variant="outline" onClick={discardChanges} disabled={loading} className="h-11 px-6 text-base font-semibold">
                                                Discard
                                            </Button>
                                        )}
                                        <ButtonLoading
                                            loading={loading}
                                            type="submit"
                                            text="Save Changes"
                                            variant="brand"
                                            disabled={isLoading || !isDirty || loading}
                                            className="h-11 px-8 text-base font-semibold cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </AccountCard>
                        </form>
                    </Form>

                    {/* Password & security */}
                    <div id="security" className="scroll-mt-24">
                        {account && (
                            <ChangePasswordSection
                                hasPassword={account.hasPassword}
                                onPasswordSet={() => setAccount((prev) => ({ ...prev, hasPassword: true }))}
                            />
                        )}
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default Profile
