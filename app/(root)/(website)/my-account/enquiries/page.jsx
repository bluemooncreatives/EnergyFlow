'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, Gift, Loader2, RefreshCw } from 'lucide-react'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import AccountCard from '@/components/Application/Website/account/AccountCard'
import EnquiryCard, { EnquiryCardSkeleton } from '@/components/Application/Website/account/EnquiryCard'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { Button } from '@/components/ui/button'
import { CUSTOMER_STATUS, GIFTING_CATEGORY_SLUG } from '@/lib/giftEnquiry'
import { scrollToElement } from '@/lib/scroll'
import { showToast } from '@/lib/showToast'
import { USER_ENQUIRIES, WEBSITE_CATEGORY, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'

const breadCrumbData = {
    title: 'Enquiries',
    links: [{ label: 'Enquiries' }],
}

// How often the page checks for status changes made by the gifting team.
const POLL_MS = 30 * 1000
const HIGHLIGHT_MS = 4000

const GIFTING_ENQUIRE = `${WEBSITE_CATEGORY(GIFTING_CATEGORY_SLUG)}#enquire`

class HttpError extends Error {
    constructor(message, status) {
        super(message)
        this.status = status
    }
}

const fetchEnquiries = async () => {
    const { data } = await axios.get('/api/gift-enquiry/mine')
    if (!data?.success) throw new HttpError(data?.message || 'Could not load your enquiries.', data?.statusCode)
    return Array.isArray(data.data) ? data.data : []
}

const EnquiriesContent = () => {
    const searchParams = useSearchParams()
    const deepLinkRef = (searchParams.get('ref') || '').trim().toUpperCase()
    const [highlighted, setHighlighted] = useState(() => new Set())
    const lastStatusRef = useRef(null)
    const scrolledRef = useRef(false)

    const { data: enquiries = [], error, isPending, isFetching, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['my-gift-enquiries'],
        queryFn: fetchEnquiries,
        refetchInterval: (query) => (query.state.error ? false : POLL_MS),
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: true,
        retry: (count, err) => err?.status !== 401 && count < 2,
    })

    const flash = (refs) => {
        setHighlighted((current) => new Set([...current, ...refs]))
        window.setTimeout(() => {
            setHighlighted((current) => {
                const next = new Set(current)
                refs.forEach((ref) => next.delete(ref))
                return next
            })
        }, HIGHLIGHT_MS)
    }

    // Spot status changes between polls: tell the customer and ring the card.
    useEffect(() => {
        if (isPending || error) return
        const current = new Map(enquiries.map((e) => [e.ticketId, e.status]))
        const previous = lastStatusRef.current
        lastStatusRef.current = current
        if (!previous) return
        const changed = enquiries.filter((e) => previous.has(e.ticketId) && previous.get(e.ticketId) !== e.status)
        if (!changed.length) return
        changed.forEach((e) => {
            showToast('success', `${e.ticketId} is now “${(CUSTOMER_STATUS[e.status] || CUSTOMER_STATUS.new).label}”.`)
        })
        flash(changed.map((e) => e.ticketId))
    }, [enquiries, isPending, error])

    // ?ref=GE-XXXX (from the enquiry confirmation) — bring that card into view.
    useEffect(() => {
        if (!deepLinkRef || scrolledRef.current || isPending) return
        if (!enquiries.some((e) => e.ticketId === deepLinkRef)) return
        scrolledRef.current = true
        window.setTimeout(() => {
            scrollToElement(document.getElementById(`enquiry-${deepLinkRef}`))
            flash([deepLinkRef])
        }, 150)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deepLinkRef, enquiries, isPending])

    const signedOut = error?.status === 401
    const open = enquiries.filter((e) => e.status !== 'won' && e.status !== 'lost').length
    const checkedAt = dataUpdatedAt
        ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : null

    let content
    if (isPending) {
        content = (
            <div className="divide-y divide-line-soft">
                {Array.from({ length: 2 }).map((_, i) => <EnquiryCardSkeleton key={i} />)}
            </div>
        )
    } else if (error) {
        content = (
            <EmptyState
                icon={CircleAlert}
                tone="danger"
                title={signedOut ? 'Please sign in again' : 'We couldn’t load your enquiries'}
                description={signedOut
                    ? 'Your session has expired. Sign in to see your corporate enquiries.'
                    : 'Something went wrong on our side. Please try again in a moment.'}
                action={signedOut ? (
                    <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                        <Link href={`${WEBSITE_LOGIN}?callback=${USER_ENQUIRIES}`}>Sign in</Link>
                    </Button>
                ) : (
                    <Button variant="outline" onClick={() => refetch()} className="h-11 px-8 text-base font-semibold">Try again</Button>
                )}
            />
        )
    } else if (!enquiries.length) {
        content = (
            <EmptyState
                icon={Gift}
                title="No corporate enquiries yet"
                description="Planning gifts for your team, clients or an event? Send us a brief and track its progress right here."
                action={
                    <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                        <Link href={GIFTING_ENQUIRE}>Plan a bulk order</Link>
                    </Button>
                }
            />
        )
    } else {
        content = (
            <div className="divide-y divide-line-soft">
                {enquiries.map((enquiry) => (
                    <EnquiryCard key={enquiry._id} enquiry={enquiry} highlight={highlighted.has(enquiry.ticketId)} />
                ))}
            </div>
        )
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <AccountCard
                    icon={Gift}
                    title="Corporate Enquiries"
                    description={!isPending && !error && enquiries.length
                        ? `${enquiries.length} ${enquiries.length === 1 ? 'enquiry' : 'enquiries'}${open ? ` · ${open} in progress` : ''}`
                        : 'Bulk and corporate gifting requests you’ve sent us.'}
                    action={!isPending && !error ? (
                        <div className="flex items-center gap-2">
                            <span className="hidden items-center gap-1.5 text-xs text-ink-muted sm:inline-flex" aria-live="polite">
                                <span className="relative flex size-2" aria-hidden="true">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--brand-primary-bright)] opacity-60 motion-reduce:animate-none" />
                                    <span className="relative inline-flex size-2 rounded-full bg-[var(--brand-primary-bright)]" />
                                </span>
                                Live{checkedAt ? ` · checked ${checkedAt}` : ''}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-9"
                                onClick={() => refetch()}
                                disabled={isFetching}
                                aria-label="Refresh enquiries"
                            >
                                {isFetching ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                            </Button>
                        </div>
                    ) : null}
                >
                    {content}
                </AccountCard>
            </UserPanelLayout>
        </div>
    )
}

const EnquiriesPage = () => (
    <Suspense fallback={null}>
        <EnquiriesContent />
    </Suspense>
)

export default EnquiriesPage
