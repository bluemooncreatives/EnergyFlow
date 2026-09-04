import dynamic from 'next/dynamic'
import { getTestimonials } from '@/lib/services/testimonialService'

const TestimonialClient = dynamic(() => import('./TestimonialClient'))

// Fallback shown only when the admin has not added (or has hidden all)
// testimonials. Keeping a default set means the homepage "What They Say"
// section never collapses to an empty gap — the moment the admin adds real
// testimonials in the panel, these are replaced automatically.
const DEFAULT_TESTIMONIALS = [
    { name: 'Sophia Patel', review: "This product exceeded my expectations. The quality is top-notch and it arrived much faster than I anticipated. I will definitely be recommending it to my friends and family.", rating: 5 },
    { name: 'James Thompson', review: "Customer service was extremely helpful and responsive. They guided me through every step of the process. I'm very satisfied with the support I received.", rating: 4 },
    { name: 'Emily Chen', review: "I've been using this service for over a month now and it's been amazing. The user interface is intuitive and everything runs smoothly. I haven't faced any major issues so far.", rating: 5 },
    { name: 'Liam Rodriguez', review: "Honestly, I was skeptical at first, but it turned out great. The features offered are well worth the price. There is room for improvement, but overall I'm happy with it.", rating: 4 },
    { name: 'Ava Johnson', review: 'The attention to detail is impressive. From packaging to performance, everything was handled professionally. I feel like I got great value for my money.', rating: 5 },
    { name: 'Noah Davis', review: "There were a few hiccups during setup, but the documentation helped a lot. Once everything was in place, it worked flawlessly. I'm a satisfied customer now.", rating: 4 },
    { name: 'Isabella Martinez', review: 'What stood out the most was how easy it was to get started. The onboarding process is smooth and well thought out. I appreciated the thoughtful design.', rating: 5 },
    { name: 'William Lee', review: "It does what it promises, no complaints there. The pricing is fair and the customer experience is excellent. I'll be coming back for future purchases.", rating: 4 },
    { name: 'Mia Anderson', review: 'I encountered a few bugs in the beginning, but support helped fix them quickly. Now everything works perfectly. The team really listens to feedback.', rating: 4 },
    { name: 'Ethan Clark', review: 'This has been one of the best investments I\'ve made recently. The performance is consistent and it integrates seamlessly with my workflow. Highly recommended!', rating: 5 },
]

const Testimonial = async () => {
    let testimonials = []
    try {
        testimonials = await getTestimonials()
    } catch {
        // A transient DB error must not take down the homepage — fall back below.
        testimonials = []
    }

    const items = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS

    return <TestimonialClient testimonials={items} />
}

export default Testimonial
