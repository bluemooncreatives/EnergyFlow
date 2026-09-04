'use client'

import { useState, useRef } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Plus } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const FAQS = [
    {
        q: 'How long does it take to process an order?',
        a: 'Since every piece is made-to-order, it typically takes 7–14 days to carefully stitch and dispatch your outfit. This ensures each garment receives the time and attention it deserves.',
    },
    {
        q: 'Can I wear these outfits for daily use or only occasions?',
        a: 'Our designs are crafted to be truly versatile — refined enough for small festive gatherings yet comfortable enough for everyday elegance. One wardrobe, many moments.',
    },
    {
        q: 'What if the outfit doesn\'t fit well?',
        a: 'We put great care into getting the fit right, but if something feels off, simply reach out to us. We\'ll guide you through possible alterations or find the best solution for you.',
    },
    {
        q: 'How should I care for my outfit?',
        a: 'To preserve the fabric quality and stitching, we recommend a gentle hand wash or dry clean. Treating each piece with care ensures it stays beautiful for years to come.',
    },
    {
        q: 'Do you accept returns or exchanges?',
        a: 'As most pieces are made-to-order, we offer limited exchange options. Please review our return policy for full details, or reach out to us — we\'re happy to help find a resolution.',
    },
    {
        q: 'What fabrics do you use?',
        a: 'We carefully source fabrics that are breathable, comfortable, and suited for Indian weather — without compromising on the elegant ethnic aesthetic that defines Energyflow.',
    },
    {
        q: 'Do you offer customization?',
        a: 'Yes, we welcome minor customizations such as sleeve length, neckline adjustments, and fit preferences. Simply mention your requirements while placing the order and we\'ll do our best.',
    },
    {
        q: 'How do I choose the right size?',
        a: 'We provide a detailed size guide to help you find your fit. If you\'re unsure, feel free to share your measurements with us — we\'ll personally assist you in selecting the perfect size.',
    },
    {
        q: 'Are all outfits made to order?',
        a: 'Yes, every Energyflow piece is made-to-order with close attention to detail. This approach ensures a better fit, superior finish, and a quality that truly stands apart.',
    },
    {
        q: 'Can I place a bulk or group order?',
        a: 'Absolutely. We happily take bulk orders for small functions or coordinated group outfits. Reach out to us with your requirements and we\'ll take care of the rest.',
    },
    {
        q: 'Can I make changes after placing the order?',
        a: 'If your order hasn\'t entered production yet, we\'ll do our best to accommodate your request. Please contact us as early as possible so we can act in time.',
    },
    {
        q: 'Are your outfits suitable for all age groups?',
        a: 'Yes — our designs are timeless, comfortable, and thoughtfully crafted to be worn and loved across different age groups, from young adults to elders.',
    },
    {
        q: 'Do you restock designs?',
        a: 'Since most pieces are made-to-order, traditional restocks aren\'t our usual practice. However, you\'re welcome to reach out and we\'ll let you know what\'s possible.',
    },
]

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
                    Returns · Shipping · Orders
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
    )
}

export default FAQSection
