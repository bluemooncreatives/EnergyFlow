'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import AccountCard from '@/components/Application/Website/account/AccountCard'
import OrderCard, { OrderCardSkeleton } from '@/components/Application/Website/account/OrderCard'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import useFetch from '@/hooks/useFetch'
import { filterOrders, paginate, summarizeOrders } from '@/lib/account'
import { cn } from '@/lib/utils'
import { scrollToElement } from '@/lib/scroll'
import { WEBSITE_LOGIN, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleAlert, Package, PackageOpen, Search, SearchX, X } from 'lucide-react'

const breadCrumbData = {
    title: 'Orders',
    links: [{ label: 'Orders' }]
}

const PER_PAGE = 8

const TABS = [
    { key: 'all', label: 'All', countKey: 'total' },
    { key: 'active', label: 'In progress', countKey: 'active' },
    { key: 'delivered', label: 'Delivered', countKey: 'delivered' },
    { key: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
]

const Orders = () => {
    const { data: orderData, loading, error, errorStatus, refetch } = useFetch("/api/user-order")
    const [status, setStatus] = useState('all')
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)

    const isLoading = loading || (!orderData && !error)
    const orders = useMemo(() => (Array.isArray(orderData?.data) ? orderData.data : []), [orderData])
    const counts = useMemo(() => summarizeOrders(orders), [orders])
    const filtered = useMemo(() => filterOrders(orders, { status, query }), [orders, status, query])
    const { items: pageItems, page: currentPage, totalPages, total } = paginate(filtered, page, PER_PAGE)

    const changeStatus = (next) => {
        setStatus(next)
        setPage(1)
    }
    const changeQuery = (next) => {
        setQuery(next)
        setPage(1)
    }
    const goToPage = (next) => {
        setPage(next)
        scrollToElement('my-orders')
    }
    const clearFilters = () => {
        setStatus('all')
        setQuery('')
        setPage(1)
    }

    const hasOrders = orders.length > 0
    const sessionProblem = errorStatus === 401 || errorStatus === 404

    let content
    if (isLoading) {
        content = (
            <div className="divide-y divide-line-soft">
                {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
            </div>
        )
    } else if (error) {
        content = (
            <EmptyState
                icon={CircleAlert}
                tone="danger"
                title={sessionProblem ? 'Your session has ended' : 'We couldn’t load your orders'}
                description={sessionProblem
                    ? 'Please sign in again to see your orders.'
                    : 'Something went wrong on our side. Please try again in a moment.'}
                action={sessionProblem ? (
                    <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                        <Link href={`${WEBSITE_LOGIN}?callback=/orders`}>Sign in</Link>
                    </Button>
                ) : (
                    <Button variant="outline" onClick={refetch} className="h-11 px-8 text-base font-semibold">Try again</Button>
                )}
            />
        )
    } else if (!hasOrders) {
        content = (
            <EmptyState
                icon={PackageOpen}
                title="No orders yet"
                description="You haven’t placed any orders. Explore our collections and find something you love."
                action={
                    <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                        <Link href={WEBSITE_SHOP}>Shop Now</Link>
                    </Button>
                }
            />
        )
    } else if (filtered.length === 0) {
        content = (
            <EmptyState
                icon={SearchX}
                title="No matching orders"
                description={query.trim()
                    ? `Nothing matches “${query.trim()}”. Try an order ID or a product name.`
                    : 'You have no orders with this status.'}
                action={<Button variant="outline" onClick={clearFilters} className="h-11 px-8 text-base font-semibold">Clear filters</Button>}
            />
        )
    } else {
        content = (
            <div className="divide-y divide-line-soft" data-testid="orders-list">
                {pageItems.map((order, i) => <OrderCard key={order?._id || order?.order_id || i} order={order} />)}
            </div>
        )
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <AccountCard
                    id="my-orders"
                    className="scroll-mt-24"
                    icon={Package}
                    title="My Orders"
                    description={!isLoading && hasOrders ? `${counts.total} ${counts.total === 1 ? 'order' : 'orders'} placed` : undefined}
                >
                    {/* Filters */}
                    {!isLoading && !error && hasOrders && (
                        <div className="flex flex-col gap-3 border-b border-line-soft px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                            <div role="tablist" aria-label="Filter orders by status" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                                {TABS.map((tab) => {
                                    const active = status === tab.key
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            onClick={() => changeStatus(tab.key)}
                                            className={cn(
                                                'inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border px-3.5 py-1.5 text-sm font-semibold transition-colors',
                                                active
                                                    ? 'border-transparent bg-brand text-on-brand'
                                                    : 'border-line-soft text-foreground/65 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'
                                            )}
                                        >
                                            {tab.label}
                                            <span className={cn('rounded-full px-1.5 text-[11px]', active ? 'bg-on-brand/20' : 'bg-surface-well')}>
                                                {counts[tab.countKey]}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="relative w-full lg:max-w-xs">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
                                <Input
                                    type="search"
                                    value={query}
                                    onChange={(e) => changeQuery(e.target.value)}
                                    placeholder="Search order ID or product"
                                    aria-label="Search orders"
                                    maxLength={80}
                                    className="h-10 pl-9 pr-9 text-sm"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => changeQuery('')}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-foreground/50 hover:bg-surface-well hover:text-foreground"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {content}

                    {/* Pagination */}
                    {!isLoading && !error && totalPages > 1 && (
                        <nav aria-label="Orders pagination" className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3">
                            <p className="text-[13px] text-foreground/60">
                                {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft />
                                </Button>
                                <span className="min-w-14 text-center text-sm font-medium text-foreground/70">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    aria-label="Next page"
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </nav>
                    )}
                </AccountCard>
            </UserPanelLayout>
        </div>
    )
}

export default Orders
