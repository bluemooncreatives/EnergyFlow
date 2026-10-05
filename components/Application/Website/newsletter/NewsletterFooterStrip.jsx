'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import NewsletterForm from './NewsletterForm'
import { CodeReveal, SuccessSeal } from './NewsletterParts'

// Compact sign-up row in the footer, on the footer's own pine gradient.
// Container queries (not viewport breakpoints) so the admin preview frames
// lay it out exactly as a phone or desktop would.
// `preview` / `previewState` are for the admin customiser.
const NewsletterFooterStrip = ({ footer, preview = false, previewState = 'form' }) => {
    const [live, setResult] = useState(null)
    const result = preview ? (previewState === 'success' ? { couponCode: null } : null) : live

    return (
        <div className="@container mt-14">
            <div className="ef-nl ef-nl--pine grid gap-6 rounded-[var(--radius-tile)] border border-white/10 bg-transparent p-5 @lg:p-7 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] @3xl:items-center @3xl:gap-12">
                <div className="flex items-start gap-4">
                    <span className="ef-seal ef-seal--sun hidden size-14 @lg:inline-flex" aria-hidden="true">
                        <Mail strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                        <h3 className="m-0 font-header text-[1.375rem] font-semibold uppercase leading-tight text-[var(--palette-cream)] @lg:text-2xl">
                            {footer.title}
                        </h3>
                        {footer.description && (
                            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/70">{footer.description}</p>
                        )}
                    </div>
                </div>

                {result ? (
                    <div className="flex flex-col gap-3" role="status">
                        <p className="m-0 flex items-center gap-3 font-semibold text-[var(--palette-cream)]">
                            <SuccessSeal size="2.25rem" />
                            {result.alreadySubscribed ? "You're already on the list - welcome back!" : "You're subscribed - welcome to the club!"}
                        </p>
                        {result.couponCode && <CodeReveal code={result.couponCode} />}
                    </div>
                ) : (
                    <NewsletterForm
                        source="footer"
                        preview={preview}
                        capsule
                        placeholder="Your email address"
                        buttonText={footer.buttonText}
                        consentText="No spam. Unsubscribe anytime."
                        onSuccess={setResult}
                    />
                )}
            </div>
        </div>
    )
}

export default NewsletterFooterStrip
