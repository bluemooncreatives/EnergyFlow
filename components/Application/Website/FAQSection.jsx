'use client'

import { useId, useRef, useState } from 'react'
import { MessageCircle, Plus } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import Section from './storefront/Section'
import StoreButton from './storefront/StoreButton'

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

const FAQItem = ({ faq, index, isOpen, onToggle, baseId }) => {
    const buttonId = `${baseId}-q${index}`
    const panelId = `${baseId}-a${index}`

    return (
        <div
            className={cn(
                'rounded-card bg-surface-card transition-shadow duration-300',
                isOpen ? 'shadow-elev-2' : 'shadow-[inset_0_0_0_1px_var(--line-soft)]'
            )}
        >
            <h3 className="m-0">
                <button
                    id={buttonId}
                    type="button"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="ef-focus flex w-full items-center justify-between gap-5 rounded-card px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                    <span className="text-[0.9875rem] font-medium leading-snug text-ink-strong sm:text-[1.0625rem]">{faq.q}</span>
                    <span
                        aria-hidden="true"
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300',
                            isOpen ? 'bg-brand text-on-brand' : 'bg-surface-well text-brand'
                        )}
                    >
                        <Plus
                            className="size-4 transition-transform duration-300 motion-reduce:transition-none"
                            style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                        />
                    </span>
                </button>
            </h3>

            {/* grid-rows trick — no fixed max-height, no JS measurement. The
                answer stays in the DOM (hidden via `inert`) for crawlers. */}
            <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={!isOpen}
                className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 pr-14 text-[0.9375rem] leading-relaxed text-ink-body sm:px-6 sm:pb-6 sm:pr-16">
                        {faq.a}
                    </p>
                </div>
            </div>
        </div>
    )
}

const FAQSection = ({ tone = 'page' }) => {
    const [openIndex, setOpenIndex] = useState(0)
    const sectionRef = useRef(null)
    const baseId = useId()
    useReveal(sectionRef)

    const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i))

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <Section ref={sectionRef} tone={tone} id="faq" aria-labelledby="faq-title" className="scroll-mt-20">
                <div className="grid gap-[var(--section-gap)] lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">

                    <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
                        <div data-reveal className="flex flex-col items-start gap-4">
                            <span className="ef-eyebrow">Got questions?</span>
                            <h2 id="faq-title" className="ef-title">
                                Frequently <span className="ef-title__accent">asked</span>
                            </h2>
                            <p className="ef-lead">Freshness, shipping, storage and gifting: the things people ask us most.</p>
                        </div>

                        <div
                            data-reveal
                            className="ef-tile ef-on-inverse flex flex-col items-start gap-4 bg-surface-inverse p-6 text-white sm:p-7"
                            style={{ backgroundImage: 'var(--brand-panel-gradient)', borderRadius: 'var(--radius-card)' }}
                        >
                            <span className="flex size-11 items-center justify-center rounded-full bg-amber text-brand-deep">
                                <MessageCircle className="size-5" aria-hidden="true" />
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[1.25rem] font-medium tracking-[-0.01em]">Still have a question?</p>
                                <p className="text-[0.9375rem] leading-relaxed text-white/75">
                                    Bulk orders, gifting, store visits or anything else, our team will get back to you.
                                </p>
                            </div>
                            <StoreButton href="/contact" variant="light" size="sm" arrow>Contact our team</StoreButton>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {FAQS.map((faq, i) => (
                            <div key={faq.q} data-reveal>
                                <FAQItem
                                    faq={faq}
                                    index={i}
                                    baseId={baseId}
                                    isOpen={openIndex === i}
                                    onToggle={() => toggle(i)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Section>
        </>
    )
}

export default FAQSection
