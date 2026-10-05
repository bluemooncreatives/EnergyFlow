'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Mail, MessageCircle, Phone, Plus } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { COMPANY } from '@/lib/company'
import Section from '../storefront/Section'
import { WHATSAPP_HREF, pad } from './GiftingUi'

const CONTACT_LINK = 'ef-focus inline-flex items-center gap-2.5 rounded-sm text-[0.9375rem] transition-colors hover:text-brand'

/**
 * "Questions, answered" — the category FAQs as an editorial list beside a
 * tall photo carrying the gifting team's direct lines.
 *
 * faqs  — [{ q, a }] from the category's catalogSeo entry
 * photo — a gift box photo URL for the panel
 */
const GiftingFaq = ({ faqs = [], photo }) => {
    const rootRef = useRef(null)
    useReveal(rootRef)
    if (!faqs.length) return null

    return (
        <Section ref={rootRef} tone="page" aria-labelledby="faq-title">
            <div className="grid gap-[clamp(1.75rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                <div className="ef-tile flex min-h-[22rem] flex-col justify-end bg-pine p-3 shadow-elev-2 sm:p-4 lg:sticky lg:top-28 lg:min-h-[34rem]" data-reveal>
                    {photo && <Image src={photo} alt="" fill sizes="(max-width: 1024px) 92vw, 40vw" className="-z-20 object-cover" />}
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/75 to-transparent" />
                    <div className="ef-card gap-3 p-5 shadow-elev-2">
                        <p className="font-header text-[1.375rem] font-semibold uppercase leading-none text-ink-strong">Rather talk it through?</p>
                        <p className="text-[0.875rem] leading-relaxed text-ink-body">Our gifting team is a call or a message away.</p>
                        <div className="flex flex-col gap-2 text-ink-strong">
                            <a href={COMPANY.phoneHref} className={CONTACT_LINK}><Phone className="size-4" aria-hidden="true" /> {COMPANY.phone}</a>
                            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK}><MessageCircle className="size-4" aria-hidden="true" /> WhatsApp us</a>
                            <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Corporate gifting enquiry')}`} className={`${CONTACT_LINK} break-all`}>
                                <Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}
                            </a>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-[var(--section-gap)] flex flex-col items-start gap-4" data-reveal>
                        <span className="ef-eyebrow">Good to know</span>
                        <h2 id="faq-title" className="ef-title">Questions, <span className="ef-title__accent">answered</span></h2>
                    </div>
                    <div className="border-b border-line-strong">
                        {faqs.map(({ q, a }, i) => (
                            <details key={q} className="group border-t border-line-strong" data-reveal>
                                <summary className="ef-focus flex cursor-pointer list-none items-center gap-4 rounded-sm py-5 [&::-webkit-details-marker]:hidden">
                                    <span className="w-8 shrink-0 text-[0.75rem] font-semibold tabular-nums text-ink-muted" aria-hidden="true">{pad(i + 1)}</span>
                                    <h3 className="flex-1 text-[clamp(1.0625rem,0.95rem+0.5vw,1.375rem)] font-medium leading-snug text-ink-strong">{q}</h3>
                                    <span className="ef-icon-btn transition-transform duration-300 group-open:rotate-45 group-open:border-brand group-open:bg-brand group-open:text-on-brand" aria-hidden="true">
                                        <Plus />
                                    </span>
                                </summary>
                                <p className="max-w-2xl pb-6 pl-12 pr-2 text-[0.9375rem] leading-[1.75] text-ink-body sm:pr-16">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    )
}

export default GiftingFaq
