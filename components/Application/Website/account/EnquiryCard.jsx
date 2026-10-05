'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Check, ChevronDown, Copy, FileText, Gift, Inbox, MessagesSquare, XCircle } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import { formatDate } from '@/lib/account'
import { CUSTOMER_STATUS, CUSTOMER_STEPS, OCCASIONS, labelFor } from '@/lib/giftEnquiry'
import { productPath } from '@/lib/productRoute'
import { cn } from '@/lib/utils'
import { TONE } from './orderStatus'

const STATUS_STYLE = {
    new: { tone: 'sun', Icon: Inbox },
    contacted: { tone: 'olive', Icon: MessagesSquare },
    quoted: { tone: 'pine', Icon: FileText },
    won: { tone: 'forest', Icon: BadgeCheck },
    lost: { tone: 'danger', Icon: XCircle },
}

export const EnquiryStatusBadge = ({ status, className }) => {
    const meta = CUSTOMER_STATUS[status] || CUSTOMER_STATUS.new
    const { tone, Icon } = STATUS_STYLE[status] || STATUS_STYLE.new
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-normal whitespace-nowrap',
                TONE[tone],
                className
            )}
        >
            <Icon className="size-3" aria-hidden="true" /> {meta.label}
        </span>
    )
}

// Received → In discussion → Quote sent → Order confirmed.
const ProgressTrack = ({ status }) => {
    const step = (CUSTOMER_STATUS[status] || CUSTOMER_STATUS.new).step
    if (step < 0) return null
    return (
        <ol className="grid grid-cols-4 gap-1.5" aria-label={`Progress: ${CUSTOMER_STEPS[step]}`}>
            {CUSTOMER_STEPS.map((label, i) => {
                const done = i <= step
                return (
                    <li key={label} className="flex min-w-0 flex-col gap-1.5" aria-current={i === step ? 'step' : undefined}>
                        <span className={cn('h-1.5 rounded-full transition-colors duration-500', done ? 'bg-[var(--brand-primary-bright)]' : 'bg-surface-well')} />
                        <span className={cn('truncate text-[11px] sm:text-xs', i === step ? 'font-semibold text-ink-strong' : done ? 'text-ink-body' : 'text-ink-muted')}>
                            {label}
                        </span>
                    </li>
                )
            })}
        </ol>
    )
}

const Detail = ({ label, children }) => (
    <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-ink-strong">{children}</dd>
    </div>
)

/**
 * One corporate / bulk gifting enquiry in the customer's account: reference,
 * live status with a progress track, the brief they sent, and the status
 * history. `highlight` briefly rings the card (deep link or a status change).
 */
const EnquiryCard = ({ enquiry, highlight = false }) => {
    const [copied, setCopied] = useState(false)
    const status = CUSTOMER_STATUS[enquiry.status] ? enquiry.status : 'new'
    const meta = CUSTOMER_STATUS[status]
    const history = [...(enquiry.statusHistory || [])].reverse()

    const copyRef = async () => {
        try {
            await navigator.clipboard.writeText(enquiry.ticketId)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 2000)
        } catch { /* clipboard blocked - the reference is on screen */ }
    }

    return (
        <article
            id={enquiry.ticketId ? `enquiry-${enquiry.ticketId}` : undefined}
            className={cn(
                'scroll-mt-28 px-4 py-5 transition-[background-color,box-shadow] duration-700 sm:px-5',
                highlight && 'bg-tint-honey shadow-[inset_3px_0_0_var(--brand-sun)]'
            )}
            aria-labelledby={`enquiry-title-${enquiry._id}`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 id={`enquiry-title-${enquiry._id}`} className="font-mono text-sm font-bold tracking-wide text-ink-strong">
                            {enquiry.ticketId || 'Enquiry'}
                        </h3>
                        {enquiry.ticketId && (
                            <button
                                type="button"
                                onClick={copyRef}
                                className="flex size-7 items-center justify-center rounded-full text-foreground/50 hover:bg-surface-well hover:text-foreground"
                                aria-label={copied ? 'Reference copied' : `Copy reference ${enquiry.ticketId}`}
                            >
                                {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-ink-muted">
                        Sent {formatDate(enquiry.createdAt, true)}
                        {enquiry.company ? ` · ${enquiry.company}` : ''}
                    </p>
                </div>
                <EnquiryStatusBadge status={status} />
            </div>

            <div className="mt-4 flex flex-col gap-3">
                <ProgressTrack status={status} />
                <p className={cn('text-sm leading-relaxed', status === 'lost' ? 'text-ink-muted' : 'text-ink-body')}>{meta.note}</p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[var(--radius-sm)] bg-surface-page p-3.5 sm:grid-cols-4">
                <Detail label="Boxes">{Number(enquiry.quantity || 0).toLocaleString('en-IN')}</Detail>
                <Detail label="Occasion">{labelFor(OCCASIONS, enquiry.occasion) || '-'}</Detail>
                <Detail label="Needed by">{enquiry.deliveryDate ? formatDate(enquiry.deliveryDate) : 'Flexible'}</Detail>
                <Detail label="Branding">{enquiry.branding ? 'Custom branded' : 'Standard'}</Detail>
            </dl>

            {enquiry.products?.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Boxes you picked">
                    {enquiry.products.map((p) => (
                        <li key={p.slug || p.name}>
                            {p.slug ? (
                                <Link
                                    href={productPath(p.slug)}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-line-soft px-3 py-1 text-xs text-ink-strong hover:border-[var(--brand-primary)]"
                                >
                                    <Gift className="size-3" aria-hidden="true" /> {p.name}
                                </Link>
                            ) : (
                                <span className="inline-flex rounded-full border border-line-soft px-3 py-1 text-xs">{p.name}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <details className="group mt-4">
                <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm text-[13px] font-semibold text-[var(--brand-primary)] [&::-webkit-details-marker]:hidden">
                    Status history
                    <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ol className="mt-3 flex flex-col gap-2.5 border-l border-line-soft pl-4">
                    {history.map((h, i) => (
                        <li key={`${h.status}-${h.at}-${i}`} className="relative text-[13px]">
                            <span
                                className={cn('absolute -left-[1.3rem] top-1.5 size-2 rounded-full', i === 0 ? 'bg-[var(--brand-primary-bright)]' : 'bg-line-strong')}
                                aria-hidden="true"
                            />
                            <span className={cn('font-medium', i === 0 ? 'text-ink-strong' : 'text-ink-body')}>
                                {(CUSTOMER_STATUS[h.status] || CUSTOMER_STATUS.new).label}
                            </span>
                            <span className="text-ink-muted"> · {formatDate(h.at, true)}</span>
                        </li>
                    ))}
                </ol>
                <p className="mt-3 text-xs text-ink-muted">
                    Questions? Quote <span className="font-mono font-semibold">{enquiry.ticketId}</span> on{' '}
                    <a href={COMPANY.phoneHref} className="underline underline-offset-2 hover:text-brand">{COMPANY.phone}</a> or{' '}
                    <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Gifting enquiry ${enquiry.ticketId || ''}`.trim())}`} className="underline underline-offset-2 hover:text-brand">
                        email us
                    </a>.
                </p>
            </details>
        </article>
    )
}

export const EnquiryCardSkeleton = () => (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
        <div className="flex justify-between gap-3">
            <span className="h-4 w-32 animate-pulse rounded bg-border/60" />
            <span className="h-5 w-24 animate-pulse rounded bg-border/60" />
        </div>
        <span className="h-1.5 w-full animate-pulse rounded-full bg-border/60" />
        <span className="h-16 w-full animate-pulse rounded bg-border/60" />
    </div>
)

export default EnquiryCard
