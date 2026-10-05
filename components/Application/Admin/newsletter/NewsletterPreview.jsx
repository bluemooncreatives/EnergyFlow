'use client'

import { useEffect, useRef, useState } from 'react'
import { Gift, Mail, Monitor, Smartphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import NewsletterPopupCard from '@/components/Application/Website/newsletter/NewsletterPopupCard'
import NewsletterSectionClient from '@/components/Application/Website/newsletter/NewsletterSectionClient'
import NewsletterFooterStrip from '@/components/Application/Website/newsletter/NewsletterFooterStrip'

const FRAMES = {
    desktop: { width: 1280, height: 800, maxScale: 1 },
    mobile: { width: 390, height: 780, maxScale: 1 },
}

// Fluid storefront tokens are built on vw, which inside the admin would track
// the admin's own window. Pin them to what a real device of the frame's width
// resolves them to, so the preview is faithful.
const DEVICE_TOKENS = {
    desktop: {
        '--website-gutter': '2.25rem',
        '--section-space': '6.5rem',
        '--section-gap': '2.75rem',
        '--type-display': '3.5rem',
        '--type-lead': '1.125rem',
        '--nl-title-size': '2.75rem',
    },
    mobile: {
        '--website-gutter': '1rem',
        '--section-space': '3.75rem',
        '--section-gap': '1.9rem',
        '--type-display': '2.2rem',
        '--type-lead': '1rem',
        '--nl-title-size': '1.95rem',
    },
}

const Segmented = ({ value, onChange, options, label }) => (
    <div role="radiogroup" aria-label={label} className="inline-flex h-8 items-center rounded-lg bg-muted p-[3px]">
        {options.map((opt) => (
            <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={value === opt.value}
                onClick={() => onChange(opt.value)}
                className={cn(
                    'inline-flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                    value === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
            >
                {opt.icon && <opt.icon className="size-3.5" />}
                {opt.label}
            </button>
        ))}
    </div>
)

// Renders children at a real device width, scaled down to fit the panel.
const ScaledFrame = ({ device, children }) => {
    const outerRef = useRef(null)
    const [scale, setScale] = useState(0.4)
    const frame = FRAMES[device]
    const bezel = device === 'mobile' ? 24 : 0
    const chrome = device === 'mobile' ? 0 : 36
    const totalW = frame.width + bezel
    const totalH = frame.height + bezel + chrome

    useEffect(() => {
        const el = outerRef.current
        if (!el) return
        const measure = () => {
            const byWidth = el.clientWidth / totalW
            const byHeight = device === 'mobile' ? 640 / totalH : Infinity
            setScale(Math.min(frame.maxScale, byWidth, byHeight))
        }
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(el)
        return () => observer.disconnect()
    }, [device, totalW, totalH, frame.maxScale])

    return (
        <div ref={outerRef} className="w-full">
            <div className="relative mx-auto" style={{ width: totalW * scale, height: totalH * scale }}>
                <div
                    className="absolute left-0 top-0 origin-top-left"
                    style={{ width: totalW, height: totalH, transform: `scale(${scale})` }}
                >
                    {device === 'mobile' ? (
                        <div className="relative size-full overflow-hidden rounded-[3rem] border-[12px] border-neutral-900 bg-neutral-900 shadow-2xl">
                            <div className="absolute left-1/2 top-2 z-30 h-7 w-28 -translate-x-1/2 rounded-full bg-neutral-900" />
                            <div className="relative size-full overflow-hidden rounded-[2.25rem]" style={DEVICE_TOKENS.mobile}>
                                {children}
                            </div>
                        </div>
                    ) : (
                        <div className="flex size-full flex-col overflow-hidden rounded-xl border bg-card shadow-2xl">
                            <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-muted px-4">
                                <span className="size-3 rounded-full bg-[#FF5F57]" />
                                <span className="size-3 rounded-full bg-[#FEBC2E]" />
                                <span className="size-3 rounded-full bg-[#28C840]" />
                                <span className="mx-auto w-72 truncate rounded-md bg-background px-3 py-1 text-center text-xs text-muted-foreground">
                                    energyflow.in
                                </span>
                            </div>
                            <div className="relative min-h-0 flex-1 overflow-hidden" style={DEVICE_TOKENS.desktop}>
                                {children}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// A quiet stand-in for the storefront behind the popup.
const MockStorefront = () => (
    <div className="@container absolute inset-0 overflow-hidden bg-surface-page font-neue" aria-hidden="true">
        <div className="flex items-center justify-between px-5 py-4 @2xl:px-10">
            <span className="font-header text-lg font-semibold uppercase text-ink-strong">Energyflow</span>
            <div className="hidden gap-6 @2xl:flex">
                {['Shop', 'Categories', 'About', 'Contact'].map((l) => (
                    <span key={l} className="text-sm text-ink-body">{l}</span>
                ))}
            </div>
            <span className="size-8 rounded-full bg-surface-well" />
        </div>
        <div
            className="mx-4 flex h-[46%] flex-col justify-end gap-3 rounded-2xl p-6 @2xl:mx-10 @2xl:p-12"
            style={{ backgroundImage: 'var(--brand-panel-gradient)', backgroundColor: 'var(--palette-pine)' }}
        >
            <span className="font-header text-4xl font-semibold uppercase leading-none text-[var(--palette-cream)] @2xl:text-7xl">
                Pure nutrition
            </span>
            <span className="h-10 w-36 rounded-lg bg-[var(--palette-sunflower)]" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-6 @2xl:grid-cols-4 @2xl:px-10">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                    <span className="aspect-[4/5] rounded-xl bg-surface-well" />
                    <span className="h-3 w-3/4 rounded bg-surface-sunken" />
                    <span className="h-3 w-1/3 rounded bg-surface-sunken" />
                </div>
            ))}
        </div>
    </div>
)

const PopupPreview = ({ popup, state, setState }) => {
    const isSlide = popup.layout === 'slide-in'

    if (state === 'teaser') {
        return (
            <>
                <MockStorefront />
                <div className="ef-nl-teaser is-preview">
                    <button type="button" className="ef-nl-teaser__open" onClick={() => setState('form')}>
                        <span className="ef-nl-teaser__icon">
                            {popup.offer.enabled ? <Gift aria-hidden="true" /> : <Mail aria-hidden="true" />}
                        </span>
                        {popup.teaser.text || 'Join the club'}
                    </button>
                    <span className="ef-nl-teaser__dismiss" aria-hidden="true"><X /></span>
                </div>
            </>
        )
    }

    return (
        <>
            <MockStorefront />
            {!isSlide && <div className="ef-nl-backdrop is-preview" data-state="open" />}
            <div
                className={cn('ef-nl-stage is-preview', isSlide ? 'ef-nl-stage--slide' : 'ef-nl-stage--modal')}
                data-state="open"
            >
                <div className="ef-nl-frame">
                    <div
                        className={cn(
                            'ef-nl ef-nl-dialog',
                            `ef-nl--${popup.theme}`,
                            `ef-nl-dialog--${isSlide ? 'slide' : popup.layout}`,
                            popup.imagePosition === 'right' && 'is-img-right'
                        )}
                    >
                        <NewsletterPopupCard
                            popup={popup}
                            preview
                            previewState={state}
                            previewCoupon={popup.offer.couponCode || undefined}
                            onClose={() => setState(popup.teaser.enabled ? 'teaser' : 'form')}
                            onDecline={() => setState(popup.teaser.enabled ? 'teaser' : 'form')}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

const SectionPreview = ({ section, offer, state }) => (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-surface-page font-neue">
        <div className="ef-section ef-section--sunken" style={{ paddingBlock: '3rem' }} aria-hidden="true">
            <div className="ef-container flex flex-col gap-3">
                <span className="h-4 w-24 rounded bg-surface-card" />
                <span className="h-8 w-2/3 rounded bg-surface-card" />
            </div>
        </div>
        <NewsletterSectionClient
            section={section}
            offer={offer}
            preview
            previewState={state}
            previewCoupon={offer?.couponCode || undefined}
        />
        <div className="ef-section ef-section--page" style={{ paddingBlock: '3rem' }} aria-hidden="true">
            <div className="ef-container flex flex-col gap-3">
                <span className="h-4 w-20 rounded bg-surface-sunken" />
                <span className="h-8 w-1/2 rounded bg-surface-sunken" />
            </div>
        </div>
    </div>
)

const FooterPreview = ({ footer, state }) => (
    <div className="absolute inset-0 overflow-y-auto bg-surface-page font-neue">
        <div className="h-24" aria-hidden="true" />
        <div
            className="bg-pine-deep px-[var(--website-gutter)] pb-10 pt-12 text-white"
            style={{ backgroundImage: 'var(--pine-panel-gradient)' }}
        >
            <p className="mb-4 max-w-md text-white/60" aria-hidden="true">Premium dry fruits, nuts, seeds and super foods…</p>
            <span className="inline-block border-b border-white/30 pb-2 font-header text-3xl" aria-hidden="true">energyflow0001@gmail.com</span>
            <NewsletterFooterStrip footer={footer} preview previewState={state} />
            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-10" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <span className="h-3 w-20 rounded bg-[var(--palette-sunflower)]/60" />
                        <span className="h-3 w-24 rounded bg-white/15" />
                        <span className="h-3 w-16 rounded bg-white/15" />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

/**
 * Live preview for the newsletter customiser: the real storefront components
 * rendered at true device widths (1280px desktop, 390px phone) and scaled to
 * fit, updating on every keystroke. Nothing here submits.
 */
const NewsletterPreview = ({ values, offerLive }) => {
    const [surface, setSurface] = useState('popup')
    const [device, setDevice] = useState('desktop')
    const [state, setState] = useState('form')

    const popup = { ...values.popup, offer: { ...values.popup.offer, enabled: offerLive } }
    const sectionOffer = values.section.showOffer && offerLive ? popup.offer : null

    const stateOptions = surface === 'popup'
        ? [{ value: 'form', label: 'Form' }, { value: 'success', label: 'Success' }, { value: 'teaser', label: 'Teaser' }]
        : [{ value: 'form', label: 'Form' }, { value: 'success', label: 'Success' }]
    const effectiveState = stateOptions.some((o) => o.value === state) ? state : 'form'

    const disabled =
        (surface === 'popup' && !values.popup.enabled) ||
        (surface === 'section' && !values.section.enabled) ||
        (surface === 'footer' && !values.footer.enabled)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmented
                    label="Preview surface"
                    value={surface}
                    onChange={setSurface}
                    options={[
                        { value: 'popup', label: 'Popup' },
                        { value: 'section', label: 'Homepage band' },
                        { value: 'footer', label: 'Footer' },
                    ]}
                />
                <Segmented
                    label="Device"
                    value={device}
                    onChange={setDevice}
                    options={[
                        { value: 'desktop', label: 'Desktop', icon: Monitor },
                        { value: 'mobile', label: 'Mobile', icon: Smartphone },
                    ]}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <Segmented label="State" value={effectiveState} onChange={setState} options={stateOptions} />
                {disabled ? (
                    <span className="ef-tone--danger rounded-full border px-2.5 py-0.5 text-xs font-medium">Off - not shown on the site</span>
                ) : (
                    <span className="ef-tone--forest rounded-full border px-2.5 py-0.5 text-xs font-medium">Live on the site</span>
                )}
            </div>

            <div className={cn('rounded-xl bg-muted/60 p-3 transition-opacity sm:p-5', disabled && 'opacity-60')}>
                <ScaledFrame device={device}>
                    {surface === 'popup' && (
                        <PopupPreview
                            key={`${device}-${popup.layout}-${popup.theme}`}
                            popup={popup}
                            state={effectiveState}
                            setState={setState}
                        />
                    )}
                    {surface === 'section' && (
                        <SectionPreview section={values.section} offer={sectionOffer} state={effectiveState} />
                    )}
                    {surface === 'footer' && <FooterPreview footer={values.footer} state={effectiveState} />}
                </ScaledFrame>
            </div>

            <p className="text-xs text-muted-foreground">
                The preview uses the real storefront components at true device widths and updates as you type.
                Forms don&apos;t submit here. The success state shows your selected welcome coupon.
            </p>
        </div>
    )
}

export default NewsletterPreview
