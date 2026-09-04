'use client'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { zSchema } from '@/lib/zodSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Star } from 'lucide-react'
import ButtonLoading from '../ButtonLoading'
import { useSelector } from 'react-redux'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import Link from 'next/link'
import { WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { showToast } from '@/lib/showToast'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import ReviewList from './ReviewList'
import useFetch from '@/hooks/useFetch'
import { BrandButton } from './BrandButton'

const StarRatingField = ({ value = 0, onChange }) => {
    return (
        <div className='flex items-center gap-1'>
            {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= Number(value || 0)
                return (
                    <button
                        key={star}
                        type='button'
                        onClick={() => onChange(star)}
                        className='text-2xl text-amber-500 transition-transform hover:scale-110'
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                        <Star className={`size-6 ${isFilled ? 'fill-amber-500 text-amber-500' : 'text-amber-500'}`} />
                    </button>
                )
            })}
        </div>
    )
}

const ProductReveiw = ({ productId }) => {
    const queryClient = useQueryClient()
    const auth = useSelector(store => store.authStore.auth)
    const [loading, setLoading] = useState(false)
    const [currentUrl, setCurrentUrl] = useState('')
    const [isReview, setIsReview] = useState(false)
    const [reviewCount, setReviewCount] = useState()

    const { data: reviewDetails, refetch: refetchReviewSummary } = useFetch(`/api/review/details?productId=${productId}`)

    useEffect(() => {
        if (reviewDetails && reviewDetails.success) {
            const reviewCountData = reviewDetails.data
            setReviewCount(reviewCountData)
        }
    }, [reviewDetails])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href)
        }
    }, [])

    const formSchema = zSchema.pick({
        product: true,
        userId: true,
        rating: true,
        title: true,
        review: true
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            product: productId,
            userId: auth?._id,
            rating: 0,
            title: "",
            review: "",
        },
    })


    useEffect(() => {
        form.setValue('userId', auth?._id)
    }, [auth])

    const handleReviewSubmit = async (values) => {
        setLoading(true)
        try {
            const { data: response } = await axios.post('/api/review/create', values)
            if (!response.success) {
                throw new Error(response.message)
            }

            form.reset()
            setIsReview(false)
            showToast('success', response.message)
            queryClient.invalidateQueries({ queryKey: ['product-review', productId] })
            // Refresh the rating summary (average + distribution bars) so the
            // shopper's freshly-posted review is reflected immediately.
            refetchReviewSummary()
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setLoading(false)
        }
    }


    const fetchReview = async (pageParam) => {
        const { data: getReviewData } = await axios.get(`/api/review/get?productId=${productId}&page=${pageParam}`)
        if (!getReviewData.success) {
            return
        }

        return getReviewData.data
    }


    const { error, data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ['product-review', productId],
        queryFn: async ({ pageParam }) => await fetchReview(pageParam),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            return lastPage.nextPage
        }
    })



    return (
        <div className="mb-20 rounded-[var(--admin-shell-radius)] border border-border/60 bg-background shadow-sm">
            <div className="border-b border-border/60 px-5 py-4 lg:px-6 lg:py-5">
                <p className="text-[0.95rem] font-semibold uppercase text-[var(--dark-red)]/60">
                    What Shoppers Say
                </p>
                <h2 className="mt-1 font-neue text-[clamp(1.4rem,2.6vw,2rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]">
                    Rating &amp; Reviews
                </h2>
            </div>
            <div className="p-5 lg:p-6">
                <div className='flex justify-between flex-wrap items-center'>
                    <div className='md:w-1/2 w-full md:flex md:gap-10 md:mb-0 mb-5'>
                        <div className='md:w-[200px] w-full md:mb-0 mb-5'>
                            <h4 className='text-center text-8xl font-semibold'>{reviewCount?.averageRating ?? '0.0'}</h4>
                            <div className='flex justify-center gap-1 text-[var(--dark-red)]'>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <Star
                                        key={index}
                                        className={`size-4 ${index < Math.round(Number(reviewCount?.averageRating || 0)) ? 'fill-[var(--dark-red)] text-[var(--dark-red)]' : 'text-foreground/25'}`}
                                    />
                                ))}
                            </div>

                            <p className='text-center mt-3 text-sm text-muted-foreground'>
                                ({reviewCount?.totalReview || 0} Rating &amp; Reviews)
                            </p>
                        </div>

                        <div className='md:w-[calc(100%-200px)] flex items-center'>
                            <div className='w-full'>

                                {[5, 4, 3, 2, 1].map(rating => (
                                    <div key={rating} className='flex items-center gap-2 mb-2'>
                                        <div className='flex items-center gap-1 text-[var(--dark-red)]'>
                                            <p className='w-3 text-foreground'>{rating}</p>
                                            <Star className="size-3 fill-[var(--dark-red)] text-[var(--dark-red)]" />
                                        </div>
                                        <Progress value={reviewCount?.percentage?.[rating] || 0} />
                                        <span className='w-6 text-sm text-muted-foreground'>{reviewCount?.rating?.[rating] || 0}</span>
                                    </div>
                                ))}



                            </div>
                        </div>

                    </div>

                    <div className='md:w-1/2 w-full md:text-end text-center'>
                        <Button onClick={() => setIsReview(!isReview)} type="button" variant="outline" className="md:w-fit w-full rounded-md border-border/70 py-6 px-10 font-semibold uppercase tracking-[0.18em]">
                            Write Review
                        </Button>
                    </div>
                </div>

                {isReview &&
                    <div className='my-6 rounded-[var(--radius)] border border-border/60 bg-muted/20 p-5 lg:p-6'>
                        <h4 className='mb-1 font-neue text-[clamp(1.2rem,2.2vw,1.6rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]'>Write A Review</h4>

                        {!auth
                            ?
                            <>
                                <p className='mb-4 text-sm text-muted-foreground'>You need to be logged in to share your experience with this product.</p>
                                <BrandButton asChild className='w-full sm:w-fit sm:px-10'>
                                    <Link href={`${WEBSITE_LOGIN}?callback=${currentUrl}`}>Login</Link>
                                </BrandButton>
                            </>
                            :
                            <>
                                <p className='mb-5 text-sm text-muted-foreground'>Share your thoughts to help other shoppers.</p>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleReviewSubmit)} >

                                        <div className='mb-5'>
                                            <FormField
                                                control={form.control}
                                                name="rating"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='mb-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>Your Rating</FormLabel>
                                                        <FormControl>
                                                            <StarRatingField value={field.value} onChange={field.onChange} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className='mb-5'>
                                            <FormField
                                                control={form.control}
                                                name="title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='mb-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>Title</FormLabel>
                                                        <FormControl>
                                                            <Input type="text" placeholder="Sum up your review" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className='mb-6'>
                                            <FormField
                                                control={form.control}
                                                name="review"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className='mb-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground'>Review</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Write your comment here..." className='min-h-28' {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <ButtonLoading loading={loading} type="submit" text="Submit Review" variant="brand" className="h-11 w-full cursor-pointer text-[11px] font-semibold uppercase tracking-[0.2em] sm:w-fit sm:px-10" />

                                    </form>
                                </Form>
                            </>
                        }
                    </div>
                }


                <div className='mt-10 border-t border-border/60 pt-5'>
                    <h5 className='font-neue text-[clamp(1.1rem,2vw,1.4rem)] font-medium uppercase leading-[1.1] text-[var(--dark-red-2)]'>{data?.pages[0]?.totalReview || 0} Reviews</h5>

                    <div className='mt-10'>
                        {(data?.pages?.[0]?.totalReview ?? 0) === 0 && !isFetching && (
                            <div className='rounded-md border border-dashed border-border/70 bg-muted/20 px-5 py-10 text-center'>
                                <Star className='mx-auto mb-3 size-7 text-foreground/25' />
                                <p className='font-semibold text-foreground'>No reviews yet</p>
                                <p className='mt-1 text-sm text-muted-foreground'>Be the first to share your thoughts on this product.</p>
                            </div>
                        )}

                        {data && data.pages.map(page => (
                            page.reviews.map(review => (
                                <div className='mb-5' key={review._id}>
                                    <ReviewList review={review} />
                                </div>
                            ))
                        ))}

                        {hasNextPage &&
                            <ButtonLoading text="Load More" type="button" loading={isFetching} onClick={fetchNextPage} variant="brand" className="h-10 text-[11px] font-semibold uppercase tracking-[0.2em]" />
                        }

                    </div>

                </div>



            </div>
        </div>
    )
}

export default ProductReveiw
