import dynamic from 'next/dynamic'
import { getTestimonials } from '@/lib/services/testimonialService'

const TestimonialClient = dynamic(() => import('./TestimonialClient'))

// Only real, admin-entered testimonials are shown. With none published the
// section drops out of the homepage (like the bestseller and deal rails)
// rather than filling the gap with invented reviews.
const Testimonial = async ({ tone }) => {
    let testimonials = []
    try {
        testimonials = await getTestimonials()
    } catch {
        // A transient DB error must not take down the homepage.
        testimonials = []
    }

    if (!testimonials || testimonials.length === 0) return null

    return <TestimonialClient testimonials={testimonials} tone={tone} />
}

export default Testimonial
