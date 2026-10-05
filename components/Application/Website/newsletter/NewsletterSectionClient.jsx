'use client'

import { useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useReveal } from '@/hooks/useReveal'
import Section from '../storefront/Section'
import WaveEdge from '../storefront/WaveEdge'
import NewsletterForm from './NewsletterForm'
import { CodeReveal, NewsletterBadge, NewsletterTitle, PerkCheck, SuccessSeal } from './NewsletterParts'

/**
 * The homepage newsletter band: a full-bleed themed band with wave edges
 * (like the "Why shoppers choose us" band), copy + perk chips on the left and
 * the sign-up card on the right, crowned by the offer seal when one is live.
 *
 * `preview` renders it inside the admin customiser without submitting;
 * `previewState` shows the form or the success view there.
 */
const NewsletterSectionClient = ({ section, offer, preview = false, previewState = 'form', previewCoupon = 'WELCOME10' }) => {
    const sectionRef = useRef(null)
    const [result, setResult] = useState(null)
    useReveal(sectionRef)

    const perks = (section.perks || []).filter(Boolean)
    const shown = preview
        ? previewState === 'success' ? { couponCode: offer ? previewCoupon : null } : null
        : result

    return (
        <Section
            ref={sectionRef}
            tone="none"
            bleed
            aria-labelledby="newsletter-title"
            className={cn('ef-nl ef-nl-band', `ef-nl--${section.theme}`)}
        >
            <WaveEdge position="top" />
            <WaveEdge position="bottom" />

            <div className="ef-container">
                <div className="ef-nl-wrap">
                    <div className="ef-nl-band__grid py-[clamp(0.5rem,2vw,1.5rem)]">
                        {/* Oversized outline envelope, bottom-left, for depth. */}
                        <Mail
                            aria-hidden="true"
                            strokeWidth={0.6}
                            className="ef-nl-band__deco -bottom-16 -left-10 size-72 -rotate-12"
                        />

                        <div data-reveal className="relative flex flex-col items-start gap-5">
                            {section.eyebrow && <span className="ef-eyebrow">{section.eyebrow}</span>}
                            <NewsletterTitle id="newsletter-title" title={section.title} accent={section.titleAccent} />
                            {section.description && <p className="ef-nl-lead max-w-xl">{section.description}</p>}
                            {perks.length > 0 && (
                                <ul className="ef-nl-chips">
                                    {perks.map((perk) => (
                                        <li key={perk}><PerkCheck />{perk}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div data-reveal className="ef-nl-band__card">
                            {offer && <NewsletterBadge offer={offer} />}

                            {shown ? (
                                <div className="ef-nl-success" role="status">
                                    <SuccessSeal size="3.5rem" />
                                    <p className="ef-nl-lead font-semibold text-[var(--nl-ink)]">
                                        {shown.alreadySubscribed ? "You're already on the list - welcome back!" : section.successMessage}
                                    </p>
                                    {shown.couponCode && <CodeReveal code={shown.couponCode} />}
                                </div>
                            ) : (
                                <>
                                    <p className={cn('m-0 font-header text-xl font-semibold uppercase leading-tight', offer && 'pr-24')}>
                                        {offer ? `${offer.badge} welcome gift` : 'Join the list'}
                                    </p>
                                    {offer?.note && <p className="ef-nl-fine -mt-2">{offer.note}</p>}
                                    <NewsletterForm
                                        source="section"
                                        preview={preview}
                                        capsule
                                        placeholder={section.placeholder}
                                        buttonText={section.buttonText}
                                        collectName={section.collectName}
                                        consentText={section.consentText}
                                        onSuccess={setResult}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Section>
    )
}

export default NewsletterSectionClient
