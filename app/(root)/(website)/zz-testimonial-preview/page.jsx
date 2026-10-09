// TEMPORARY local preview — delete after verification.
import TestimonialClient from '@/components/Application/Website/TestimonialClient'

const SAMPLE = [
    { _id: 'a', name: 'Ananya Sharma', rating: 5, review: 'The Mamra almonds were plump and fresh, nothing like the dusty packs from the supermarket. Delivery reached Pune in two days and the pouch reseals properly.' },
    { _id: 'b', name: 'Rohit Verma', rating: 5, review: 'Ordered the festive gift box for my team. Every box arrived intact and people kept asking where it was from.' },
    { _id: 'c', name: 'Priya Nair', rating: 4, review: 'Roasted makhana is my evening snack now. Light, crunchy and not too salty.' },
    { _id: 'd', name: 'Karan Mehta', rating: 5, review: 'Kashmiri walnuts with full halves and no bitterness. Will reorder.' },
    { _id: 'e', name: 'Sneha Iyer', rating: 5, review: 'Good packaging, honest weights and quick support when I needed to change my address.' },
]

export default function Page() {
    return (
        <>
            <div style={{ height: '40vh' }} />
            <TestimonialClient testimonials={SAMPLE} tone="page" />
            <div style={{ height: '60vh' }} />
        </>
    )
}
