'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { ADMIN_DASHBOARD, ADMIN_PRODUCT_VARIANT_SHOW } from '@/routes/AdminPanelRoute'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { zSchema } from '@/lib/zodSchema'
import { computeDiscountPercentage, validatePricing } from '@/lib/pricing'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { use, useEffect, useState } from 'react'
import { showToast } from '@/lib/showToast'
import axios from 'axios'
import useFetch from '@/hooks/useFetch'
import Select from '@/components/Application/Select'
import MediaModal from '@/components/Application/Admin/MediaModal'
import ColorHexPicker from '@/components/Application/Admin/ColorHexPicker'
import Image from 'next/image'
import { sizes } from '@/lib/utils'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_PRODUCT_VARIANT_SHOW, label: 'Product Variants' },
  { href: '', label: 'Edit Product Variant' },
]

const EditProductVariant = ({ params }) => {
  const { id } = use(params)

  const [loading, setLoading] = useState(false)
  const [productOption, setProductOption] = useState([])
  const { data: getProduct } = useFetch('/api/product?deleteType=SD&&size=10000')
  const { data: getVariant } = useFetch(`/api/product-variant/get/${id}`)

  const [open, setOpen] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])

  useEffect(() => {
    if (getProduct && getProduct.success) {
      const options = getProduct.data.map((product) => ({ label: product.name, value: product._id }))
      setProductOption(options)
    }
  }, [getProduct])

  const formSchema = zSchema.pick({
    _id: true,
    product: true,
    sku: true,
    color: true,
    colorHex: true,
    size: true,
    mrp: true,
    sellingPrice: true,
    discountPercentage: true,
  })

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      _id: id,
      product: '',
      sku: '',
      color: '',
      colorHex: '',
      size: '',
      mrp: '',
      sellingPrice: '',
      discountPercentage: '',
    },
  })

  useEffect(() => {
    if (getVariant && getVariant.success) {
      const variant = getVariant.data
      form.reset({
        _id: variant._id,
        product: variant.product,
        sku: variant.sku,
        color: variant.color,
        colorHex: variant.colorHex || '',
        size: variant.size,
        mrp: variant.mrp,
        sellingPrice: variant.sellingPrice,
        discountPercentage: variant.discountPercentage,
      })

      if (variant.media) {
        const media = variant.media.map((item) => ({ _id: item._id, url: item.secure_url }))
        setSelectedMedia(media)
      }
    }
  }, [getVariant])

  // Discount is always derived from MRP & Selling Price (single source of truth
  // in lib/pricing). Recompute on every change so 0% (SP == MRP) and later edits
  // are reflected instead of leaving a stale value behind.
  useEffect(() => {
    form.setValue('discountPercentage', computeDiscountPercentage(form.getValues('mrp'), form.getValues('sellingPrice')))
  }, [form.watch('mrp'), form.watch('sellingPrice')])

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

      values.media = selectedMedia.map((media) => media._id)

      const { data: response } = await axios.put('/api/product-variant/update', values)
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
        title="Edit Product Variant"
        description="Update variant details, pricing, and media."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-5">
              <div>
                <FormField
                  control={form.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Product <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={productOption}
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
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        SKU <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter sku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Color <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Enter color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="colorHex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Swatch Color</FormLabel>
                      <FormControl>
                        <ColorHexPicker
                          value={field.value}
                          onChange={field.onChange}
                          colorName={form.watch('color')}
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
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Size <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          options={sizes}
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

              <div className="mb-3">
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
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  {selectedMedia.map((media) => (
                    <div key={media._id} className="h-24 w-24 border">
                      <Image
                        src={media.url}
                        height={100}
                        width={100}
                        alt="Selected media"
                        className="size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div onClick={() => setOpen(true)} className="mx-auto w-[200px] cursor-pointer border bg-muted/40 p-5">
                <span className="font-semibold">Select Media</span>
              </div>
            </div>

            <div className="mb-3 mt-5">
              <ButtonLoading loading={loading} type="submit" text="Save Changes" className="h-9 cursor-pointer" size="lg" />
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default EditProductVariant
