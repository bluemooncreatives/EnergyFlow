'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    Clock3,
    Copy,
    Ellipsis,
    FileCheck2,
    Handshake,
    Heart,
    Loader2,
    Mail,
    MessageCircle,
    Mic2,
    Phone,
    ShieldCheck,
    Sparkles,
} from 'lucide-react'
import { PhoneInput } from '@/components/ui/phone-input'
import { COMPANY } from '@/lib/company'
import { USER_ENQUIRIES, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import {
    BUDGETS,
    MAX_GIFT_QUANTITY,
    MIN_GIFT_QUANTITY,
    OCCASIONS,
    QUANTITY_PRESETS,
    giftEnquirySchema,
    labelFor,
    todayInputValue,
} from '@/lib/giftEnquiry'
import { formatProductName } from '@/lib/seo'
import { scrollToElement } from '@/lib/scroll'
import { cn } from '@/lib/utils'
import { COLLECTION_ANCHOR, ENQUIRY_ANCHOR, useGiftingSelection } from './GiftingSelection'
import { WHATSAPP_HREF, pad, photoOf } from './GiftingUi'

// Field styles, all built from the storefront tokens.
const LABEL = 'mb-1.5 block text-[0.8125rem] font-semibold text-ink-strong'
const LEGEND = 'mb-3 text-[0.8125rem] font-semibold text-ink-strong'
const OPTIONAL = 'font-normal text-ink-muted'
const REQ = 'text-destructive'
const INPUT = 'h-12 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface-page px-4 text-[0.9375rem] text-ink-strong transition-[border-color,box-shadow,background-color] placeholder:text-ink-muted hover:border-line-rule focus:border-brand-bright focus:bg-surface-card focus:outline-none focus:ring-4 focus:ring-brand-bright/15 aria-[invalid=true]:border-destructive'
// Choice inputs: the real input covers its face, stays in the tab order and
// drives the look through peer-checked / peer-focus-visible.
const CHOICE_INPUT = 'peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0'
const FOCUS_PEER = 'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring'
const CHIP_FACE = cn(
    'inline-flex min-h-10 items-center rounded-full bg-surface-page px-4 py-2 text-[0.875rem] font-medium text-ink-strong ring-1 ring-inset ring-line-strong transition-colors peer-hover:ring-brand-bright peer-checked:bg-brand peer-checked:text-on-brand peer-checked:ring-brand',
    FOCUS_PEER
)

const OCCASION_ICONS = {
    diwali: Sparkles,
    employees: BriefcaseBusiness,
    clients: Handshake,
    events: Mic2,
    wedding: Heart,
    other: Ellipsis,
}

// The three steps and the fields each one owns (for per-step validation, and
// to send the visitor back to whichever step a server error points at).
const STEPS = [
    { title: 'Your order', note: 'What, how many, and for what budget.', fields: ['occasion', 'quantity', 'budget'] },
    { title: 'Delivery & details', note: 'When and where, plus any finishing touches.', fields: ['deliveryDate', 'city', 'branding', 'message'] },
    { title: 'Your contact', note: 'So our gifting team can send your quote.', fields: ['name', 'company', 'email', 'phone'] },
]
const LAST = STEPS.length - 1
const stepOf = (field) => Math.max(0, STEPS.findIndex((s) => s.fields.includes(field)))

const NEXT_STEPS = [
    { Icon: Clock3, text: 'Our gifting team replies within one working day.' },
    { Icon: FileCheck2, text: 'One quote covering boxes, branding and delivery.' },
    { Icon: ShieldCheck, text: 'No commitment until you approve it.' },
]

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

const formatDate = (value) => {
    if (!value) return ''
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FieldError = ({ id, message }) =>
    message ? (
        <p id={id} className="mt-1.5 flex items-center gap-1.5 text-[0.8125rem] text-destructive" role="alert">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> {message}
        </p>
    ) : null

// "01 ── 02 ── 03" progress across the top of the form. Earlier steps can be
// revisited; a later one is reached by validating the steps before it.
const Stepper = ({ step, onGo }) => (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Enquiry steps">
        {STEPS.map(({ title }, i) => {
            const done = i < step
            const current = i === step
            return (
                <li key={title} className={cn('flex min-w-0 items-center gap-2 sm:gap-3', i < LAST && 'flex-1')}>
                    <button
                        type="button"
                        onClick={() => onGo(i)}
                        aria-current={current ? 'step' : undefined}
                        className="ef-focus group flex min-w-0 items-center gap-2.5 rounded-full text-left"
                    >
                        <span
                            className={cn(
                                'grid size-9 shrink-0 place-items-center rounded-full text-[0.75rem] font-bold tabular-nums transition-colors',
                                current && 'bg-brand text-on-brand shadow-elev-2',
                                done && 'bg-tint-pistachio text-brand-bright',
                                !current && !done && 'bg-surface-page text-ink-muted ring-1 ring-inset ring-line-strong group-hover:ring-brand-bright'
                            )}
                        >
                            {done ? <Check className="size-4" strokeWidth={3} aria-hidden="true" /> : pad(i + 1)}
                        </span>
                        <span className={cn('truncate text-[0.8125rem] font-semibold', current ? 'text-ink-strong' : 'text-ink-muted max-md:sr-only')}>
                            {title}
                            {done && <span className="sr-only"> (done)</span>}
                        </span>
                    </button>
                    {i < LAST && (
                        <span aria-hidden="true" className="relative h-0.5 min-w-4 flex-1 overflow-hidden rounded-full bg-line-strong">
                            <span className={cn('absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none', done ? 'w-full' : 'w-0')} />
                        </span>
                    )}
                </li>
            )
        })}
    </ol>
)

// One line of the brief ticket.
const BriefRow = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
        <dt className="shrink-0 text-[0.75rem] uppercase text-cream/60">{label}</dt>
        <dd className={cn('min-w-0 text-right text-[0.9375rem] font-medium', value ? 'text-cream' : 'text-cream/35')}>{value || '—'}</dd>
    </div>
)

/**
 * "Tell us what you're gifting" — the corporate / bulk enquiry, as a
 * three-step brief builder (order → delivery & details → contact) beside a
 * live "Your brief" ticket that fills in as the visitor answers.
 *
 * Each step is validated before the next; Enter on an early step moves on
 * rather than submitting. The draft survives a reload (sessionStorage), a
 * signed-in customer's name and email are filled in, and any "Enquire" button
 * or occasion tile on the page brings the form back to its first step.
 */
const GiftEnquiryForm = ({ products = [] }) => {
    const auth = useSelector((store) => store.authStore?.auth)
    const { selected, setSelected, toggle, enquiryRequest } = useGiftingSelection()
    const [step, setStep] = useState(0)
    const [minDate, setMinDate] = useState(undefined)
    const [serverError, setServerError] = useState('')
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)
    const hpRef = useRef(null)
    const panelRef = useRef(null)
    const cardRef = useRef(null)
    const stepHeadRef = useRef(null)
    const successRef = useRef(null)
    const restoredRef = useRef(false)
    const movedRef = useRef(false)

    const {
        register,
        control,
        handleSubmit,
        setValue,
        setError,
        setFocus,
        reset,
        watch,
        trigger,
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

    // Any "Enquire" button or occasion tile further up: back to step one,
    // with the occasion pre-picked when the tile carried one.
    useEffect(() => {
        if (!enquiryRequest) return
        movedRef.current = false
        setStep(0)
        if (enquiryRequest.occasion) setValue('occasion', enquiryRequest.occasion, { shouldValidate: true, shouldDirty: true })
    }, [enquiryRequest, setValue])

    // On a step change the visitor made: bring the card's top into view if it
    // has scrolled off, and move focus to the new step's heading.
    useEffect(() => {
        if (!movedRef.current) return
        const card = cardRef.current
        if (card && card.getBoundingClientRect().top < 0) scrollToElement(card)
        stepHeadRef.current?.focus({ preventScroll: true })
    }, [step])

    const values = watch()
    const quantity = values.quantity
    const message = values.message || ''

    const goTo = async (target) => {
        if (target === step) return
        // Forward only past steps that check out.
        for (let i = step; i < target; i++) {
            const ok = await trigger(STEPS[i].fields, { shouldFocus: true })
            if (!ok) {
                if (i !== step) { movedRef.current = true; setStep(i) }
                return
            }
        }
        movedRef.current = true
        setStep(target)
    }

    const onSubmit = async (formValues) => {
        setServerError('')
        try {
            const { data } = await axios.post(
                '/api/gift-enquiry',
                {
                    ...formValues,
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
                    movedRef.current = true
                    setStep(stepOf(field))
                    window.setTimeout(() => setFocus(field), 60)
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
                email: formValues.email,
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

    // Validation failed on send: open the first step with a problem.
    const onInvalid = (fieldErrors) => {
        const first = FIELDS.find((field) => fieldErrors[field])
        if (!first) return
        movedRef.current = true
        setStep(stepOf(first))
        window.setTimeout(() => setFocus(first), 60)
    }

    // Enter on an early step moves on; only the last step sends.
    const onFormSubmit = step === LAST
        ? handleSubmit(onSubmit, onInvalid)
        : (event) => { event.preventDefault(); goTo(step + 1) }

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
        movedRef.current = false
        setStep(0)
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

    // What the ticket shows, and how much of the brief is in.
    const picked = products.filter((p) => selected.includes(p._id))
    const brief = [
        { label: 'Occasion', value: labelFor(OCCASIONS, values.occasion) },
        { label: 'Boxes', value: Number(quantity) > 0 ? `${Number(quantity).toLocaleString('en-IN')} boxes` : '' },
        { label: 'Budget / box', value: labelFor(BUDGETS, values.budget) },
        { label: 'Needed by', value: formatDate(values.deliveryDate) },
        { label: 'Deliver to', value: values.city?.trim() },
        { label: 'Branding', value: values.branding ? 'Yes, add our branding' : '' },
    ]
    const filled = brief.filter((row) => row.value).length + (picked.length ? 1 : 0)
    const briefTotal = brief.length + 1

    return (
        <section id={ENQUIRY_ANCHOR} className="ef-section ef-section--page scroll-mt-20" aria-labelledby="enquiry-title">
            <div className="ef-container">
                {/* ── Heading ── */}
                <div className="mb-[var(--section-gap)] grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-10">
                    <div><span className="ef-eyebrow">Corporate &amp; bulk orders</span></div>
                    <div className="flex flex-col items-start gap-4">
                        <h2 id="enquiry-title" className="ef-title">
                            Tell us what you&apos;re <span className="ef-title__accent">gifting</span>
                        </h2>
                        <p className="ef-lead max-w-2xl">
                            Three short steps, about two minutes. Our gifting team comes back with box options, a quote at
                            volume pricing and delivery timelines.
                        </p>
                        <ul className="flex flex-wrap gap-2">
                            {[`Bulk orders from ${MIN_GIFT_QUANTITY} boxes`, 'Logo sleeves & notes', 'Reply in 1 working day'].map((item) => (
                                <li key={item} className="ef-badge ef-badge--soft gap-1.5">
                                    <Check className="size-3.5 text-brand-bright" strokeWidth={3} aria-hidden="true" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div ref={panelRef} className="grid scroll-mt-28 items-start gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)] lg:gap-8">
                    {/* ── Form / success ── */}
                    <div ref={cardRef} className="ef-card scroll-mt-28 rounded-tile p-[clamp(1.25rem,3.5vw,2.5rem)] shadow-elev-2">
                        {result ? (
                            <div className="flex flex-col items-start gap-5" aria-live="polite">
                                <span className="ef-seal ef-seal--forest !size-16"><CheckCircle2 aria-hidden="true" /></span>
                                <h3 ref={successRef} tabIndex={-1} className="ef-title ef-title--md outline-none">
                                    {result.duplicate ? 'Already with our team' : 'Brief received, thank you!'}
                                </h3>
                                <p className="ef-lead max-w-lg">
                                    {result.duplicate
                                        ? result.message
                                        : 'Our gifting team will review your brief and get back to you within one working day. A confirmation is on its way to your inbox.'}
                                </p>
                                {result.ticketId && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[0.75rem] font-semibold uppercase text-ink-muted">Your reference</span>
                                        <span className="inline-flex items-center gap-3 rounded-card bg-tint-honey py-3 pl-4 pr-3 font-mono text-lg font-bold tracking-wider text-ink-strong ring-1 ring-inset ring-line-strong">
                                            {result.ticketId}
                                            <button
                                                type="button"
                                                onClick={copyRef}
                                                className="ef-icon-btn !size-9"
                                                aria-label={copied ? 'Reference copied' : 'Copy reference'}
                                            >
                                                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
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
                            <form onSubmit={onFormSubmit} noValidate aria-describedby="gift-form-note">
                                <Stepper step={step} onGo={goTo} />

                                <div className="mt-7 border-t border-line-soft pt-7">
                                    <p className="text-[0.75rem] font-semibold uppercase tabular-nums text-ink-muted">
                                        Step {step + 1} of {STEPS.length}
                                    </p>
                                    <h3
                                        ref={stepHeadRef}
                                        tabIndex={-1}
                                        className="mt-1 font-header text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold uppercase leading-none text-ink-strong outline-none"
                                    >
                                        {STEPS[step].title}
                                    </h3>
                                    <p id="gift-form-note" className="mt-2 text-[0.875rem] text-ink-muted">
                                        {STEPS[step].note} Fields marked <span className={REQ}>*</span> are required.
                                    </p>
                                </div>

                                <div key={step} className="mt-7 flex flex-col gap-7 duration-300 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                                    {step === 0 && (
                                        <>
                                            <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={errId('occasion')}>
                                                <legend className={LEGEND}>What&apos;s the occasion? <span className={REQ}>*</span></legend>
                                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                                    {OCCASIONS.map((o) => {
                                                        const Icon = OCCASION_ICONS[o.value] || Ellipsis
                                                        return (
                                                            <label key={o.value} className="relative">
                                                                <input type="radio" value={o.value} className={CHOICE_INPUT} {...register('occasion')} />
                                                                <span className={cn(
                                                                    'flex h-full flex-col items-start gap-3 rounded-card bg-surface-page p-3.5 text-[0.875rem] font-semibold leading-snug text-ink-strong ring-1 ring-inset ring-line-strong transition-colors peer-hover:ring-brand-bright peer-checked:bg-brand peer-checked:text-on-brand peer-checked:ring-brand',
                                                                    FOCUS_PEER
                                                                )}>
                                                                    <Icon className="size-5 opacity-80" strokeWidth={1.75} aria-hidden="true" />
                                                                    {o.label}
                                                                </span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                                <FieldError id={errId('occasion')} message={errors.occasion?.message} />
                                            </fieldset>

                                            <div className="grid gap-7 md:grid-cols-2 md:gap-6">
                                                <div>
                                                    <label htmlFor="gift-quantity" className={LABEL}>
                                                        How many boxes? <span className={REQ}>*</span>
                                                    </label>
                                                    <input
                                                        id="gift-quantity"
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={MIN_GIFT_QUANTITY}
                                                        max={MAX_GIFT_QUANTITY}
                                                        step={1}
                                                        placeholder={`At least ${MIN_GIFT_QUANTITY}`}
                                                        className={INPUT}
                                                        aria-invalid={errors.quantity ? 'true' : 'false'}
                                                        aria-describedby={['gift-quantity-hint', errId('quantity')].filter(Boolean).join(' ')}
                                                        {...register('quantity')}
                                                    />
                                                    <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Quick quantities">
                                                        {QUANTITY_PRESETS.map((n) => (
                                                            <button
                                                                key={n}
                                                                type="button"
                                                                onClick={() => setValue('quantity', String(n), { shouldValidate: true, shouldDirty: true })}
                                                                aria-pressed={String(quantity) === String(n)}
                                                                className={cn(
                                                                    'ef-focus rounded-full px-3 py-1.5 text-[0.8125rem] font-medium tabular-nums transition-colors',
                                                                    String(quantity) === String(n)
                                                                        ? 'bg-brand text-on-brand'
                                                                        : 'bg-surface-page text-ink-strong ring-1 ring-inset ring-line-strong hover:ring-brand-bright'
                                                                )}
                                                            >
                                                                {n === QUANTITY_PRESETS[QUANTITY_PRESETS.length - 1] ? `${n}+` : n}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p id="gift-quantity-hint" className="mt-2 text-[0.75rem] text-ink-muted">
                                                        Need fewer than {MIN_GIFT_QUANTITY}? Buy single boxes from the collection above.
                                                    </p>
                                                    <FieldError id={errId('quantity')} message={errors.quantity?.message} />
                                                </div>

                                                <fieldset className="m-0 min-w-0 border-0 p-0">
                                                    <legend className={LEGEND}>Budget per box <span className={OPTIONAL}>(optional)</span></legend>
                                                    <div className="flex flex-wrap gap-2">
                                                        {BUDGETS.map((b) => (
                                                            <label key={b.value} className="relative">
                                                                <input type="radio" value={b.value} className={CHOICE_INPUT} {...register('budget')} />
                                                                <span className={CHIP_FACE}>{b.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                            </div>

                                            {products.length > 0 && (
                                                <fieldset className="m-0 min-w-0 border-0 p-0">
                                                    <legend className={LEGEND}>
                                                        Boxes you like <span className={OPTIONAL}>(optional — pick any, or leave it to us)</span>
                                                    </legend>
                                                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                                        {products.map((p) => {
                                                            const name = formatProductName(p.name)
                                                            const img = photoOf(p)
                                                            const checked = selected.includes(p._id)
                                                            return (
                                                                <label key={p._id} className="relative">
                                                                    <input type="checkbox" checked={checked} onChange={() => toggle(p._id)} className={CHOICE_INPUT} />
                                                                    <span className={cn(
                                                                        'flex h-full flex-col gap-2 rounded-card bg-surface-page p-1.5 pb-2.5 ring-1 ring-inset ring-line-strong transition-colors peer-hover:ring-brand-bright peer-checked:bg-tint-pistachio peer-checked:ring-2 peer-checked:ring-brand-bright',
                                                                        FOCUS_PEER
                                                                    )}>
                                                                        <span className="relative block aspect-[4/3] overflow-hidden rounded-[var(--radius-well)] bg-surface-well">
                                                                            {img && <Image src={img} alt="" fill sizes="(max-width: 640px) 45vw, 14rem" className="object-cover" />}
                                                                            <span
                                                                                aria-hidden="true"
                                                                                className={cn(
                                                                                    'absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full shadow-elev-1 transition-colors',
                                                                                    checked ? 'bg-brand-bright text-cream' : 'bg-surface-card/90 text-transparent'
                                                                                )}
                                                                            >
                                                                                <Check className="size-3.5" strokeWidth={3} />
                                                                            </span>
                                                                        </span>
                                                                        <span className="px-1 text-[0.8125rem] font-semibold leading-tight text-ink-strong">{name}</span>
                                                                        <span className="sr-only">{checked ? '(selected)' : ''}</span>
                                                                    </span>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </fieldset>
                                            )}
                                        </>
                                    )}

                                    {step === 1 && (
                                        <>
                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div>
                                                    <label htmlFor="gift-date" className={LABEL}>Needed by <span className={OPTIONAL}>(optional)</span></label>
                                                    <input id="gift-date" type="date" min={minDate} className={INPUT}
                                                        aria-invalid={errors.deliveryDate ? 'true' : 'false'} aria-describedby={errId('deliveryDate')} {...register('deliveryDate')} />
                                                    <FieldError id={errId('deliveryDate')} message={errors.deliveryDate?.message} />
                                                </div>
                                                <div>
                                                    <label htmlFor="gift-city" className={LABEL}>Delivery city <span className={OPTIONAL}>(optional)</span></label>
                                                    <input id="gift-city" type="text" autoComplete="address-level2" maxLength={60} className={INPUT}
                                                        placeholder="e.g. Gurugram, or multiple cities" aria-invalid={errors.city ? 'true' : 'false'}
                                                        aria-describedby={errId('city')} {...register('city')} />
                                                    <FieldError id={errId('city')} message={errors.city?.message} />
                                                </div>
                                            </div>

                                            <label className="relative block">
                                                <input type="checkbox" className={CHOICE_INPUT} {...register('branding')} />
                                                <span className={cn(
                                                    'flex items-start gap-4 rounded-card bg-surface-page p-4 ring-1 ring-inset ring-line-strong transition-colors peer-hover:ring-brand-bright peer-checked:bg-tint-pistachio peer-checked:ring-brand-bright',
                                                    FOCUS_PEER
                                                )}>
                                                    <span className="ef-seal ef-seal--sun !size-12 shrink-0"><Sparkles aria-hidden="true" /></span>
                                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className="text-[0.9375rem] font-semibold text-ink-strong">Add custom branding</span>
                                                        <span className="text-[0.8125rem] leading-relaxed text-ink-muted">Your logo on the sleeve, a printed message card, or personalised notes.</span>
                                                    </span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            'relative mt-1 h-6 w-10 shrink-0 rounded-full transition-colors after:absolute after:left-[3px] after:top-[3px] after:size-[1.125rem] after:rounded-full after:bg-surface-card after:shadow-elev-1 after:transition-transform',
                                                            values.branding ? 'bg-brand-bright after:translate-x-4' : 'bg-line-strong'
                                                        )}
                                                    />
                                                </span>
                                            </label>

                                            <div>
                                                <label htmlFor="gift-message" className={LABEL}>
                                                    Anything else? <span className={OPTIONAL}>(optional)</span>
                                                </label>
                                                <textarea
                                                    id="gift-message"
                                                    rows={4}
                                                    maxLength={MESSAGE_MAX}
                                                    className={cn(INPUT, 'h-auto min-h-[7.5rem] resize-y py-3 leading-relaxed')}
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
                                        </>
                                    )}

                                    {step === 2 && (
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="gift-name" className={LABEL}>Your name <span className={REQ}>*</span></label>
                                                <input id="gift-name" type="text" autoComplete="name" maxLength={80} className={INPUT}
                                                    aria-invalid={errors.name ? 'true' : 'false'} aria-describedby={errId('name')} {...register('name')} />
                                                <FieldError id={errId('name')} message={errors.name?.message} />
                                            </div>
                                            <div>
                                                <label htmlFor="gift-company" className={LABEL}>Company <span className={OPTIONAL}>(optional)</span></label>
                                                <input id="gift-company" type="text" autoComplete="organization" maxLength={120} className={INPUT}
                                                    aria-invalid={errors.company ? 'true' : 'false'} aria-describedby={errId('company')} {...register('company')} />
                                                <FieldError id={errId('company')} message={errors.company?.message} />
                                            </div>
                                            <div>
                                                <label htmlFor="gift-email" className={LABEL}>Work email <span className={REQ}>*</span></label>
                                                <input id="gift-email" type="email" autoComplete="email" inputMode="email" maxLength={254} className={INPUT}
                                                    aria-invalid={errors.email ? 'true' : 'false'} aria-describedby={errId('email')} {...register('email')} />
                                                <FieldError id={errId('email')} message={errors.email?.message} />
                                            </div>
                                            <div>
                                                <label htmlFor="gift-phone" className={LABEL}>Phone <span className={REQ}>*</span></label>
                                                <Controller
                                                    name="phone"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <PhoneInput
                                                            native
                                                            id="gift-phone"
                                                            autoComplete="tel"
                                                            className={INPUT}
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
                                        </div>
                                    )}
                                </div>

                                {/* Honeypot: hidden from people and assistive tech. */}
                                <div className="!absolute !-left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
                                    <label htmlFor="gift-website">Website</label>
                                    <input ref={hpRef} id="gift-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
                                </div>

                                {serverError && step === LAST && (
                                    <div role="alert" className="mt-6 flex items-start gap-3 rounded-card bg-destructive/10 p-4 text-[0.875rem] text-destructive">
                                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                        <span>
                                            {serverError}{' '}
                                            <a href={COMPANY.phoneHref} className="font-semibold underline underline-offset-2">{COMPANY.phone}</a>
                                        </span>
                                    </div>
                                )}

                                {/* ── Step navigation ── */}
                                <div className="mt-8 flex flex-col-reverse gap-4 border-t border-line-soft pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    {step > 0 ? (
                                        <button type="button" className="ef-btn ef-btn--outline" onClick={() => goTo(step - 1)}>
                                            <ArrowLeft aria-hidden="true" /> Back
                                        </button>
                                    ) : (
                                        <p className="text-[0.75rem] leading-relaxed text-ink-muted">Your answers are saved on this device as you go.</p>
                                    )}

                                    {step < LAST ? (
                                        <button type="submit" className="ef-btn ef-btn--primary ef-btn--lg w-full sm:w-auto">
                                            Continue<span className="max-sm:hidden"> to {STEPS[step + 1].title.toLowerCase()}</span>
                                            <ArrowRight className="ef-btn__arrow" aria-hidden="true" />
                                        </button>
                                    ) : (
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
                                    )}
                                </div>
                                {step === LAST && (
                                    <p className="mt-4 text-[0.75rem] leading-relaxed text-ink-muted">
                                        We only use these details to reply to your enquiry. See our{' '}
                                        <a href="/privacy-policy" className="underline underline-offset-2 hover:text-brand">privacy policy</a>.
                                    </p>
                                )}
                            </form>
                        )}
                    </div>

                    {/* ── Live brief + direct lines ── */}
                    <aside className="flex flex-col gap-[var(--grid-gap)] lg:sticky lg:top-28" aria-label="Your gifting brief">
                        <div className="ef-tile ef-on-inverse bg-pine p-6 text-cream shadow-elev-2">
                            <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 -z-10 size-48 rounded-full bg-sun/15 blur-2xl" />
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-header text-[1.375rem] font-semibold uppercase leading-none">Your brief</p>
                                <span className={cn('ef-badge', result ? 'ef-badge--sale' : 'bg-cream/10 text-cream')}>
                                    {result ? 'Sent' : `${filled} / ${briefTotal}`}
                                </span>
                            </div>
                            <div className="mt-4 h-1 overflow-hidden rounded-full bg-cream/15" aria-hidden="true">
                                <span
                                    className="block h-full rounded-full bg-sun transition-[width] duration-500 ease-out motion-reduce:transition-none"
                                    style={{ width: `${result ? 100 : (filled / briefTotal) * 100}%` }}
                                />
                            </div>

                            <dl className="mt-3 divide-y divide-cream/10" aria-live="polite">
                                {brief.map((row) => <BriefRow key={row.label} {...row} />)}
                                <div className="flex items-center justify-between gap-4 py-2.5">
                                    <dt className="shrink-0 text-[0.75rem] uppercase text-cream/60">Boxes picked</dt>
                                    <dd className="flex min-w-0 items-center justify-end gap-1.5">
                                        {picked.length ? picked.map((p) => (
                                            <span key={p._id} className="relative size-8 overflow-hidden rounded-[var(--radius-well)] ring-2 ring-pine" title={formatProductName(p.name)}>
                                                {photoOf(p) && <Image src={photoOf(p)} alt={formatProductName(p.name)} fill sizes="32px" className="object-cover" />}
                                            </span>
                                        )) : <span className="text-[0.9375rem] text-cream/35">Leave it to us</span>}
                                    </dd>
                                </div>
                            </dl>

                            <div className="mt-4 border-t border-dashed border-cream/25 pt-5">
                                <p className="text-[0.75rem] font-semibold uppercase text-cream/60">What happens next</p>
                                <ul className="mt-3 flex flex-col gap-3">
                                    {NEXT_STEPS.map(({ Icon, text }) => (
                                        <li key={text} className="flex items-start gap-3 text-[0.875rem] leading-snug text-cream/85">
                                            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sun text-sun-ink">
                                                <Icon className="size-3.5" aria-hidden="true" />
                                            </span>
                                            <span className="pt-1">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="ef-card gap-3 p-5">
                            <p className="text-[0.75rem] font-semibold uppercase text-ink-muted">Prefer to talk?</p>
                            <div className="flex flex-col gap-2.5 text-[0.9375rem] text-ink-strong">
                                <a href={COMPANY.phoneHref} className="ef-focus inline-flex items-center gap-2.5 rounded-sm transition-colors hover:text-brand">
                                    <Phone className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.phone}
                                </a>
                                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ef-focus inline-flex items-center gap-2.5 rounded-sm transition-colors hover:text-brand">
                                    <MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp us
                                </a>
                                <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Corporate gifting enquiry')}`} className="ef-focus inline-flex items-center gap-2.5 break-all rounded-sm transition-colors hover:text-brand">
                                    <Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}
                                </a>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    )
}

export default GiftEnquiryForm
