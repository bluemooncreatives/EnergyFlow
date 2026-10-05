'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { ADMIN_CATEGORY_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { categorySchema } from '@/lib/categoryConfig'
import CategoryCoverField from '@/components/Application/Admin/CategoryCoverField'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import slugify from 'slugify'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_CATEGORY_SHOW, label: 'Category' },
  { href: '', label: 'Add Category' },
]

const AddCategory = () => {
  const [loading, setLoading] = useState(false)
  const [coverMedia, setCoverMedia] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      coverImage: null,
      coverAlt: '',
      coverPosition: 'center',
    },
  })

  const name = form.watch('name')
  useEffect(() => {
    if (name) {
      form.setValue('slug', slugify(name).toLowerCase())
    }
  }, [form, name])

  const onSubmit = async (values) => {
    if (loading || uploadBusy) return
    setLoading(true)
    try {
      const { data: response } = await axios.post('/api/category/create', values, { timeout: 30000 })
      if (!response.success) {
        throw new Error(response.message)
      }

      form.reset()
      setCoverMedia(null)
      showToast('success', response.message)
    } catch (error) {
      showToast('error', error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Add Category"
        description="Create a new product category for your catalog."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <fieldset disabled={loading}>
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
              <CategoryCoverField form={form} media={coverMedia} onMediaChange={setCoverMedia} onBusyChange={setUploadBusy} disabled={loading} />
              <ButtonLoading loading={loading} disabled={loading || uploadBusy} type="submit" text="Add Category" className="h-11 w-full cursor-pointer sm:h-9 sm:w-auto" size="lg" />
            </div>
            </fieldset>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default AddCategory
