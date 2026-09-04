import { unstable_cache } from 'next/cache'
import { connectDB } from '@/lib/databaseConnection'
import TestimonialModel from '@/models/Testimonial.model'

export const TESTIMONIALS_TAG = 'storefront-testimonials'

const toPlainObject = (data) => JSON.parse(JSON.stringify(data))

const fetchTestimonials = async () => {
    await connectDB()

    const testimonials = await TestimonialModel.find({ deletedAt: null, isActive: true })
        .sort({ sortOrder: 1, createdAt: -1, _id: 1 })
        .select('name review rating')
        .lean()

    return toPlainObject(testimonials)
}

// Cached read for the storefront "What They Say" section. Invalidated by the
// admin testimonial routes via revalidateTag(TESTIMONIALS_TAG).
export const getTestimonials = unstable_cache(
    fetchTestimonials,
    [TESTIMONIALS_TAG],
    {
        revalidate: 300,
        tags: [TESTIMONIALS_TAG],
    }
)
