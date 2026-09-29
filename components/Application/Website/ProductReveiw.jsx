'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2, MessageSquareQuote, PenLine, RotateCcw, Star, X } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import ReviewList from './ReviewList'

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
const TITLE_MAX = 120
const REVIEW_MAX = 2000

const reviewSchema = z.object({
    product: z.string().min(1),
    rating: z.number({ invalid_type_error: 'Please choose a star rating.' }).int().min(1, 'Please choose a star rating.').max(5),
    title: z.string().trim().min(3, 'Add a short title (at least 3 characters).').max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters.`),
    review: z.string().trim().min(10, 'Tell us a little more (at least 10 characters).').max(REVIEW_MAX, `Keep it under ${REVIEW_MAX} characters.`),
})

// Star picker as a radio group: hover previews, arrow keys change, the
// chosen value is announced with its word ("4 — Very good").
const StarPicker = ({ value = 0, onChange, invalid }) => {
    const [hover, setHover] = useState(0)
    const shown = hover || value
    const name = useId()

    const onKeyDown = (e) => {
        const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
        if (!delta) return
        e.preventDefault()
        const next = Math.min(5, Math.max(1, (value || 0) + delta))
        onChange(next)
        e.currentTarget.querySelector(`[data-star="${next}"]`)?.focus()
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            <div role="radiogroup" aria-label="Your rating" aria-invalid={invalid || undefined} onKeyDown={onKeyDown} onMouseLeave={() => setHover(0)} className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const checked = value === star
                    return (
                        <button
                            key={star}
                            type="button"
                            role="radio"
                            name={name}
                            data-star={star}
                            aria-checked={checked}
                            aria-label={`${star} star${star > 1 ? 's' : ''} — ${RATING_WORDS[star]}`}
                            tabIndex={checked || (!value && star === 1) ? 0 : -1}
                            onClick={() => onChange(star)}
                            onMouseEnter={() => setHover(star)}
                            className="ef-focus rounded-md p-0.5 transition-transform duration-200 hover:scale-115 active:scale-95"
                        >
                            <Star className={cn('size-8 transition-colors duration-200', star <= shown ? 'fill-gold text-gold' : 'text-ink-strong/25')} aria-hidden="true" />
                        </button>
                    )
                })}
            </div>
            <span className="min-w-[5.5rem] text-sm font-semibold text-ink-strong" aria-live="polite">
                {RATING_WORDS[shown] || <span className="font-normal text-ink-muted">Tap to rate</span>}
            </span>
        </div>
    )
}

const ReviewSkeleton = () => (
    <div className="rounded-[var(--radius-card)] bg-surface-card p-6 shadow-[inset_0_0_0_1px_var(--line-soft)]" aria-hidden="true">
        <div className="flex items-center gap-3">
            <span className="ef-pd-skel size-11 rounded-full" />
            <div className="flex-1 space-y-2">
                <span className="ef-pd-skel block h-3.5 w-32" />
                <span className="ef-pd-skel block h-3 w-20" />
            </div>
        </div>
        <span className="ef-pd-skel mt-5 block h-4 w-2/3" />
        <span className="ef-pd-skel mt-3 block h-3 w-full" />
        <span className="ef-pd-skel mt-2 block h-3 w-5/6" />
    </div>
)

const fetchSummary = async (productId) => {
    const { data } = await axios.get(`/api/review/details?productId=${productId}`)
    if (!data?.success) throw new Error(data?.message || 'Could not load ratings.')
    return data.data
}

const fetchPage = async (productId, page) => {
    const { data } = await axios.get(`/api/review/get?productId=${productId}&page=${page}`)
    if (!data?.success) throw new Error(data?.message || 'Could not load reviews.')
    return data.data
}

/**
 * Ratings & reviews: a sticky summary (average, distribution) beside the
 * review list, with an inline composer.
 *
 * States covered: loading (skeletons), failed (retry), no reviews (invite to
 * write the first), signed out (sign in and come back here), submitting,
 * paging with "Load more". After a successful post the summary, the list and
 * the server-rendered rating in the page header all refresh.
 */
const ProductReveiw = ({ productId, productName = 'this product' }) => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const auth = useSelector((store) => store.authStore.auth)
    const [composing, setComposing] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [returnUrl, setReturnUrl] = useState('')
    const summaryRef = useRef(null)
    const composerRef = useRef(null)

    useEffect(() => {
        setReturnUrl(`${window.location.pathname}${window.location.search}#reviews`)
    }, [])

    const summary = useQuery({
        queryKey: ['product-review-summary', productId],
        queryFn: () => fetchSummary(productId),
        enabled: Boolean(productId),
    })

    const list = useInfiniteQuery({
        queryKey: ['product-review', productId],
        queryFn: ({ pageParam }) => fetchPage(productId, pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage?.nextPage ?? undefined,
        enabled: Boolean(productId),
    })

    // Fill the distribution bars once the summary is on screen.
    useEffect(() => {
        const el = summaryRef.current
        if (!el || !summary.data) return
        if (typeof IntersectionObserver === 'undefined') { el.setAttribute('data-meters-on', ''); return }
        const io = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.setAttribute('data-meters-on', '')
                io.disconnect()
            }
        }, { threshold: 0.3 })
        io.observe(el)
        return () => io.disconnect()
    }, [summary.data])

    const form = useForm({
        resolver: zodResolver(reviewSchema),
        defaultValues: { product: productId, rating: 0, title: '', review: '' },
    })

    const openComposer = () => {
        setComposing(true)
        requestAnimationFrame(() => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }

    const closeComposer = () => {
        setComposing(false)
        form.reset({ product: productId, rating: 0, title: '', review: '' })
    }

    const onSubmit = async (values) => {
        setSubmitting(true)
        try {
            const { data } = await axios.post('/api/review/create', values)
            if (!data?.success) throw new Error(data?.message)
            showToast('success', data.message || 'Thanks for your review!')
            closeComposer()
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['product-review', productId] }),
                queryClient.invalidateQueries({ queryKey: ['product-review-summary', productId] }),
            ])
            // The header rating and structured data are server-rendered.
            router.refresh()
        } catch (error) {
            const message = error?.response?.data?.message || error?.message
            showToast('error', message || 'Could not post your review. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const total = Number(summary.data?.totalReview) || 0
    const average = Number(summary.data?.averageRating) || 0
    const reviews = list.data?.pages?.flatMap((page) => page?.reviews || []) || []
    const listTotal = Number(list.data?.pages?.[0]?.totalReview) || 0
    const titleLen = form.watch('title')?.length || 0
    const reviewLen = form.watch('review')?.length || 0

    return (
        <section aria-labelledby="reviews-title" className="ef-container">
            <div className="mb-[var(--section-gap)] flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col items-start gap-4">
                    <span className="ef-eyebrow">What shoppers say</span>
                    <h2 id="reviews-title" className="ef-title ef-title--md">
                        Ratings &amp; <span className="ef-title__accent">reviews</span>
                    </h2>
                </div>
                {!composing && (
                    <button type="button" onClick={openComposer} className="ef-cta self-start md:self-auto">
                        Write a review
                        <span className="ef-cta__box"><PenLine aria-hidden="true" /></span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
                {/* Summary */}
                <aside ref={summaryRef} className="rounded-[var(--radius-tile)] bg-surface-inverse p-6 text-[var(--ink-on-inverse)] lg:sticky lg:top-28 lg:p-8" style={{ backgroundImage: 'var(--brand-panel-gradient)' }}>
                    {summary.isError ? (
                        <div className="flex flex-col items-start gap-3">
                            <AlertCircle className="size-6 text-amber" aria-hidden="true" />
                            <p className="text-sm">We couldn’t load the ratings.</p>
                            <button type="button" onClick={() => summary.refetch()} className="ef-link text-[var(--palette-cream)]">
                                <RotateCcw aria-hidden="true" /> Try again
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-end gap-3">
                                <span className="font-header text-[5rem] font-semibold leading-[0.8] tabular-nums">
                                    {summary.isPending || total === 0 ? '—' : average.toFixed(1)}
                                </span>
                                <span className="pb-1 text-sm text-[var(--ink-on-inverse-muted)]">out of 5</span>
                            </div>
                            <div className="mt-4 flex items-center gap-1" aria-hidden="true">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn('size-5', i < Math.round(average) ? 'fill-amber text-amber' : 'text-[rgb(247_243_232/0.3)]')} />
                                ))}
                            </div>
                            <p className="mt-2 text-sm text-[var(--ink-on-inverse-muted)]">
                                {summary.isPending ? 'Loading ratings…' : total > 0 ? `Based on ${total} ${total === 1 ? 'review' : 'reviews'}` : 'No ratings yet'}
                            </p>

                            <ul className="mt-6 space-y-2.5" aria-label="Rating breakdown">
                                {[5, 4, 3, 2, 1].map((star, i) => {
                                    const count = Number(summary.data?.rating?.[star]) || 0
                                    const pct = Math.max(0, Math.min(100, Number(summary.data?.percentage?.[star]) || 0))
                                    return (
                                        <li key={star} className="flex items-center gap-3 text-sm">
                                            <span className="flex w-7 shrink-0 items-center gap-1 tabular-nums">
                                                {star}<Star className="size-3 fill-current" aria-hidden="true" />
                                            </span>
                                            <span className="ef-pd-meter bg-[rgb(247_243_232/0.14)]" aria-hidden="true">
                                                <span style={{ '--w': `${pct}%`, '--i': i }} className="!bg-amber" />
                                            </span>
                                            <span className="w-7 shrink-0 text-right tabular-nums text-[var(--ink-on-inverse-muted)]">
                                                {count}
                                            </span>
                                            <span className="sr-only">{`${star} star: ${count} ${count === 1 ? 'review' : 'reviews'}`}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </>
                    )}
                </aside>

                {/* Composer + list */}
                <div className="min-w-0">
                    <div
                        className={cn('grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-spring)]', composing ? 'mb-6 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}
                        aria-hidden={!composing}
                        inert={!composing || undefined}
                    >
                        <div className="overflow-hidden">
                            <div ref={composerRef} className="rounded-[var(--radius-tile)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)] sm:p-7">
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-header text-xl font-semibold uppercase text-ink-strong">Write a review</h3>
                                        <p className="mt-1 text-sm text-ink-muted">How was {productName}? Your words help other shoppers.</p>
                                    </div>
                                    <button type="button" onClick={closeComposer} aria-label="Close review form" className="ef-icon-btn size-10">
                                        <X aria-hidden="true" />
                                    </button>
                                </div>

                                {!auth ? (
                                    <div className="flex flex-col items-start gap-4 rounded-[var(--radius-card)] bg-surface-sunken p-5">
                                        <p className="text-sm text-ink-body">Sign in to share your experience — we’ll bring you right back here.</p>
                                        <Link
                                            href={`${WEBSITE_LOGIN}?callback=${encodeURIComponent(returnUrl || '/')}`}
                                            className="ef-btn ef-btn--primary"
                                        >
                                            Sign in to review
                                        </Link>
                                    </div>
                                ) : (
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
                                            <FormField
                                                control={form.control}
                                                name="rating"
                                                render={({ field, fieldState }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-semibold text-ink-strong">Your rating</FormLabel>
                                                        <FormControl>
                                                            <StarPicker value={field.value} onChange={field.onChange} invalid={Boolean(fieldState.error)} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex items-baseline justify-between">
                                                            <FormLabel className="text-sm font-semibold text-ink-strong">Title</FormLabel>
                                                            <span className={cn('text-xs tabular-nums', titleLen > TITLE_MAX ? 'text-destructive' : 'text-ink-muted')}>{titleLen}/{TITLE_MAX}</span>
                                                        </div>
                                                        <FormControl>
                                                            <input type="text" placeholder="Sum it up in a few words" className="form-field" autoComplete="off" {...field} />
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
                                                            <FormLabel className="text-sm font-semibold text-ink-strong">Review</FormLabel>
                                                            <span className={cn('text-xs tabular-nums', reviewLen > REVIEW_MAX ? 'text-destructive' : 'text-ink-muted')}>{reviewLen}/{REVIEW_MAX}</span>
                                                        </div>
                                                        <FormControl>
                                                            <textarea placeholder="Taste, freshness, packaging — what stood out?" className="form-field form-field-area min-h-32" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                                                <button type="submit" disabled={submitting} className="ef-btn ef-btn--primary sm:px-8">
                                                    {submitting ? <><Loader2 className="animate-spin" aria-hidden="true" /> Posting…</> : 'Post review'}
                                                </button>
                                                <button type="button" onClick={closeComposer} className="ef-btn ef-btn--outline">Cancel</button>
                                            </div>
                                        </form>
                                    </Form>
                                )}
                            </div>
                        </div>
                    </div>

                    {list.isPending ? (
                        <div className="grid gap-4" aria-busy="true" aria-label="Loading reviews">
                            <ReviewSkeleton />
                            <ReviewSkeleton />
                        </div>
                    ) : list.isError ? (
                        <div className="flex flex-col items-start gap-3 rounded-[var(--radius-tile)] bg-surface-sunken p-6">
                            <p className="text-sm text-ink-body">We couldn’t load reviews right now.</p>
                            <button type="button" onClick={() => list.refetch()} className="ef-btn ef-btn--outline ef-btn--sm">
                                <RotateCcw aria-hidden="true" /> Try again
                            </button>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center rounded-[var(--radius-tile)] border border-dashed border-line-strong px-6 py-12 text-center">
                            <span className="ef-seal ef-seal--sun size-16" aria-hidden="true"><MessageSquareQuote /></span>
                            <p className="mt-5 font-header text-xl font-semibold uppercase text-ink-strong">No reviews yet</p>
                            <p className="mt-2 max-w-sm text-sm text-ink-muted">Tried {productName}? Be the first to tell other shoppers what you thought.</p>
                            {!composing && (
                                <button type="button" onClick={openComposer} className="ef-btn ef-btn--primary mt-6">
                                    <PenLine aria-hidden="true" /> Write the first review
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-ink-muted">
                                Showing {reviews.length} of {listTotal} {listTotal === 1 ? 'review' : 'reviews'} · newest first
                            </p>
                            <div className="grid gap-4">
                                {reviews.map((review) => (
                                    <ReviewList key={review._id} review={review} />
                                ))}
                            </div>
                            {list.hasNextPage && (
                                <button
                                    type="button"
                                    onClick={() => list.fetchNextPage()}
                                    disabled={list.isFetchingNextPage}
                                    className="ef-btn ef-btn--outline mt-6 w-full sm:w-auto"
                                >
                                    {list.isFetchingNextPage ? <><Loader2 className="animate-spin" aria-hidden="true" /> Loading…</> : 'Load more reviews'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}

export default ProductReveiw
