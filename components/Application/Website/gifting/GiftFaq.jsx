import { ArrowRight, Mail, MessageCircle, Minus, Phone, Plus } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import { EnquireButton } from './GiftingSelection'
import { GiftSectionHead, MAIL_HREF, WHATSAPP_HREF, pad } from './GiftingUi'

const CONTACT_LINK = 'ef-focus inline-flex items-center gap-2.5 rounded-sm text-[0.875rem] text-ink-strong transition-colors hover:text-brand-bright'

/**
 * "Everything you need to know", after the wellness reference's FAQ: the
 * headline, a line of reassurance, the brief button and the team's direct
 * lines on the left (sticky on desktop); the questions on the right as
 * ruled rows with a round +/− — the first one open.
 *
 * Plain <details>, so it works before (and without) JavaScript, and the
 * answers are in the HTML for the FAQ rich result. Rows sharing a name
 * close each other in browsers that support it.
 *
 * faqs — [{ q, a }]: the admin's questions, else the category's.
 */
const GiftFaq = ({ content, faqs = [], number }) => {
    if (!faqs.length) return null

    return (
        <section className="ef-section ef-section--sunken" aria-labelledby="faq-title">
            <div className="ef-container">
                <GiftSectionHead number={number} eyebrow={content.eyebrow} />

                <div className="grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="flex min-w-0 flex-col items-start gap-5 lg:sticky lg:top-28 lg:self-start">
                        <h2 id="faq-title" className="ef-title">
                            {content.title}
                            {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                        </h2>
                        {content.description && <p className="ef-lead max-w-md">{content.description}</p>}
                        <EnquireButton className="ef-btn ef-btn--primary">
                            Ask the gifting team <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                        </EnquireButton>
                        <div className="mt-1 flex w-full max-w-md flex-col gap-2.5 border-t border-line-strong pt-5">
                            <a href={COMPANY.phoneHref} className={CONTACT_LINK}><Phone className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.phone}</a>
                            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK}><MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp us</a>
                            <a href={MAIL_HREF} className={`${CONTACT_LINK} break-all`}><Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}</a>
                        </div>
                    </div>

                    <div className="min-w-0 border-t border-line-strong">
                        {faqs.map(({ q, a }, i) => (
                            <details key={`${q}-${i}`} name="gift-faq" open={i === 0} className="group border-b border-line-strong">
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
                                <p className="max-w-2xl whitespace-pre-line pb-6 pl-11 pr-2 text-[0.9375rem] leading-[1.75] text-ink-body sm:pr-14">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftFaq
