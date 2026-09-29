'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Quote,
  RotateCcw,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ConfirmDialog from '@/components/Application/Admin/data-table/ConfirmDialog'
import useReorderList from '@/components/Application/Admin/curation/useReorderList'
import UnsavedOrderBar from '@/components/Application/Admin/curation/UnsavedOrderBar'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { zSchema } from '@/lib/zodSchema'
import { showToast } from '@/lib/showToast'
import { cn, initialsOf } from '@/lib/utils'
import { ADMIN_DASHBOARD, ADMIN_TESTIMONIAL_SHOW } from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_TESTIMONIAL_SHOW, label: 'Testimonials' },
]

const formSchema = zSchema.pick({ name: true, review: true, testimonialRating: true })
const REVIEW_SOFT_MAX = 320
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'hidden', label: 'Hidden' },
]

const errorMessage = (error) => error?.response?.data?.message || error?.message || 'Something went wrong.'

// 1–5 stars as a radio group, with hover preview and the rating's word.
const StarPicker = ({ value, onChange }) => {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex h-10 items-center gap-3">
      <div role="radiogroup" aria-label="Rating" className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''} — ${RATING_WORDS[n]}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Star className={cn('size-6 transition-colors', n <= shown ? 'fill-[var(--brand-gold)] text-[var(--brand-gold)]' : 'text-foreground/20')} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted-foreground">{RATING_WORDS[shown]}</span>
    </div>
  )
}

const Stars = ({ value, size = 'size-3.5' }) => (
  <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} aria-hidden="true" className={cn(size, i < value ? 'fill-[var(--brand-gold)] text-[var(--brand-gold)]' : 'text-foreground/20')} />
    ))}
  </span>
)

// How the quote will read on the storefront, updated as the admin types.
const LivePreview = ({ name, review, rating }) => (
  <figure className="relative overflow-hidden rounded-xl bg-[var(--palette-pine)] p-5 text-[var(--palette-cream)]" style={{ backgroundImage: 'var(--brand-panel-gradient)' }}>
    <Quote className="absolute right-4 top-4 size-10 text-[var(--palette-sunflower)] opacity-30" aria-hidden="true" />
    <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-[var(--palette-sunflower)]">Storefront preview</p>
    <Stars value={rating || 0} size="size-4" />
    <blockquote className={cn('mt-3 line-clamp-5 text-[0.9375rem] leading-relaxed', !review && 'italic opacity-60')}>
      “{review || 'The customer’s words will appear here as you type.'}”
    </blockquote>
    <figcaption className="mt-4 flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-[var(--palette-sunflower)] text-xs font-bold text-[var(--palette-pine)]">{initialsOf(name)}</span>
      <span className={cn('text-sm font-semibold', !name && 'opacity-60')}>{name || 'Customer name'}</span>
    </figcaption>
  </figure>
)

/**
 * Testimonials: write, preview, publish/hide, reorder and delete the quotes
 * in the homepage "What They Say" section.
 *
 * Reordering works on the full list only (filters are for finding entries),
 * is saved explicitly, and can be discarded. Deletes ask first.
 */
const ShowTestimonials = () => {
  const list = useReorderList()
  const [status, setStatus] = useState('loading')
  const [submitting, setSubmitting] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [pendingDelete, setPendingDelete] = useState(null)
  const composerRef = useRef(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', review: '', testimonialRating: 5 },
  })
  const [watchName, watchReview, watchRating] = form.watch(['name', 'review', 'testimonialRating'])

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/testimonial')
      if (!data.success) throw new Error(data.message)
      list.load(data.data || [])
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      showToast('error', errorMessage(error))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!list.dirty) return
    const onBeforeUnload = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [list.dirty])

  const items = list.items
  const stats = useMemo(() => {
    const live = items.filter((t) => t.isActive).length
    const avg = items.length ? items.reduce((s, t) => s + (Number(t.rating) || 0), 0) / items.length : 0
    return { total: items.length, live, hidden: items.length - live, avg }
  }, [items])

  const visible = items
    .map((t, index) => ({ t, index }))
    .filter(({ t }) => filter === 'all' || (filter === 'live' ? t.isActive : !t.isActive))

  const resetForm = () => {
    form.reset({ name: '', review: '', testimonialRating: 5 })
    setEditingId(null)
  }

  const startEdit = (testimonial) => {
    setEditingId(testimonial._id)
    form.reset({ name: testimonial.name, review: testimonial.review, testimonialRating: testimonial.rating })
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    requestAnimationFrame(() => form.setFocus('name'))
  }

  const onSubmit = async (values) => {
    if (list.dirty) {
      showToast('warning', 'Save or discard the new order first.')
      return
    }
    setSubmitting(true)
    try {
      const isEdit = Boolean(editingId)
      const { data } = isEdit
        ? await axios.put('/api/testimonial/update', { _id: editingId, ...values })
        : await axios.post('/api/testimonial', values)
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      resetForm()
      await load()
    } catch (error) {
      showToast('error', errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (testimonial) => {
    setBusyId(testimonial._id)
    try {
      const { data } = await axios.put('/api/testimonial/update', { _id: testimonial._id, isActive: !testimonial.isActive })
      if (!data.success) throw new Error(data.message)
      list.setItems((prev) => prev.map((t) => (t._id === testimonial._id ? { ...t, isActive: !t.isActive } : t)))
      showToast('success', testimonial.isActive ? 'Hidden from the storefront.' : 'Now live on the storefront.')
    } catch (error) {
      showToast('error', errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    const target = pendingDelete
    if (!target) return
    setBusyId(target._id)
    try {
      const { data } = await axios.delete('/api/testimonial', { data: { ids: [target._id] } })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      if (editingId === target._id) resetForm()
      setPendingDelete(null)
      await load()
    } catch (error) {
      showToast('error', errorMessage(error))
    } finally {
      setBusyId(null)
    }
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const { data } = await axios.put('/api/testimonial', { order: items.map((t) => t._id) })
      if (!data.success) throw new Error(data.message)
      list.markSaved()
      showToast('success', data.message)
    } catch (error) {
      showToast('error', errorMessage(error))
    } finally {
      setSavingOrder(false)
    }
  }

  const reviewLength = watchReview?.length || 0
  const canReorder = filter === 'all'

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader
        title="Testimonials"
        description='Curate the customer quotes in the homepage "What They Say" section.'
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Live', value: stats.live, tone: 'text-[var(--success)]' },
          { label: 'Hidden', value: stats.hidden },
          { label: 'Average rating', value: stats.total ? stats.avg.toFixed(1) : '—', extra: <Stars value={Math.round(stats.avg)} /> },
        ].map(({ label, value, tone, extra }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className={cn('font-header text-2xl font-semibold tabular-nums', tone)}>{status === 'loading' ? '–' : value}</p>
              {status !== 'loading' && extra}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] xl:gap-6">
        {/* Composer */}
        <section ref={composerRef} className="scroll-mt-24 rounded-xl border bg-card p-4 sm:p-5 xl:sticky xl:top-20" aria-labelledby="composer-title">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 id="composer-title" className="text-base font-semibold">{editingId ? 'Edit testimonial' : 'New testimonial'}</h3>
              <p className="text-sm text-muted-foreground">{editingId ? 'Update the quote, then save.' : 'Add a customer quote to feature on the storefront.'}</p>
            </div>
            {editingId && (
              <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ef-tone--sun">Editing</span>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <input type="text" placeholder="e.g. Sophia Patel" maxLength={50} autoComplete="off" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive" {...field} />
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
              <FormField
                control={form.control}
                name="review"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-baseline justify-between">
                      <FormLabel>Quote</FormLabel>
                      <span className={cn('text-xs tabular-nums', reviewLength > REVIEW_SOFT_MAX ? 'text-[var(--brand-amber-ink)]' : 'text-muted-foreground')}>
                        {reviewLength}{reviewLength > REVIEW_SOFT_MAX ? ' · long quotes are trimmed on the card' : ''}
                      </span>
                    </div>
                    <FormControl>
                      <textarea rows={4} placeholder="What did the customer say about their experience?" className="min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LivePreview name={watchName} review={watchReview} rating={Number(watchRating) || 0} />

              <div className="flex items-center gap-2">
                <Button type="submit" className="h-10 flex-1 gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                  {editingId ? 'Save changes' : 'Add testimonial'}
                </Button>
                {(editingId || form.formState.isDirty) && (
                  <Button type="button" variant="outline" className="h-10 gap-1.5" onClick={resetForm} disabled={submitting}>
                    <X className="size-4" /> {editingId ? 'Cancel' : 'Clear'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </section>

        {/* List */}
        <section className="overflow-hidden rounded-xl border bg-card" aria-labelledby="list-title">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 id="list-title" className="text-base font-semibold">Current testimonials</h3>
              <p className="text-sm text-muted-foreground">
                {canReorder ? 'Drag or use the arrows to reorder. Hidden quotes are skipped on the storefront.' : 'Switch to “All” to reorder.'}
              </p>
            </div>
            <div className="flex shrink-0 rounded-lg bg-muted p-1" role="tablist" aria-label="Filter testimonials">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition', filter === f.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                >
                  {f.label}
                  <span className="ml-1.5 text-xs tabular-nums opacity-70">{f.id === 'all' ? stats.total : f.id === 'live' ? stats.live : stats.hidden}</span>
                </button>
              ))}
            </div>
          </div>

          {status === 'loading' ? (
            <ul className="flex flex-col gap-2 p-4" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}
            </ul>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
              <p className="mt-3 font-medium">Couldn’t load testimonials</p>
              <Button variant="outline" className="mt-4 h-9 gap-2 px-4" onClick={() => { setStatus('loading'); load() }}><RotateCcw className="size-4" /> Retry</Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Quote className="size-5" aria-hidden="true" /></span>
              <p className="mt-4 font-medium">
                {items.length === 0 ? 'No testimonials yet' : filter === 'live' ? 'No live testimonials' : 'No hidden testimonials'}
              </p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {items.length === 0 ? 'Add one on the left. Until then the storefront shows a default set so the section is never empty.' : 'Try another filter.'}
              </p>
            </div>
          ) : (
            <ol className="flex flex-col gap-2 p-3 sm:p-4">
              {visible.map(({ t, index }) => (
                <li
                  key={t._id}
                  {...list.dragProps(index, canReorder)}
                  className={cn(
                    'group flex items-start gap-3 rounded-lg border bg-card p-3 transition',
                    'data-[dragging]:opacity-40 data-[over]:border-primary data-[over]:shadow-[0_-2px_0_var(--primary)]',
                    editingId === t._id && 'border-primary shadow-[0_0_0_1px_var(--primary)]',
                    !t.isActive && 'bg-muted/40'
                  )}
                >
                  {canReorder && <GripVertical className="mt-2 size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing max-sm:hidden" aria-hidden="true" />}
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">{initialsOf(t.name)}</span>
                  <div className={cn('min-w-0 flex-1', !t.isActive && 'opacity-60')}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-semibold">{t.name}</p>
                      <Stars value={t.rating} size="size-3" />
                      {t.isActive
                        ? <span className="rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium ef-tone--forest">Live · #{index + 1}</span>
                        : <span className="rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium ef-tone--pine">Hidden</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{t.review}”</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
                    {canReorder && (
                      <>
                        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === 0} onClick={() => list.move(index, -1)} aria-label={`Move ${t.name} up`}><ArrowUp className="size-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={index === items.length - 1} onClick={() => list.move(index, 1)} aria-label={`Move ${t.name} down`}><ArrowDown className="size-4" /></Button>
                      </>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="size-8" disabled={busyId === t._id} onClick={() => toggleActive(t)} aria-label={t.isActive ? `Hide ${t.name}` : `Publish ${t.name}`} title={t.isActive ? 'Hide from storefront' : 'Show on storefront'}>
                      {busyId === t._id ? <Loader2 className="size-4 animate-spin" /> : t.isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => startEdit(t)} aria-label={`Edit ${t.name}`} title="Edit">
                      <Pencil className="size-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={busyId === t._id} onClick={() => setPendingDelete(t)} aria-label={`Delete ${t.name}`} title="Delete">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <UnsavedOrderBar visible={list.dirty} saving={savingOrder} onSave={handleSaveOrder} onDiscard={list.discard} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
        title={`Delete ${pendingDelete?.name || 'this'}’s testimonial?`}
        description="It is removed from the storefront and this list. To keep it for later, hide it instead."
        confirmLabel="Delete"
        loading={Boolean(pendingDelete) && busyId === pendingDelete?._id}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default ShowTestimonials
