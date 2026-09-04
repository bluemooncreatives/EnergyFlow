'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { ADMIN_DASHBOARD, ADMIN_PRODUCT_SHOW, ADMIN_PRODUCT_VARIANT_ADD } from '@/routes/AdminPanelRoute'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { zSchema } from '@/lib/zodSchema'
import { computeDiscountPercentage, validatePricing } from '@/lib/pricing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import slugify from 'slugify'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import useFetch from '@/hooks/useFetch'
import Select from '@/components/Application/Select'
import Editor from '@/components/Application/Admin/LazyEditor'
import MediaModal from '@/components/Application/Admin/MediaModal'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_PRODUCT_SHOW, label: 'Products' },
  { href: '', label: 'Add Product' },
]

const AddProduct = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [createdProductId, setCreatedProductId] = useState('')
  const [categoryOption, setCategoryOption] = useState([])
  const [sizeGuideOption, setSizeGuideOption] = useState([])
  const { data: getCategory } = useFetch('/api/category?deleteType=SD&&size=10000')
  const { data: getSizeGuides } = useFetch('/api/size-guide?activeOnly=true&&deleteType=SD&&size=10000')

  // media modal states  
  const [open, setOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])

  useEffect(() => {
    if (getCategory && getCategory.success) {
      const data = getCategory.data
      const options = data.map((cat) => ({ label: cat.name, value: cat._id }))
      setCategoryOption(options)
    }
  }, [getCategory])

  useEffect(() => {
    if (getSizeGuides && getSizeGuides.success) {
      const data = getSizeGuides.data || []
      const options = data.map((guide) => ({ label: guide.name, value: guide._id }))
      setSizeGuideOption(options)
    }
  }, [getSizeGuides])

  const formSchema = zSchema.pick({
    name: true,
    parentSku: true,
    slug: true,
    category: true,
    sizeGuide: true,
    mrp: true,
    sellingPrice: true,
    discountPercentage: true,
    description: true,
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parentSku: "",
      slug: "",
      category: "",
      sizeGuide: null,
      mrp: 0,
      sellingPrice: 0,
      discountPercentage: 0,
      description: "",
    },
  })

  useEffect(() => {
    const name = form.getValues('name')
    if (name) {
      form.setValue('slug', slugify(name).toLowerCase())
    }
  }, [form.watch('name')])

  // Discount is always derived from MRP & Selling Price (single source of truth
  // in lib/pricing). Recompute on every change so 0% (SP == MRP) and later edits
  // are reflected instead of leaving a stale value behind.
  useEffect(() => {
    form.setValue('discountPercentage', computeDiscountPercentage(form.getValues('mrp'), form.getValues('sellingPrice')))
  }, [form.watch('mrp'), form.watch('sellingPrice')])

  const editor = (event, editor) => {
    const data = editor.getData()
    form.setValue('description', data)
  }

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      if (selectedMedia.length <= 0) {
        return showToast('error', 'Please select media.')
      }

      const pricing = validatePricing(values.mrp, values.sellingPrice)
      if (!pricing.ok) {
        form.setError(pricing.field, { type: 'manual', message: pricing.message })
        return showToast('error', pricing.message)
      }
      values.discountPercentage = pricing.discountPercentage

      const mediaIds = selectedMedia.map(media => media._id)
      values.media = mediaIds

      const { data: response } = await axios.post('/api/product/create', values)
      if (!response.success) {
        throw new Error(response.message)
      }

      const productId = response?.data?._id
      setCreatedProductId(productId || '')

      form.reset()
      setSelectedMedia([])
      showToast('success', response.message)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVariant = async () => {
    if (!createdProductId) {
      await form.trigger()
      showToast('error', 'Create the product first, then add variants.')
      return
    }

    router.push(`${ADMIN_PRODUCT_VARIANT_ADD}?productId=${createdProductId}`)
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Add Product"
        description="Create a new product and attach media."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
              <div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Name<span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter category name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter slug" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="parentSku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Parent SKU <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter parent SKU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={categoryOption}
                          selected={field.value}
                          setSelected={field.onChange}
                          isMulti={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="sizeGuide"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Guide</FormLabel>
                      <FormControl>
                        <Select
                          options={sizeGuideOption}
                          selected={field.value}
                          setSelected={field.onChange}
                          placeholder="Select Size Guide"
                          isMulti={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="mrp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        MRP <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter MRP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="sellingPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Selling Price <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter Selling Price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Percentage <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="number" readOnly placeholder="Enter Discount Percentage" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mb-5 md:col-span-2">
                <FormLabel className="mb-2">
                  Description <span className="text-red-500">*</span>
                </FormLabel>
                <Editor onChange={editor} />
                <FormMessage></FormMessage>
              </div>
            </div>

            <div className="md:col-span-2 border border-dashed rounded p-5 text-center">
              <MediaModal
                open={open}
                setOpen={setOpen}
                selectedMedia={selectedMedia}
                setSelectedMedia={setSelectedMedia}
                isMultiple={true}
              />

              {selectedMedia.length > 0 && (
                <div className="flex justify-center items-center flex-wrap mb-3 gap-2">
                  {selectedMedia.map((media) => (
                    <div key={media._id} className="h-24 w-24 border">
                      <Image
                        src={media.url}
                        height={100}
                        width={100}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div onClick={() => setOpen(true)} className="bg-gray-50 dark:bg-card border w-[200px] mx-auto p-5 cursor-pointer">
                <span className="font-semibold">Select Media</span>
              </div>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              To show your product on the website, you need to add at least one variant after creating the product.
            </p>

            <div className="mb-3 mt-4 flex flex-wrap items-center gap-3">
              <ButtonLoading loading={loading} type="submit" text="Add Product" className="h-9 cursor-pointer" size="lg" />
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleAddVariant}
                disabled={!createdProductId || loading}
                className="h-9 cursor-pointer"
              >
                Add Variant
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default AddProduct
