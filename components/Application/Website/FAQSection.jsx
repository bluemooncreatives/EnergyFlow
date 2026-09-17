'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Plus } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const FAQS = [
    {
        q: 'How fresh are your dry fruits and nuts?',
        a: 'We buy in small, frequent lots rather than sitting on large stock, so what reaches you is from a recent batch. Every pack is sealed to lock in crunch and aroma, and the packed and best before dates are printed clearly, so you always know what you are getting.',
    },
    {
        q: 'How long does delivery take?',
        a: 'Orders are packed within 24 to 48 hours of confirmation. Delivery usually takes 2 to 4 working days in metros and 4 to 7 working days elsewhere in India. You will get a tracking link by email as soon as your parcel is dispatched.',
    },
    {
        q: 'How should I store dry fruits, seeds and super foods?',
        a: 'Keep them in an airtight container away from heat, moisture and direct sunlight. Nuts and seeds with a higher oil content, such as walnuts, flax, chia and pine nuts, stay freshest in the fridge, especially through humid months.',
    },
    {
        q: 'What is A2 Gir cow bilona ghee, and why is it different?',
        a: 'It is made the traditional bilona way. Curd from A2 Gir cow milk is churned by hand into butter, then simmered slowly into ghee. The method takes longer and yields less than the usual process that starts from cream, and that is exactly what gives this ghee its grainy texture, deep aroma and nutrient profile.',
    },
    {
        q: 'Are your oils really cold pressed?',
        a: 'Yes. Our oils are extracted at low temperature in a wood or expeller press, with no chemical refining, bleaching or deodorising. That keeps the natural aroma, colour and nutrients intact, which is why cold pressed oil tastes and smells nothing like refined oil.',
    },
    {
        q: 'Do you offer organic products?',
        a: 'Several products in our range are organic and are labelled as such on the product page. We do not describe anything as organic unless it is backed by the supplier documentation, so if the label does not say it, the product is conventionally grown.',
    },
    {
        q: 'Do you take corporate and festive gifting orders?',
        a: 'Yes, and it is one of the things we do best. We put together dry fruit and super food hampers for Diwali, New Year, weddings and employee gifting, with options for custom combinations, budgets and branded packaging. Tell us your requirement and quantity and we will share a proposal.',
    },
    {
        q: 'Can I place a bulk order?',
        a: 'Absolutely. We supply bulk quantities to households, offices, retailers and institutional buyers at volume pricing. Contact us with the products and quantities you need and we will confirm availability and rates.',
    },
    {
        q: 'What pack sizes are available?',
        a: 'Most products come in a range of weights, from small trial packs to value family packs and bulk sizes. You can pick the pack size you want on each product page, with the price per pack shown before you add to cart.',
    },
    {
        q: 'Are your products tested for quality?',
        a: 'Every lot is checked on intake for grade, moisture, foreign matter and freshness before it is packed. We work only with suppliers who meet our sourcing standards, and anything that fails a check does not make it to the shelf.',
    },
    {
        q: 'Do you have a physical store I can visit?',
        a: 'Yes. Our first Energyflow Dry Fruits and Super Food Store is open, and we are expanding into a wider retail and franchise network across India. Get in touch for current store details or franchise enquiries.',
    },
    {
        q: 'What is your return policy?',
        a: 'If a product arrives damaged, sealed incorrectly, or is not what you ordered, tell us within 7 days of delivery and we will replace it or refund you. As these are food products, we cannot accept returns on packs that have been opened, unless there is a genuine quality issue.',
    },
    {
        q: 'Do you deliver across India?',
        a: 'Yes, we ship to serviceable pin codes across India. Enter your pin code at checkout to confirm delivery and see the expected timeline for your address.',
    },
]

// FAQPage structured data built from the same array the UI renders, so the
// markup and the rich result can never fall out of sync.
const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
}

const FAQItem = ({ faq, isOpen, onToggle }) => (
    <div className="border-b border-foreground/10">
        <button
            onClick={onToggle}
            aria-expanded={isOpen}
            className="flex w-full items-center justify-between gap-6 py-5 text-left"
        >
            <span className="font-neue text-[0.95rem] font-semibold uppercase tracking-[0.03em] text-[var(--dark-red-2)] lg:text-[1rem]">
                {faq.q}
            </span>
            <Plus
                className="size-4 flex-shrink-0 text-[var(--dark-red)] transition-transform duration-300"
                style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
            />
        </button>

        {/* grid-rows trick — no fixed max-height, no JS measurement */}
        <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
        >
            <div className="overflow-hidden">
                <p className="pb-5 pr-8 text-[0.84rem] leading-relaxed text-[var(--text-body)]">
                    {faq.a}
                </p>
            </div>
        </div>
    </div>
)

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null)
    const sectionRef = useRef(null)
    const headerRef = useRef(null)
    const ruleRef = useRef(null)
    const itemRefs = useRef([])

    const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i))

    useGSAP(() => {
        gsap.fromTo(
            headerRef.current,
            { autoAlpha: 0, y: 40 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.9,
                ease: 'power4.out',
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )

        gsap.fromTo(
            ruleRef.current,
            { scaleX: 0, transformOrigin: 'left center' },
            {
                scaleX: 1,
                duration: 1.2,
                ease: 'expo.inOut',
                delay: 0.12,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
            }
        )

        gsap.fromTo(
            itemRefs.current,
            { autoAlpha: 0, y: 50, scale: 0.97 },
            {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: 0.95,
                ease: 'power4.out',
                stagger: 0.1,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
            }
        )
    }, { scope: sectionRef })

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <section ref={sectionRef} className="website-gutter bg-background pt-[clamp(1.25rem,2.5vw,2rem)] pb-[clamp(2rem,4vw,3.5rem)]">

            {/* section header */}
            <div ref={headerRef} className="mb-4 flex items-end justify-between lg:mb-6">
                <div>
                    <p className="text-[1rem] font-semibold uppercase text-[var(--dark-red)]/60">
                        Got Questions?
                    </p>
                    <h2 className="mt-1.5 font-neue text-[clamp(1.8rem,4.8vw,3.8rem)] font-medium uppercase text-[var(--dark-red-2)]">
                        Frequently Asked
                    </h2>
                </div>
                <span className="hidden text-[0.68rem] font-semibold uppercase text-muted-foreground sm:block">
                    Freshness · Shipping · Gifting
                </span>
            </div>

            {/* animated rule */}
            <div ref={ruleRef} className="mb-10 h-px w-full bg-foreground/10 lg:mb-14" />

            {/* two-column grid on desktop */}
            <div className="grid gap-x-16 lg:grid-cols-2">
                {FAQS.map((faq, i) => (
                    <div
                        key={i}
                        ref={(el) => { itemRefs.current[i] = el }}
                    >
                        <FAQItem
                            faq={faq}
                            isOpen={openIndex === i}
                            onToggle={() => toggle(i)}
                        />
                    </div>
                ))}
            </div>

            {/* bottom hint */}
            <p className="mt-10 text-center text-[0.78rem] text-muted-foreground lg:mt-14">
                Still have a question?{' '}
                <a
                    href="/contact"
                    className="font-semibold text-[var(--dark-red-2)] underline underline-offset-2 transition-opacity hover:opacity-70"
                >
                    Contact our team
                </a>
            </p>
            </section>
        </>
    )
}

export default FAQSection
