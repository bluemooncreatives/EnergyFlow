'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Trash2,
  Quote,
  GripVertical,
  Star,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zSchema } from '@/lib/zodSchema'
import { showToast } from '@/lib/showToast'
import { ADMIN_DASHBOARD, ADMIN_TESTIMONIAL_SHOW } from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_TESTIMONIAL_SHOW, label: 'Testimonials' },
]

const formSchema = zSchema.pick({ name: true, review: true, testimonialRating: true })

// Inline 1–5 star picker wired into react-hook-form.
const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        aria-label={`${n} star${n > 1 ? 's' : ''}`}
        onClick={() => onChange(n)}
        className="p-0.5"
      >
        <Star
          className={`size-6 transition-colors ${
            n <= value ? 'fill-amber-500 text-amber-500' : 'fill-muted text-muted-foreground/40'
          }`}
        />
      </button>
    ))}
  </div>
)

const ShowTestimonials = () => {
  const [testimonials, setTestimonials] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderDirty, setOrderDirty] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', review: '', testimonialRating: 5 },
  })

  const loadTestimonials = async () => {
    setLoadingList(true)
    try {
      const { data } = await axios.get('/api/testimonial')
      if (!data.success) throw new Error(data.message)
      setTestimonials(data.data || [])
      setOrderDirty(false)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resetForm = () => {
    form.reset({ name: '', review: '', testimonialRating: 5 })
    setEditingId(null)
  }

  const startEdit = (testimonial) => {
    setEditingId(testimonial._id)
    form.reset({
      name: testimonial.name,
      review: testimonial.review,
      testimonialRating: testimonial.rating,
    })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      const isEdit = Boolean(editingId)
      const { data } = isEdit
        ? await axios.put('/api/testimonial/update', { _id: editingId, ...values })
        : await axios.post('/api/testimonial', values)
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      resetForm()
      await loadTestimonials()
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (testimonial) => {
    setBusyId(testimonial._id)
    try {
      const { data } = await axios.put('/api/testimonial/update', {
        _id: testimonial._id,
        isActive: !testimonial.isActive,
      })
      if (!data.success) throw new Error(data.message)
      setTestimonials((prev) =>
        prev.map((t) => (t._id === testimonial._id ? { ...t, isActive: !t.isActive } : t))
      )
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id) => {
    setBusyId(id)
    try {
      const { data } = await axios.delete('/api/testimonial', { data: { ids: [id] } })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      if (editingId === id) resetForm()
      await loadTestimonials()
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setBusyId(null)
    }
  }

  const move = (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= testimonials.length) return
    setTestimonials((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setOrderDirty(true)
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const order = testimonials.map((t) => t._id)
      const { data } = await axios.put('/api/testimonial', { order })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      setOrderDirty(false)
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setSavingOrder(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Testimonials"
        description='Curate the customer reviews shown in the homepage "What They Say" section.'
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      {/* Add / edit testimonial */}
      <div className="rounded-md bg-card p-4 sm:p-6">
        <h3 className="mb-1 text-sm font-semibold">
          {editingId ? 'Edit testimonial' : 'Add testimonial'}
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {editingId
            ? 'Update the selected testimonial, then save your changes.'
            : 'Write a customer review to feature on the storefront.'}
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g. Sophia Patel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testimonialRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <StarPicker value={Number(field.value) || 0} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What did the customer say about their experience?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <ButtonLoading
                loading={submitting}
                type="submit"
                text={
                  <span className="inline-flex items-center gap-2">
                    <Plus className="size-4" /> {editingId ? 'Update Testimonial' : 'Add Testimonial'}
                  </span>
                }
                className="h-9"
              />
              {editingId && (
                <Button type="button" variant="outline" className="h-9" onClick={resetForm}>
                  <X className="size-4" /> Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Current testimonials */}
      <div className="rounded-md bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Current testimonials</h3>
            <p className="text-sm text-muted-foreground">
              Reorder with the arrows; hidden entries are not shown on the storefront.
            </p>
          </div>
          {orderDirty && (
            <ButtonLoading
              loading={savingOrder}
              onClick={handleSaveOrder}
              type="button"
              text="Save Order"
              className="h-9"
            />
          )}
        </div>

        {loadingList ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : testimonials.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Quote className="size-8 opacity-40" />
            <p className="text-sm">No testimonials yet. Add one above to get started.</p>
            <p className="text-xs">
              Until then the storefront shows a default set so the section never appears empty.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {testimonials.map((testimonial, index) => (
              <li
                key={testimonial._id}
                className={`flex items-start gap-3 rounded-md border p-3 ${
                  testimonial.isActive ? '' : 'opacity-60'
                }`}
              >
                <GripVertical className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <span className="mt-0.5 w-6 shrink-0 text-center text-sm text-muted-foreground">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3 ${
                            i < testimonial.rating
                              ? 'fill-amber-500 text-amber-500'
                              : 'fill-muted text-muted-foreground/40'
                          }`}
                        />
                      ))}
                    </span>
                    {!testimonial.isActive && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {testimonial.review}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={index === testimonials.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    disabled={busyId === testimonial._id}
                    onClick={() => toggleActive(testimonial)}
                    aria-label={testimonial.isActive ? 'Hide testimonial' : 'Show testimonial'}
                    title={testimonial.isActive ? 'Hide from storefront' : 'Show on storefront'}
                  >
                    {testimonial.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => startEdit(testimonial)}
                    aria-label="Edit testimonial"
                  >
                    <Quote className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 text-red-600 hover:text-red-700"
                    disabled={busyId === testimonial._id}
                    onClick={() => handleDelete(testimonial._id)}
                    aria-label="Delete testimonial"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ShowTestimonials
