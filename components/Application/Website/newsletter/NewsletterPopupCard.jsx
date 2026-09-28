'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Ticket, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import NewsletterForm from './NewsletterForm'
import {
    CodeReveal,
    NewsletterArt,
    NewsletterBadge,
    NewsletterTitle,
    PerkCheck,
    SuccessSeal,
} from './NewsletterParts'

export const PREVIEW_COUPON = 'WELCOME10'

/**
 * Everything inside the popup dialog: close button, media/art panel with the
 * rotating seal, the copy + form, and the success state with the code reveal.
 *
 * The live popup wraps it in a Radix Dialog.Content and passes Radix's Title /
 * Description so screen readers announce it; the admin preview wraps it in a
 * plain div and passes `preview` + `previewState` to show either state.
 */
const NewsletterPopupCard = forwardRef(function NewsletterPopupCard(
    {
        popup,
        preview = false,
        previewState = 'form',
        previewCoupon = PREVIEW_COUPON,
        onClose,
        onDecline,
        Title = 'h2',
        Description = 'p',
    },
    emailRef
) {
    const [result, setResult] = useState(null)
    // A deleted / unreachable image falls back to the illustrated panel.
    const [imageFailed, setImageFailed] = useState(false)
    const successRef = useRef(null)

    useEffect(() => setImageFailed(false), [popup.image?.url])

    // The form (and the focused email field) unmounts on success: move focus
    // to the success message so keyboard and screen-reader users aren't lost.
    useEffect(() => {
        if (result) successRef.current?.focus({ preventScroll: true })
    }, [result])

    const shown = preview
        ? previewState === 'success'
            ? { couponCode: popup.offer.enabled ? previewCoupon : null, alreadySubscribed: false }
            : null
        : result

    const offer = popup.offer.enabled ? popup.offer : null
    const hasMedia = popup.layout === 'split'
    const isSlide = popup.layout === 'slide-in'
    const perks = (popup.perks || []).filter(Boolean)

    return (
        <>
            <button
                type="button"
                className={cn('ef-nl-close', !hasMedia && 'ef-nl-close--on-body')}
                onClick={onClose}
                aria-label="Close newsletter sign-up"
            >
                <X aria-hidden="true" />
            </button>

            {popup.layout === 'centered' && <NewsletterBadge offer={offer} />}

            <div className="ef-nl-scroll" data-lenis-prevent>
                {hasMedia && (
                    <div className="ef-nl-media">
                        {popup.image?.url && !imageFailed ? (
                            <Image
                                src={popup.image.url}
                                alt={popup.image.alt || ''}
                                fill
                                sizes="(min-width: 640px) 380px, 100vw"
                                className="ef-nl-media__img"
                                onError={() => setImageFailed(true)}
                            />
                        ) : (
                            <NewsletterArt />
                        )}
                        <NewsletterBadge offer={offer} />
                    </div>
                )}

                <div className="ef-nl-body">
                    {shown ? (
                        <div ref={successRef} tabIndex={-1} className="ef-nl-success outline-none" role="status">
                            <SuccessSeal size={isSlide ? '3rem' : '3.5rem'} />
                            <Title className="ef-nl-title">{popup.successTitle}</Title>
                            <Description className="ef-nl-lead ef-nl-keep">
                                {shown.alreadySubscribed
                                    ? "You're already on the list — welcome back!"
                                    : popup.successMessage}
                            </Description>
                            {shown.couponCode && <CodeReveal code={shown.couponCode} />}
                            <Link
                                href={WEBSITE_SHOP}
                                className="ef-nl-submit"
                                onClick={preview ? (e) => e.preventDefault() : onClose}
                            >
                                <span>{popup.successButtonText}</span>
                                <ArrowRight aria-hidden="true" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            {popup.eyebrow && <span className="ef-eyebrow w-fit">{popup.eyebrow}</span>}

                            <NewsletterTitle as={Title} title={popup.title} accent={popup.titleAccent} />

                            {popup.description && <Description className="ef-nl-lead">{popup.description}</Description>}

                            {!isSlide && perks.length > 0 && (
                                <ul className="ef-nl-perks">
                                    {perks.map((perk, i) => (
                                        <li key={i}><PerkCheck />{perk}</li>
                                    ))}
                                </ul>
                            )}

                            {offer && (isSlide ? (
                                <div className="ef-nl-ticket">
                                    <span className="ef-nl-ticket__big">{offer.badge}</span>
                                    {offer.note && <span className="ef-nl-ticket__note">{offer.note}</span>}
                                </div>
                            ) : offer.note ? (
                                <p className="m-0 flex items-center gap-2 text-[0.8125rem] font-semibold text-[var(--nl-ink)]">
                                    <Ticket className="size-4 shrink-0 text-[var(--nl-accent)]" aria-hidden="true" />
                                    {offer.note}
                                </p>
                            ) : null)}

                            <NewsletterForm
                                ref={emailRef}
                                source="popup"
                                preview={preview}
                                placeholder={popup.placeholder}
                                buttonText={popup.buttonText}
                                collectName={popup.collectName}
                                consentText={popup.consentText}
                                onSuccess={setResult}
                                footer={popup.declineText ? (
                                    <button type="button" className="ef-nl-link" onClick={onDecline}>
                                        {popup.declineText}
                                    </button>
                                ) : null}
                            />

                        </>
                    )}
                </div>
            </div>
        </>
    )
})

export default NewsletterPopupCard
