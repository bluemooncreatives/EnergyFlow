'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import useFetch from '@/hooks/useFetch'
import { zSchema } from '@/lib/zodSchema'
import { ADMIN_DASHBOARD, ADMIN_MEDIA_EDIT, ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { use, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
const breadCrumbData = [
    {
        href: ADMIN_DASHBOARD,
        label: 'Home'
    },
    {
        href: ADMIN_MEDIA_SHOW,
        label: 'Media'
    }
    ,
    {
        href: "",
        label: 'Edit Media'
    }
]

const EditMedia = ({ params }) => {
    const { id } = use(params)
    const { data: mediaData } = useFetch(`/api/media/get/${id}`)
    const [loading, setLoading] = useState(false)

    const formSchema = zSchema.pick({
        _id: true,
        alt: true,
        title: true
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            _id: "",
            alt: "",
            title: "",
        },
    })

    useEffect(() => {
        if (mediaData && mediaData.success) {
            const data = mediaData.data
            form.reset({
                _id: data._id,
                alt: data.alt,
                title: data.title
            })
        }
    }, [mediaData])


    const onSubmit = async (values) => {
        try {
            setLoading(true)
            const { data: response } = await axios.put('/api/media/update', values)
            if (!response.success) {
                throw new Error(response.message)
            }

            showToast('success', response.message)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Edit Media"
                description="Update alt text and title metadata."
                breadcrumb={<BreadCrumb breadcrumbData={breadCrumbData} />}
            />

            <div className="rounded-md bg-card p-4 sm:p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="mb-5">
                            <Image
                                src={mediaData?.data?.secure_url || imgPlaceholder}
                                width={150}
                                height={150}
                                alt={mediaData?.atl || 'Image'}
                            />
                        </div>
                        <div className="mb-5">
                            <FormField
                                control={form.control}
                                name="alt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alt</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter alt" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="mb-5">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input type="text" placeholder="Enter title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="mb-3">
                            <ButtonLoading loading={loading} type="submit" text="Update Media" className="h-9 cursor-pointer" size="lg" />
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default EditMedia
