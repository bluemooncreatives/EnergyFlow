'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { ADMIN_CATEGORY_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { zSchema } from '@/lib/zodSchema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { use, useEffect, useState } from 'react'
import slugify from 'slugify'
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
    const { data: categoryData } = useFetch(`/api/category/get/${id}`)


    const [loading, setLoading] = useState(false)
    const formSchema = zSchema.pick({
        _id: true, name: true, slug: true
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            _id: id,
            name: "",
            slug: "",
        },
    })
 


    useEffect(() => {
        if (categoryData && categoryData.success) {
            const data = categoryData.data
            form.reset({
                _id: data?._id,
                name: data?.name,
                slug: data?.slug
            })
        }
    }, [categoryData])


    useEffect(() => {
        const name = form.getValues('name')
        if (name) {
            form.setValue('slug', slugify(name).toLowerCase())
        }
    }, [form.watch('name')])

    const onSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: response } = await axios.put('/api/category/update', values)
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
                title="Edit Category"
                description="Update the category details and slug."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card p-4 sm:p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
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
                            <ButtonLoading loading={loading} type="submit" text="Update Category" className="h-9 cursor-pointer" size="lg" />
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}

export default EditCategory
