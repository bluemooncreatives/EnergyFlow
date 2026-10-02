'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowRight, Check, CheckCircle2, Copy, Loader2, Mail, MessageCircle, Phone } from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'
import Link from 'next/link'
import { COMPANY } from '@/lib/company'
import { USER_ENQUIRIES, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import {
    BUDGETS,
    MAX_GIFT_QUANTITY,
    MIN_GIFT_QUANTITY,
    OCCASIONS,
    QUANTITY_PRESETS,
    giftEnquirySchema,
    todayInputValue,
} from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { scrollToElement } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import { COLLECTION_ANCHOR, ENQUIRY_ANCHOR, useGiftingSelection } from './GiftingSelection'
import styles from './gifting.module.css'

const DRAFT_KEY = 'ef-gift-enquiry-draft'
const MESSAGE_MAX = 2000

const EMPTY = {
    name: '',
    company: '',
    email: '',
    phone: '',
    city: '',
    occasion: '',
    quantity: '',
    budget: '',
    deliveryDate: '',
    branding: false,
    message: '',
}
const FIELDS = Object.keys(EMPTY)

const WHATSAPP_HREF = `https://wa.me/${COMPANY.phoneHref.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Energyflow, I would like to enquire about corporate gift boxes.')}`

// sessionStorage can throw (private mode, blocked storage) — the draft is a
// convenience, so failures are ignored.
const readDraft = () => {
    try {
        const raw = window.sessionStorage.getItem(DRAFT_KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}
const writeDraft = (draft) => {
    try {
        window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch { /* ignore */ }
}
const clearDraft = () => {
    try {
        window.sessionStorage.removeItem(DRAFT_KEY)
    } catch { /* ignore */ }
}

const FieldError = ({ id, message }) =>
    message ? <p id={id} className={styles.error} role="alert">{message}</p> : null

const GiftEnquiryForm = ({ products = [] }) => {
    const auth = useSelector((store) => store.authStore?.auth)
    const { selected, setSelected, toggle } = useGiftingSelection()
    const [minDate, setMinDate] = useState(undefined)
    const [serverError, setServerError] = useState('')
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)
    const hpRef = useRef(null)
    const panelRef = useRef(null)
    const successRef = useRef(null)
    const restoredRef = useRef(false)

    const {
        register,
        control,
        handleSubmit,
        setValue,
        setError,
        setFocus,
        reset,
        watch,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(giftEnquirySchema),
        defaultValues: EMPTY,
        mode: 'onTouched',
    })

    const productIds = products.map((p) => p._id)

    // After mount: today's date for the picker (client clock, so no
    // hydration mismatch), then restore an unsent draft, then fill in a
    // signed-in customer's name and email where the draft left them blank.
    useEffect(() => {
        setMinDate(todayInputValue())
        if (restoredRef.current) return
        restoredRef.current = true
        const draft = readDraft()
        if (draft?.values) {
            reset({ ...EMPTY, ...draft.values })
            if (Array.isArray(draft.selected)) {
                const live = draft.selected.filter((id) => productIds.includes(id))
                if (live.length) setSelected((current) => [...new Set([...current, ...live])])
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!auth) return
        if (!getValues('name') && auth.name) setValue('name', auth.name)
        if (!getValues('email') && auth.email) setValue('email', auth.email)
    }, [auth, getValues, setValue])

    // Keep the draft in step with what's typed (debounced) and with the boxes
    // ticked — including ones ticked from the collection above.
    useEffect(() => {
        if (result) return undefined
        let timer = 0
        const save = (values) => {
            window.clearTimeout(timer)
            timer = window.setTimeout(() => writeDraft({ values, selected }), 400)
        }
        save(getValues())
        const subscription = watch((values) => save(values))
        return () => {
            window.clearTimeout(timer)
            subscription.unsubscribe()
        }
    }, [watch, getValues, selected, result])

    const quantity = watch('quantity')
    const message = watch('message') || ''

    const onSubmit = async (values) => {
        setServerError('')
        try {
            const { data } = await axios.post(
                '/api/gift-enquiry',
                {
                    ...values,
                    products: selected.filter((id) => productIds.includes(id)),
                    website: hpRef.current?.value || '',
                    pagePath: window.location.pathname,
                },
                { timeout: 25000 }
            )

            if (!data?.success) {
                const field = data?.data?.field
                if (field && FIELDS.includes(field)) {
                    setError(field, { type: 'server', message: data.message })
                    setFocus(field)
                } else {
                    setServerError(data?.message || 'We could not send your enquiry. Please try again.')
                }
                return
            }

            clearDraft()
            setResult({
                ticketId: data.data?.ticketId,
                duplicate: Boolean(data.data?.duplicate),
                tracked: Boolean(data.data?.tracked),
                email: values.email,
                message: data.message,
            })
        } catch (error) {
            const offline = typeof navigator !== 'undefined' && navigator.onLine === false
            setServerError(
                offline
                    ? 'You appear to be offline. Your details are saved here, so reconnect and press send again.'
                    : error?.code === 'ECONNABORTED'
                        ? 'This is taking longer than usual. Please press send again in a moment.'
                        : 'Something went wrong on our side. Please try again, or call us directly.'
            )
        }
    }

    // Bring the result into view and announce it.
    useEffect(() => {
        if (!result) return
        scrollToElement(panelRef.current)
        const timer = window.setTimeout(() => successRef.current?.focus({ preventScroll: true }), 350)
        return () => window.clearTimeout(timer)
    }, [result])

    const startAnother = () => {
        // Keep who they are; clear what they asked for.
        const { name, company, email, phone, city } = getValues()
        reset({ ...EMPTY, name, company, email, phone, city })
        setSelected([])
        setResult(null)
        setCopied(false)
        window.setTimeout(() => setFocus('occasion'), 50)
    }

    const trackHref = result?.ticketId ? `${USER_ENQUIRIES}?ref=${encodeURIComponent(result.ticketId)}` : USER_ENQUIRIES

    const copyRef = async () => {
        if (!result?.ticketId) return
        try {
            await navigator.clipboard.writeText(result.ticketId)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch { /* clipboard blocked — the reference is on screen anyway */ }
    }

    const errId = (name) => (errors[name] ? `gift-${name}-error` : undefined)

    return (
        <section id={ENQUIRY_ANCHOR} className="ef-section ef-section--page scroll-mt-20" aria-labelledby="enquiry-title">
            <div className="ef-container">
                <div ref={panelRef} className={cn(styles.enquiry, 'scroll-mt-28')}>
                    {/* Pitch + direct lines */}
                    <aside className={cn('ef-on-inverse', styles.enquiryAside)}>
                        <span className="ef-eyebrow">Corporate &amp; bulk orders</span>
                        <h2 id="enquiry-title" className="ef-title mt-4 !text-[clamp(2rem,1.4rem+2.6vw,3.25rem)]">
                            Tell us what you&apos;re <span className="ef-title__accent">gifting</span>
                        </h2>
                        <p className="mt-4 text-[0.9375rem] leading-relaxed text-[var(--ink-on-inverse-muted)]">
                            Share a few details and our gifting team will come back with box options, a quote at volume
                            pricing and delivery timelines. No commitment until you approve.
                        </p>

                        <ul className="mt-7 flex flex-col gap-3 text-[0.9375rem]">
                            {[
                                `Bulk orders from ${MIN_GIFT_QUANTITY} boxes`,
                                'Logo sleeves & personalised notes',
                                'One quote: boxes, branding, delivery',
                                'Reply within one working day',
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--palette-sunflower)] text-[var(--palette-pine)]">
                                        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-9 border-t border-white/15 pt-6">
                            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[var(--ink-on-inverse-muted)]">
                                Prefer to talk?
                            </p>
                            <div className="mt-3 flex flex-col gap-2.5 text-[0.9375rem]">
                                <a href={COMPANY.phoneHref} className="ef-focus inline-flex items-center gap-2.5 rounded-sm hover:text-[var(--palette-sunflower)]">
                                    <Phone className="size-4" aria-hidden="true" /> {COMPANY.phone}
                                </a>
                                <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Corporate gifting enquiry')}`} className="ef-focus inline-flex items-center gap-2.5 break-all rounded-sm hover:text-[var(--palette-sunflower)]">
                                    <Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}
                                </a>
                                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ef-focus inline-flex items-center gap-2.5 rounded-sm hover:text-[var(--palette-sunflower)]">
                                    <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp us
                                </a>
                            </div>
                        </div>
                    </aside>

                    {result ? (
                        <div className={styles.success} aria-live="polite">
                            <span className="ef-seal ef-seal--forest !size-16">
                                <CheckCircle2 aria-hidden="true" />
                            </span>
                            <h3 ref={successRef} tabIndex={-1} className="ef-title ef-title--md outline-none">
                                {result.duplicate ? 'Already with our team' : 'Brief received — thank you!'}
                            </h3>
                            <p className="ef-lead max-w-lg">
                                {result.duplicate
                                    ? result.message
                                    : 'Our gifting team will review your brief and get back to you within one working day. A confirmation is on its way to your inbox.'}
                            </p>
                            {result.ticketId && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">Your reference</span>
                                    <span className={styles.ref}>
                                        {result.ticketId}
                                        <button
                                            type="button"
                                            onClick={copyRef}
                                            className="ef-focus grid size-9 place-items-center rounded-lg bg-surface-card text-brand shadow-elev-1"
                                            aria-label={copied ? 'Reference copied' : 'Copy reference'}
                                        >
                                            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                        </button>
                                    </span>
                                </div>
                            )}
                            {result.ticketId && !result.tracked && (
                                <p className="max-w-lg text-[0.875rem] leading-relaxed text-ink-body">
                                    Want to follow its progress?{' '}
                                    <Link href={`${WEBSITE_LOGIN}?callback=${encodeURIComponent(trackHref)}`} className="font-semibold text-brand underline underline-offset-2">
                                        Sign in or create an account
                                    </Link>{' '}
                                    with <span className="font-semibold">{result.email}</span> and verify it — this enquiry will appear under Enquiries in your account.
                                </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-3">
                                {result.ticketId && result.tracked && (
                                    <Link href={trackHref} className="ef-btn ef-btn--primary">
                                        Track in your account <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                                    </Link>
                                )}
                                <button type="button" className={result.tracked ? 'ef-btn ef-btn--outline' : 'ef-btn ef-btn--primary'} onClick={startAnother}>
                                    Send another enquiry
                                </button>
                                {products.length > 0 && (
                                    <a
                                        href={`#${COLLECTION_ANCHOR}`}
                                        className="ef-btn ef-btn--outline"
                                        onClick={(e) => {
                                            const target = document.getElementById(COLLECTION_ANCHOR)
                                            if (!target) return
                                            e.preventDefault()
                                            scrollToElement(target)
                                        }}
                                    >
                                        Back to the boxes
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form className={styles.enquiryForm} onSubmit={handleSubmit(onSubmit)} noValidate aria-describedby="gift-form-note">
                            <p id="gift-form-note" className="mb-7 text-[0.8125rem] text-ink-muted">
                                Fields marked <span className={styles.req}>*</span> are required. Takes about two minutes.
                            </p>

                            <div className="flex flex-col gap-8">
                                {/* 1 — the ask */}
                                <fieldset className={styles.fieldset} aria-describedby={errId('occasion')}>
                                    <legend className={styles.legend}>What&apos;s the occasion? <span className={styles.req}>*</span></legend>
                                    <div className={styles.chips}>
                                        {OCCASIONS.map((o) => (
                                            <label key={o.value} className={styles.chip}>
                                                <input type="radio" value={o.value} {...register('occasion')} />
                                                <span>{o.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <FieldError id={errId('occasion')} message={errors.occasion?.message} />
                                </fieldset>

                                <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                    <div>
                                        <label htmlFor="gift-quantity" className={styles.label}>
                                            How many boxes? <span className={styles.req}>*</span>
                                        </label>
                                        <input
                                            id="gift-quantity"
                                            type="number"
                                            inputMode="numeric"
                                            min={MIN_GIFT_QUANTITY}
                                            max={MAX_GIFT_QUANTITY}
                                            step={1}
                                            placeholder={`At least ${MIN_GIFT_QUANTITY}`}
                                            className={styles.input}
                                            aria-invalid={errors.quantity ? 'true' : 'false'}
                                            aria-describedby={errId('quantity')}
                                            {...register('quantity')}
                                        />
                                        <div className={cn(styles.chips, 'mt-2.5')} role="group" aria-label="Quick quantities">
                                            {QUANTITY_PRESETS.map((n) => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => setValue('quantity', String(n), { shouldValidate: true, shouldDirty: true })}
                                                    aria-pressed={String(quantity) === String(n)}
                                                    className={cn(
                                                        'ef-focus rounded-full px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                                                        String(quantity) === String(n)
                                                            ? 'bg-brand text-on-brand'
                                                            : 'bg-surface-page text-ink-strong shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--brand-primary-bright)]'
                                                    )}
                                                >
                                                    {n === QUANTITY_PRESETS[QUANTITY_PRESETS.length - 1] ? `${n}+` : n}
                                                </button>
                                            ))}
                                        </div>
                                        <FieldError id={errId('quantity')} message={errors.quantity?.message} />
                                    </div>

                                    <fieldset className={styles.fieldset}>
                                        <legend className={styles.legend}>Budget per box <span className={styles.optional}>(optional)</span></legend>
                                        <div className={styles.chips}>
                                            {BUDGETS.map((b) => (
                                                <label key={b.value} className={styles.chip}>
                                                    <input type="radio" value={b.value} {...register('budget')} />
                                                    <span>{b.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                </div>

                                {products.length > 0 && (
                                    <fieldset className={styles.fieldset}>
                                        <legend className={styles.legend}>
                                            Boxes you like <span className={styles.optional}>(optional — pick any, or leave it to us)</span>
                                        </legend>
                                        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                            {products.map((p) => {
                                                const name = formatProductName(p.name)
                                                const img = p.media?.[0]?.secure_url
                                                return (
                                                    <label key={p._id} className={styles.pick}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.includes(p._id)}
                                                            onChange={() => toggle(p._id)}
                                                        />
                                                        <span className={styles.pickThumb}>
                                                            {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                                                        </span>
                                                        <span className="min-w-0 text-[0.875rem] font-medium leading-tight text-ink-strong">{name}</span>
                                                        <span className={styles.pickTick} aria-hidden="true"><Check className="size-3" strokeWidth={3} /></span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </fieldset>
                                )}

                                {/* 2 — who's asking */}
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="gift-name" className={styles.label}>Your name <span className={styles.req}>*</span></label>
                                        <input id="gift-name" type="text" autoComplete="name" maxLength={80} className={styles.input}
                                            aria-invalid={errors.name ? 'true' : 'false'} aria-describedby={errId('name')} {...register('name')} />
                                        <FieldError id={errId('name')} message={errors.name?.message} />
                                    </div>
                                    <div>
                                        <label htmlFor="gift-company" className={styles.label}>Company <span className={styles.optional}>(optional)</span></label>
                                        <input id="gift-company" type="text" autoComplete="organization" maxLength={120} className={styles.input}
                                            aria-invalid={errors.company ? 'true' : 'false'} aria-describedby={errId('company')} {...register('company')} />
                                        <FieldError id={errId('company')} message={errors.company?.message} />
                                    </div>
                                    <div>
                                        <label htmlFor="gift-email" className={styles.label}>Work email <span className={styles.req}>*</span></label>
                                        <input id="gift-email" type="email" autoComplete="email" inputMode="email" maxLength={254} className={styles.input}
                                            aria-invalid={errors.email ? 'true' : 'false'} aria-describedby={errId('email')} {...register('email')} />
                                        <FieldError id={errId('email')} message={errors.email?.message} />
                                    </div>
                                    <div>
                                        <label htmlFor="gift-phone" className={styles.label}>Phone <span className={styles.req}>*</span></label>
                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({ field }) => (
                                                <PhoneInput
                                                    native
                                                    id="gift-phone"
                                                    autoComplete="tel"
                                                    className={styles.input}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    onBlur={field.onBlur}
                                                    name={field.name}
                                                    ref={field.ref}
                                                    aria-invalid={errors.phone ? 'true' : 'false'}
                                                    aria-describedby={errId('phone')}
                                                />
                                            )}
                                        />
                                        <FieldError id={errId('phone')} message={errors.phone?.message} />
                                    </div>
                                    <div>
                                        <label htmlFor="gift-city" className={styles.label}>Delivery city <span className={styles.optional}>(optional)</span></label>
                                        <input id="gift-city" type="text" autoComplete="address-level2" maxLength={60} className={styles.input}
                                            placeholder="e.g. Gurugram, or multiple cities" aria-invalid={errors.city ? 'true' : 'false'}
                                            aria-describedby={errId('city')} {...register('city')} />
                                        <FieldError id={errId('city')} message={errors.city?.message} />
                                    </div>
                                    <div>
                                        <label htmlFor="gift-date" className={styles.label}>Needed by <span className={styles.optional}>(optional)</span></label>
                                        <input id="gift-date" type="date" min={minDate} className={styles.input}
                                            aria-invalid={errors.deliveryDate ? 'true' : 'false'} aria-describedby={errId('deliveryDate')} {...register('deliveryDate')} />
                                        <FieldError id={errId('deliveryDate')} message={errors.deliveryDate?.message} />
                                    </div>
                                </div>

                                <label className={styles.switchRow}>
                                    <input type="checkbox" {...register('branding')} />
                                    <span className={styles.switchTrack} aria-hidden="true" />
                                    <span className="flex flex-col gap-0.5">
                                        <span className="text-[0.9375rem] font-semibold text-ink-strong">Add custom branding</span>
                                        <span className="text-[0.8125rem] text-ink-muted">Your logo on the sleeve, a printed message card, or personalised notes.</span>
                                    </span>
                                </label>

                                <div>
                                    <label htmlFor="gift-message" className={styles.label}>
                                        Anything else? <span className={styles.optional}>(optional)</span>
                                    </label>
                                    <textarea
                                        id="gift-message"
                                        rows={4}
                                        maxLength={MESSAGE_MAX}
                                        className={styles.input}
                                        placeholder="Preferred mix, delivery to multiple addresses, dietary notes, a sample before ordering…"
                                        aria-invalid={errors.message ? 'true' : 'false'}
                                        aria-describedby={['gift-message-count', errId('message')].filter(Boolean).join(' ')}
                                        {...register('message')}
                                    />
                                    <p id="gift-message-count" className="mt-1.5 text-right text-[0.75rem] tabular-nums text-ink-muted">
                                        {message.length.toLocaleString('en-IN')} / {MESSAGE_MAX.toLocaleString('en-IN')}
                                    </p>
                                    <FieldError id={errId('message')} message={errors.message?.message} />
                                </div>

                                {/* Honeypot: hidden from people and assistive tech. */}
                                <div className={styles.hp} aria-hidden="true">
                                    <label htmlFor="gift-website">Website</label>
                                    <input ref={hpRef} id="gift-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
                                </div>

                                {serverError && (
                                    <div role="alert" className="flex items-start gap-3 rounded-xl bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] p-4 text-[0.875rem] text-[var(--destructive)]">
                                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                        <span>
                                            {serverError}{' '}
                                            <a href={COMPANY.phoneHref} className="font-semibold underline underline-offset-2">{COMPANY.phone}</a>
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="max-w-sm text-[0.75rem] leading-relaxed text-ink-muted">
                                        We only use these details to reply to your enquiry. See our{' '}
                                        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand">privacy policy</a>.
                                    </p>
                                    <button
                                        type="submit"
                                        className="ef-btn ef-btn--primary ef-btn--lg w-full sm:w-auto"
                                        disabled={isSubmitting}
                                        aria-busy={isSubmitting || undefined}
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="animate-spin" aria-hidden="true" /> Sending…</>
                                        ) : (
                                            <>Send enquiry <ArrowRight className="ef-btn__arrow" aria-hidden="true" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}

export default GiftEnquiryForm
