'use client'
import AdminRecordState from '@/components/Application/Admin/AdminRecordState'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { ADMIN_CATEGORY_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { categoryUpdateSchema } from '@/lib/categoryConfig'
import CategoryCoverField from '@/components/Application/Admin/CategoryCoverField'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { use, useEffect, useState } from 'react'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import useFetch from '@/hooks/useFetch'
const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CATEGORY_SHOW, label: 'Category' },
    { href: '', label: 'Edit Category' },
]

const EditCategory = ({ params }) => {

    const { id } = use(params)
    const { data: categoryData, loading: recordLoading, error: recordError, errorStatus: recordErrorStatus, refetch: refetchRecord } = useFetch(`/api/category/get/${id}`)


    const [loading, setLoading] = useState(false)
    const [coverMedia, setCoverMedia] = useState(null)
    const [uploadBusy, setUploadBusy] = useState(false)
    const [saveError, setSaveError] = useState(null)

    const form = useForm({
        resolver: zodResolver(categoryUpdateSchema),
        defaultValues: {
            _id: id,
            name: "",
            slug: "",
            coverImage: null,
            coverAlt: '',
            coverPosition: 'center',
        },
    })
 


    useEffect(() => {
        if (categoryData && categoryData.success) {
            const data = categoryData.data
            form.reset({
                _id: data?._id,
                name: data?.name,
                slug: data?.slug,
                coverImage: data?.coverImageId || data?.coverImage?._id || null,
                coverAlt: data?.coverAlt || '',
                coverPosition: data?.coverPosition || 'center',
                updatedAt: data?.updatedAt,
            })
            setCoverMedia(data?.coverImage || null)
            setSaveError(null)
        }
    }, [categoryData, form])

    const onSubmit = async (values) => {
        if (loading || uploadBusy || recordLoading || !categoryData?.success || categoryData.data?._id !== id) return
        setLoading(true)
        try {
            const { data: response } = await axios.put('/api/category/update', values, { timeout: 30000 })
            if (!response.success) {
                throw new Error(response.message)
            }

            showToast('success', response.message)
            form.reset({ ...values, updatedAt: response.data?.updatedAt || values.updatedAt })
            setSaveError(null)
        } catch (error) {
            const message = error?.response?.data?.message || error.message
            setSaveError(message)
            showToast('error', message)
        } finally {
            setLoading(false)
        }
    }

    if (recordError) {

        return (

            <AdminRecordState

                entity="Category"

                error={recordError}

                errorStatus={recordErrorStatus}

                onRetry={refetchRecord}

                backHref={ADMIN_CATEGORY_SHOW}

                backLabel="Back to categories"

                header={{ title: 'Edit Category', description: 'Update the category details and slug.', breadcrumb: <BreadCrumb breadcrumbData={breadcrumbData} /> }}

            />

        )

    }


    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Edit Category"
                description="Update the category details, cover image and slug. Save to publish changes to the storefront."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card p-4 sm:p-6">
                {saveError && <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-destructive/30 p-3 text-sm">
                    <span>{saveError} Your edits are kept.</span>
                    <Button type="button" variant="outline" disabled={recordLoading || loading || uploadBusy} onClick={refetchRecord}>Reload latest (discard edits)</Button>
                </div>}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <fieldset disabled={loading || recordLoading || !categoryData?.success}>
                        <div className="mb-5">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter category name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="mb-5">
                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter slug" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mb-3">
                            <CategoryCoverField form={form} media={coverMedia} onMediaChange={setCoverMedia} onBusyChange={setUploadBusy} disabled={loading || recordLoading || !categoryData?.success} />
                            <ButtonLoading loading={loading} disabled={loading || uploadBusy} type="submit" text="Update Category" className="h-11 w-full cursor-pointer sm:h-9 sm:w-auto" size="lg" />
                        </div>
                        </fieldset>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default EditCategory
