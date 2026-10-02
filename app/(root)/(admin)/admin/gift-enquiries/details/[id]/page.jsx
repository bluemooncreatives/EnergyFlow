'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Gift,
  Globe,
  IndianRupee,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareQuote,
  Package,
  PackageX,
  Phone,
  Sparkles,
  Tag,
  User,
} from 'lucide-react'
import useFetch from '@/hooks/useFetch'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import AdminRecordState from '@/components/Application/Admin/AdminRecordState'
import { AdminLoadingState } from '@/components/Application/Admin/AdminEmptyState'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pill } from '@/lib/column'
import { BUDGETS, ENQUIRY_STATUSES, OCCASIONS, labelFor } from '@/lib/giftEnquiry'
import { showToast } from '@/lib/showToast'
import { productPath } from '@/lib/productRoute'
import { cn } from '@/lib/utils'
import { ADMIN_DASHBOARD, ADMIN_GIFT_ENQUIRIES_SHOW } from '@/routes/AdminPanelRoute'

dayjs.extend(relativeTime)

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_GIFT_ENQUIRIES_SHOW, label: 'Corporate Enquiries' },
  { href: '', label: 'View Enquiry' },
]

const header = {
  title: 'View Enquiry',
  description: 'Full brief for this corporate / bulk gifting request.',
  breadcrumb: <BreadCrumb breadcrumbData={breadcrumbData} />,
}

const NOTES_MAX = 4000

// What each pipeline step means, shown under its label in the status picker.
const STATUS_HINTS = {
  new: 'Not responded to yet',
  contacted: 'First call or email made',
  quoted: 'Pricing shared with the client',
  won: 'Client has placed the order',
  lost: 'No deal — enquiry closed',
}

// Per-box budget bands in rupees, for the rough order-value estimate.
const BUDGET_RANGE = {
  'under-1000': [null, 1000],
  '1000-2500': [1000, 2500],
  '2500-5000': [2500, 5000],
  '5000-plus': [5000, null],
}

const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(n)

const estimateValue = (budget, quantity) => {
  const range = BUDGET_RANGE[budget]
  const qty = Number(quantity) || 0
  if (!range || !qty) return null
  const [min, max] = range
  if (min == null) return `Up to ${inr(max * qty)}`
  if (max == null) return `${inr(min * qty)}+`
  return `${inr(min * qty)} – ${inr(max * qty)}`
}

// Days from today to the requested delivery date, as a short label + tone.
const deliveryCountdown = (date) => {
  if (!date) return null
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day')
  if (days < 0) return { label: 'Date has passed', tone: 'danger' }
  if (days === 0) return { label: 'Due today', tone: 'danger' }
  if (days === 1) return { label: 'Due tomorrow', tone: 'danger' }
  return { label: `In ${days} days`, tone: days <= 14 ? 'sun' : 'pine' }
}

// wa.me needs the number with its country code and no symbols; a bare
// 10-digit number is an Indian mobile.
const whatsappHref = (phone, text) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}?text=${encodeURIComponent(text)}`
}

const initialsOf = (value) =>
  String(value || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')

const CopyButton = ({ value, label }) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      showToast('error', 'Could not copy to clipboard.')
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
    </button>
  )
}

const Section = ({ title, icon: Icon, children, className }) => (
  <section className={cn('rounded-xl border bg-card', className)}>
    <h4 className="flex items-center gap-2 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
      <Icon className="size-3.5" aria-hidden="true" />
      {title}
    </h4>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
)

const Muted = ({ children = 'Not provided' }) => (
  <span className="font-normal italic text-muted-foreground">{children}</span>
)

const StatTile = ({ icon: Icon, label, value, empty, footer }) => (
  <div className="flex min-w-0 flex-col rounded-xl bg-secondary/60 p-4">
    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </p>
    <p className={cn('mt-2 break-words text-base font-semibold leading-snug sm:text-lg', empty && 'font-normal italic text-muted-foreground sm:text-base')}>
      {value}
    </p>
    {footer && <div className="mt-auto pt-2">{footer}</div>}
  </div>
)

const ContactRow = ({ icon: Icon, label, children, copy }) => (
  <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="break-words text-sm font-medium">{children}</div>
    </div>
    {copy && <CopyButton value={copy} label={label.toLowerCase()} />}
  </div>
)

const GiftEnquiryDetail = ({ params }) => {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const { data, loading, error, errorStatus, refetch } = useFetch(`/api/gift-enquiry/get/${id}`)
  const [enquiry, setEnquiry] = useState(null)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data?.success) return
    setEnquiry(data.data)
    setStatus(data.data.status || 'new')
    setNotes(data.data.adminNotes || '')
    // Opening it marked the enquiry read — refresh the sidebar count and list.
    queryClient.invalidateQueries({ queryKey: ['gift-enquiry-stats'] })
    queryClient.invalidateQueries({ queryKey: ['gift-enquiries-data'] })
  }, [data, queryClient])

  const savedStatus = enquiry?.status || 'new'
  const dirty = Boolean(enquiry) && (status !== savedStatus || notes.trim() !== (enquiry.adminNotes || ''))

  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const { data: res } = await axios.put('/api/gift-enquiry/update', { _id: id, status, adminNotes: notes })
      if (!res.success) throw new Error(res.message)
      setEnquiry(res.data)
      setNotes(res.data.adminNotes || '')
      queryClient.invalidateQueries({ queryKey: ['gift-enquiries-data'] })
      showToast('success', res.message)
    } catch (err) {
      showToast('error', err?.response?.data?.message || err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setStatus(savedStatus)
    setNotes(enquiry?.adminNotes || '')
  }

  if (!enquiry && !loading && error) {
    return (
      <AdminRecordState
        entity="Enquiry"
        error={error}
        errorStatus={errorStatus}
        onRetry={refetch}
        backHref={ADMIN_GIFT_ENQUIRIES_SHOW}
        backLabel="Back to enquiries"
        header={header}
      />
    )
  }

  if (!enquiry) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <PageHeader {...header} />
        <div className="rounded-md bg-card">
          <AdminLoadingState label="Loading enquiry…" className="py-24" />
        </div>
      </div>
    )
  }

  const currentStatus = ENQUIRY_STATUSES.find((s) => s.value === savedStatus)
  const firstName = enquiry.name.split(' ')[0]
  const title = enquiry.company || enquiry.name
  const occasion = labelFor(OCCASIONS, enquiry.occasion)
  const quantity = Number(enquiry.quantity || 0).toLocaleString('en-IN')
  const budget = labelFor(BUDGETS, enquiry.budget)
  const estimate = estimateValue(enquiry.budget, enquiry.quantity)
  const countdown = deliveryCountdown(enquiry.deliveryDate)
  const reference = enquiry.ticketId ? ` (ref. ${enquiry.ticketId})` : ''
  const replySubject = `Your gifting enquiry${reference}`
  const replyBody = `Hi ${firstName},\n\nThank you for your enquiry about ${quantity} gift boxes for ${occasion.toLowerCase()}.\n\n`
  const wa = whatsappHref(
    enquiry.phone,
    `Hi ${firstName}, this is EnergyFlow regarding your gifting enquiry${reference} for ${quantity} boxes.`
  )
  const linearSteps = ENQUIRY_STATUSES.filter((s) => s.value !== 'lost')
  const stepIndex = linearSteps.findIndex((s) => s.value === status)

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        {...header}
        actions={
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href={ADMIN_GIFT_ENQUIRIES_SHOW}>
              <ArrowLeft aria-hidden="true" /> All enquiries
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-md bg-card">
        {/* Summary: who, how much, where it stands, and how to reach them */}
        <div className="flex flex-col gap-5 border-b p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-base font-semibold text-primary-foreground sm:size-14 sm:text-lg"
              aria-hidden="true"
            >
              {initialsOf(title)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {currentStatus && <Pill tone={currentStatus.tone}>{currentStatus.label}</Pill>}
                {enquiry.deletedAt && <Pill tone="danger">In trash</Pill>}
                {enquiry.ticketId && (
                  <span className="inline-flex items-center gap-0.5 font-mono text-xs font-semibold tracking-wide text-muted-foreground">
                    {enquiry.ticketId}
                    <CopyButton value={enquiry.ticketId} label="reference" />
                  </span>
                )}
              </div>
              <h3 className="mt-1 break-words font-display text-xl font-semibold leading-tight sm:text-2xl">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {quantity} boxes · {occasion}
                {enquiry.company && enquiry.company !== enquiry.name && <> · {enquiry.name}</>}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                <time dateTime={enquiry.createdAt} title={dayjs(enquiry.createdAt).format('DD MMM YYYY, hh:mm A')}>
                  Received {dayjs(enquiry.createdAt).fromNow()} · {dayjs(enquiry.createdAt).format('DD MMM YYYY, hh:mm A')}
                </time>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap lg:shrink-0">
            <Button asChild className="h-10">
              <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`}>
                <Mail aria-hidden="true" /> Reply by email
              </a>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <a href={`tel:${enquiry.phone}`}>
                <Phone aria-hidden="true" /> Call {firstName}
              </a>
            </Button>
            {wa && (
              <Button asChild variant="outline" className="h-10">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" /> WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:gap-6 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
            {/* The ask, at a glance */}
            <div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile icon={Package} label="Boxes" value={quantity} />
                <StatTile icon={Tag} label="Occasion" value={occasion} />
                <StatTile icon={IndianRupee} label="Budget / box" value={budget || 'Not specified'} empty={!budget} />
                <StatTile
                  icon={CalendarDays}
                  label="Needed by"
                  value={enquiry.deliveryDate ? dayjs(enquiry.deliveryDate).format('DD MMM YYYY') : 'Flexible'}
                  empty={!enquiry.deliveryDate}
                  footer={countdown && <Pill tone={countdown.tone} dot={false}>{countdown.label}</Pill>}
                />
              </div>
              {estimate && (
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Estimated order value</span>
                  <span className="font-semibold tabular-nums">{estimate}</span>
                  <span className="text-xs text-muted-foreground">({quantity} boxes × {budget})</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <Section title="Client" icon={User}>
                <div className="divide-y">
                  <ContactRow icon={User} label="Contact person">{enquiry.name}</ContactRow>
                  <ContactRow icon={Building2} label="Company">
                    {enquiry.company || <Muted>Personal / not given</Muted>}
                  </ContactRow>
                  <ContactRow icon={Mail} label="Email" copy={enquiry.email}>
                    <a href={`mailto:${enquiry.email}`} className="break-all text-[var(--brand-primary)] hover:underline">
                      {enquiry.email}
                    </a>
                  </ContactRow>
                  <ContactRow icon={Phone} label="Phone" copy={enquiry.phone}>
                    <a href={`tel:${enquiry.phone}`} className="tabular-nums text-[var(--brand-primary)] hover:underline">
                      {enquiry.phone}
                    </a>
                  </ContactRow>
                  <ContactRow icon={MapPin} label="City">{enquiry.city || <Muted />}</ContactRow>
                </div>
              </Section>

              <Section title="Requirements" icon={Gift}>
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">Custom branding</p>
                    {enquiry.branding ? (
                      <p className="flex items-start gap-2 text-sm font-medium">
                        <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--brand-olive)]" aria-hidden="true" />
                        Yes — logo / personalised packaging
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not needed — standard packaging</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Boxes of interest{enquiry.products?.length ? ` (${enquiry.products.length})` : ''}
                    </p>
                    {enquiry.products?.length ? (
                      <ul className="flex flex-col gap-2">
                        {enquiry.products.map((p) => {
                          const inner = (
                            <>
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                                <Gift className="size-4 text-muted-foreground" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                              {p.slug && <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                            </>
                          )
                          return (
                            <li key={p.product || p.name}>
                              {p.slug ? (
                                <Link
                                  href={productPath(p.slug)}
                                  target="_blank"
                                  className="flex items-center gap-3 rounded-lg border p-2 pr-3 text-sm transition-colors hover:border-[var(--brand-primary)] hover:bg-secondary/40"
                                >
                                  {inner}
                                  <span className="sr-only">(opens in a new tab)</span>
                                </Link>
                              ) : (
                                <div className="flex items-center gap-3 rounded-lg border p-2 pr-3 text-sm">{inner}</div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PackageX className="size-4 shrink-0" aria-hidden="true" />
                        No specific box chosen — open to suggestions
                      </p>
                    )}
                  </div>
                </div>
              </Section>
            </div>

            <Section title="Message from client" icon={MessageSquareQuote}>
              {enquiry.message ? (
                <blockquote className="whitespace-pre-wrap border-l-2 border-[var(--brand-primary)] pl-4 text-sm leading-relaxed">
                  {enquiry.message}
                </blockquote>
              ) : (
                <p className="text-sm text-muted-foreground">No message — the brief above is everything they shared.</p>
              )}
            </Section>

            {enquiry.pagePath && (
              <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="size-3.5" aria-hidden="true" />
                Submitted from
                <Link href={enquiry.pagePath} target="_blank" className="font-mono text-foreground hover:underline">
                  {enquiry.pagePath}
                </Link>
              </p>
            )}
          </div>

          {/* Pipeline */}
          <aside className="xl:sticky xl:top-4 xl:self-start">
            <section className="rounded-xl border bg-card">
              <div className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline</h4>
                {dirty && !enquiry.deletedAt && <Pill tone="sun" dot>Unsaved</Pill>}
              </div>

              {enquiry.deletedAt ? (
                <p className="p-4 text-sm text-muted-foreground sm:p-5">Restore this enquiry from the trash to update it.</p>
              ) : (
                <div className="flex flex-col gap-5 p-4 sm:p-5">
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">Status</legend>
                    <div className="flex flex-col gap-1.5">
                      {ENQUIRY_STATUSES.map((s) => {
                        const index = linearSteps.findIndex((step) => step.value === s.value)
                        const checked = status === s.value
                        const done = status !== 'lost' && index !== -1 && index < stepIndex
                        const isLost = s.value === 'lost'
                        return (
                          <label
                            key={s.value}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                              checked
                                ? isLost
                                  ? 'border-destructive/50 bg-destructive/5'
                                  : 'border-[var(--brand-primary)] bg-secondary/60'
                                : 'border-transparent hover:bg-secondary/40',
                              isLost && 'mt-1.5'
                            )}
                          >
                            <input
                              type="radio"
                              name="enquiry-status"
                              value={s.value}
                              checked={checked}
                              onChange={() => setStatus(s.value)}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                                checked && !isLost && 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-primary-foreground',
                                checked && isLost && 'border-destructive bg-destructive text-white',
                                done && 'border-success bg-success text-white',
                                !checked && !done && 'border-muted-foreground/30'
                              )}
                              aria-hidden="true"
                            >
                              {(checked || done) && <Check className="size-3" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0">
                              <span className={cn('block text-sm', checked ? 'font-semibold' : 'font-medium')}>{s.label}</span>
                              <span className="block text-xs text-muted-foreground">{STATUS_HINTS[s.value]}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="mt-2.5 text-xs text-muted-foreground">
                      {enquiry.user
                        ? 'The customer sees status changes live under Enquiries in their account. Notes stay internal.'
                        : 'Sent as a guest — it appears in the customer’s account once they sign in with this verified email.'}
                    </p>
                  </fieldset>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="enquiry-notes">Internal notes</Label>
                    <Textarea
                      id="enquiry-notes"
                      rows={5}
                      maxLength={NOTES_MAX}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault()
                          save()
                        }
                      }}
                      placeholder="Quote sent, follow-up date, preferred boxes…"
                      aria-describedby="enquiry-notes-hint"
                    />
                    <p id="enquiry-notes-hint" className="flex justify-between gap-2 text-xs text-muted-foreground">
                      <span>Only visible to admins</span>
                      <span className="tabular-nums">{notes.length.toLocaleString('en-IN')}/{NOTES_MAX.toLocaleString('en-IN')}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {dirty && (
                      <Button type="button" variant="outline" onClick={discard} disabled={saving} className="h-10 cursor-pointer">
                        Discard
                      </Button>
                    )}
                    <ButtonLoading
                      type="button"
                      loading={saving}
                      disabled={!dirty || saving}
                      onClick={save}
                      text={dirty ? 'Save changes' : 'All changes saved'}
                      className="h-10 flex-1 cursor-pointer"
                    />
                  </div>

                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t pt-4 text-xs">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="size-3" aria-hidden="true" /> Received
                    </dt>
                    <dd className="text-right tabular-nums">{dayjs(enquiry.createdAt).format('DD MMM YYYY, hh:mm A')}</dd>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarClock className="size-3" aria-hidden="true" /> Last updated
                    </dt>
                    <dd className="text-right tabular-nums">{dayjs(enquiry.updatedAt).format('DD MMM YYYY, hh:mm A')}</dd>
                  </dl>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default GiftEnquiryDetail
