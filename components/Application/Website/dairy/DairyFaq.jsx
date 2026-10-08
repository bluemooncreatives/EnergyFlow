import { Mail, MessageCircle, Minus, Phone, Plus } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import { SectionTag, pad } from '../gifting/GiftingUi'
import { DAIRY_WHATSAPP_HREF } from './dairyContent'

const CONTACT_LINK = 'ef-focus inline-flex items-center gap-2.5 rounded-sm text-[0.875rem] text-ink-strong transition-colors hover:text-brand-bright'

/**
 * The dairy FAQ, in the gifting page's layout: headline and the direct
 * lines on the left (sticky on desktop), the questions as ruled rows with a
 * round +/− on the right, the first one open. Plain <details>, so it works
 * without JavaScript and the answers are in the HTML for the FAQ schema.
 */
const DairyFaq = ({ faqs = [], number }) => {
    if (!faqs.length) return null

    return (
        <section className="ef-section ef-section--sunken" aria-labelledby="dairy-faq-title">
            <div className="ef-container">
                <div className="mb-[var(--section-gap)] border-t border-line-strong pt-5 sm:pt-6">
                    <SectionTag number={number} eyebrow="Questions" />
                </div>

                <div className="grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="flex min-w-0 flex-col items-start gap-5 lg:sticky lg:top-28 lg:self-start">
                        <h2 id="dairy-faq-title" className="ef-title">
                            Dairy, <span className="ef-title__accent">answered.</span>
                        </h2>
                        <p className="ef-lead max-w-md">Still wondering about something? Our team is a call or a message away.</p>
                        <div className="flex w-full max-w-md flex-col gap-2.5 border-t border-line-strong pt-5">
                            <a href={COMPANY.phoneHref} className={CONTACT_LINK}><Phone className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.phone}</a>
                            <a href={DAIRY_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK}><MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp us</a>
                            <a href={`mailto:${COMPANY.email}`} className={`${CONTACT_LINK} break-all`}><Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}</a>
                        </div>
                    </div>

                    <div className="min-w-0 border-t border-line-strong">
                        {faqs.map(({ q, a }, i) => (
                            <details key={q} name="dairy-faq" open={i === 0} className="group border-b border-line-strong">
                                <summary className="ef-focus flex cursor-pointer list-none items-center gap-4 rounded-sm py-5 [&::-webkit-details-marker]:hidden">
                                    <span aria-hidden="true" className="w-7 shrink-0 text-[0.75rem] font-semibold tabular-nums text-ink-muted">{pad(i + 1)}</span>
                                    <h3 className="min-w-0 flex-1 font-header text-[clamp(1.0625rem,0.95rem+0.5vw,1.375rem)] font-medium leading-snug text-ink-strong">{q}</h3>
                                    <span
                                        aria-hidden="true"
                                        className="grid size-10 shrink-0 place-items-center rounded-full border border-line-strong bg-surface-card text-ink-strong transition-colors duration-300 group-open:border-brand group-open:bg-brand group-open:text-on-brand"
                                    >
                                        <Plus className="size-4 group-open:hidden" />
                                        <Minus className="hidden size-4 group-open:block" />
                                    </span>
                                </summary>
                                <p className="max-w-2xl pb-6 pl-11 pr-2 text-[0.9375rem] leading-[1.75] text-ink-body sm:pr-14">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default DairyFaq
