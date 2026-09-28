'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { AlertTriangle, CalendarRange, Download, Loader2, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ADMIN_CUSTOMERS_SHOW, ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute'
import { inr, num, pct, relative, shortDate } from './format'
import { KpiTile } from './ui'
import SalesTrend from './SalesTrend'
import {
    ActionCenter,
    AudiencePanel,
    BuyingHeatmap,
    CatalogueHealth,
    CategoryPerformance,
    CustomerInsights,
    MoneyFlow,
    OrderPipeline,
    PaymentMix,
    RecentOrders,
    Regions,
    ReviewsPanel,
    TopProducts,
} from './Panels'

const PRESETS = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '12m', label: '12M' },
    { id: 'ytd', label: 'YTD' },
    { id: 'all', label: 'All' },
]

const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)

// Flat CSV of the whole report: section, metric, value.
const buildCsv = (d) => {
    const rows = [['Section', 'Metric', 'Value']]
    const add = (section, metric, value) => rows.push([section, metric, value])
    add('Report', 'Range', `${d.range.label} (${shortDate(d.range.start)} – ${shortDate(new Date(new Date(d.range.end).getTime() - 1))})`)
    add('Report', 'Generated', new Date(d.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    const k = d.kpis
    add('Sales', 'Net sales', k.sales.value); add('Sales', 'Net sales (previous period)', k.sales.previous)
    add('Sales', 'Orders', k.orders.value); add('Sales', 'Average order value', k.aov.value)
    add('Sales', 'Units sold', k.units.value); add('Sales', 'Coupon discounts', k.discounts.value)
    add('Sales', 'Collected', k.collected.value); add('Sales', 'Outstanding', k.outstanding.value)
    add('Sales', 'Cancellation rate %', k.cancelRate.value)
    add('Customers', 'Buyers', k.customers.value); add('Customers', 'New accounts', k.newCustomers.value)
    add('Customers', 'Returning buyer rate %', k.returningRate.value)
    d.timeline.forEach((t) => { add('Timeline', `${t.key} net sales`, t.sales); add('Timeline', `${t.key} orders`, t.orders) })
    d.topProducts.forEach((p) => add('Top products', p.name, `${p.sales} (${p.units} units)`))
    d.categories.forEach((c) => add('Categories', c.name, c.sales))
    d.regions.forEach((r) => add('Regions', r.state, `${r.sales} (${r.orders} orders)`))
    d.paymentMethods.forEach((p) => add('Payments', p.method, `${p.sales} (${p.orders} orders)`))
    Object.entries(d.statusCounts).forEach(([s, c]) => add('Order status', s, c))
    return rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

/**
 * Store analytics & reports. Range lives in the URL (?range=30d or
 * ?range=custom&from=…&to=…) so a report can be bookmarked or shared.
 * Previous data stays on screen while a new range loads.
 */
const AnalyticsDashboard = () => {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()
    const range = params.get('range') || '30d'
    const from = params.get('from') || ''
    const to = params.get('to') || ''
    const [customOpen, setCustomOpen] = useState(range === 'custom')
    const [draft, setDraft] = useState({ from: from || '', to: to || todayIst() })
    const [, forceTick] = useState(0)

    // Keep "Updated 3 min ago" honest without refetching.
    useEffect(() => {
        const id = setInterval(() => forceTick((n) => n + 1), 30000)
        return () => clearInterval(id)
    }, [])

    const setQuery = (next) => {
        const q = new URLSearchParams(params.toString())
        Object.entries(next).forEach(([key, value]) => (value ? q.set(key, value) : q.delete(key)))
        q.set('tab', 'analytics')
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['admin-analytics', range, from, to],
        queryFn: async () => {
            const { data: res } = await axios.get('/api/dashboard/admin/analytics', { params: { range, from, to } })
            if (!res.success) throw new Error(res.message)
            return res.data
        },
        placeholderData: keepPreviousData,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    })

    const kpis = data?.kpis
    const timeline = data?.timeline

    const exportCsv = () => {
        if (!data) return
        const blob = new Blob([`﻿${buildCsv(data)}`], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `energyflow-report-${data.range.key}-${todayIst()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const applyCustom = (event) => {
        event.preventDefault()
        if (!draft.from || !draft.to || draft.from > draft.to) return
        setQuery({ range: 'custom', from: draft.from, to: draft.to })
    }

    const tiles = useMemo(() => kpis ? [
        { label: 'Net sales', value: inr(kpis.sales.value), change: kpis.sales.change, hint: `vs ${inr(kpis.sales.previous)} before`, spark: timeline, sparkKey: 'sales', href: ADMIN_ORDER_SHOW },
        { label: 'Orders', value: num(kpis.orders.value), change: kpis.orders.change, hint: `${num(data.breakdown.placed)} placed · ${num(data.breakdown.cancelled)} cancelled`, spark: timeline, sparkKey: 'orders', href: ADMIN_ORDER_SHOW },
        { label: 'Average order value', value: inr(kpis.aov.value), change: kpis.aov.change, hint: `${kpis.unitsPerOrder.value} units per order`, spark: timeline, sparkKey: 'aov' },
        { label: 'Units sold', value: num(kpis.units.value), change: kpis.units.change, hint: `${inr(kpis.discounts.value)} in coupon discounts`, spark: timeline, sparkKey: 'units' },
        { label: 'Buyers', value: num(kpis.customers.value), change: kpis.customers.change, hint: 'Unique customers who ordered', href: ADMIN_CUSTOMERS_SHOW },
        { label: 'New accounts', value: num(kpis.newCustomers.value), change: kpis.newCustomers.change, hint: 'Customer sign-ups', spark: timeline, sparkKey: 'signups', href: ADMIN_CUSTOMERS_SHOW },
        { label: 'Returning buyers', value: pct(kpis.returningRate.value), hint: 'Had ordered before this range' },
        { label: 'Cancellation rate', value: pct(kpis.cancelRate.value), change: kpis.cancelRate.change, inverse: true, hint: 'Of orders placed' },
    ] : Array.from({ length: 8 }, (_, i) => ({ label: ['Net sales', 'Orders', 'Average order value', 'Units sold', 'Buyers', 'New accounts', 'Returning buyers', 'Cancellation rate'][i], spark: i < 4 ? [] : undefined })), [kpis, timeline, data])

    return (
        <div className="flex flex-col gap-4 print:gap-3">
            {/* Controls */}
            <div className="flex flex-col gap-3 rounded-lg bg-card ring-1 ring-foreground/10 p-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap rounded-lg bg-muted p-1" role="tablist" aria-label="Date range">
                        {PRESETS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                role="tab"
                                aria-selected={range === p.id}
                                onClick={() => { setCustomOpen(false); setQuery({ range: p.id, from: '', to: '' }) }}
                                className={cn('rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:px-3', range === p.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                            >
                                {p.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            role="tab"
                            aria-selected={range === 'custom'}
                            aria-expanded={customOpen}
                            onClick={() => setCustomOpen((v) => !v)}
                            className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition sm:px-3', range === 'custom' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
                        >
                            <CalendarRange className="size-3.5" aria-hidden="true" /> Custom
                        </button>
                    </div>
                    {customOpen && (
                        <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                            <label className="sr-only" htmlFor="an-from">From</label>
                            <input id="an-from" type="date" max={draft.to || todayIst()} value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs" required />
                            <span className="text-xs text-muted-foreground">to</span>
                            <label className="sr-only" htmlFor="an-to">To</label>
                            <input id="an-to" type="date" min={draft.from} max={todayIst()} value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs" required />
                            <Button type="submit" className="h-8 px-3 text-xs" disabled={!draft.from || !draft.to || draft.from > draft.to}>Apply</Button>
                        </form>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-muted-foreground md:inline" aria-live="polite">
                        {isFetching ? 'Updating…' : dataUpdatedAt ? `Updated ${relative(dataUpdatedAt)}` : ''}
                    </span>
                    <Button variant="outline" className="h-8 gap-1.5 px-2.5 text-xs" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh report">
                        {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button variant="outline" className="h-8 gap-1.5 px-2.5 text-xs" onClick={exportCsv} disabled={!data}>
                        <Download className="size-3.5" /> <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                    <Button variant="outline" className="h-8 px-2.5 text-xs" onClick={() => window.print()} disabled={!data} aria-label="Print report">
                        <Printer className="size-3.5" />
                    </Button>
                </div>
            </div>

            {data && (
                <p className="-mt-1 text-xs text-muted-foreground">
                    <b className="font-semibold text-foreground">{data.range.label}</b> · {shortDate(data.range.start)} – {shortDate(new Date(new Date(data.range.end).getTime() - 1))}
                    {' '}· compared with {shortDate(data.range.previousStart)} – {shortDate(new Date(new Date(data.range.previousEnd).getTime() - 1))}
                    {data.truncated && <span className="ml-2 rounded-full border px-2 py-0.5 ef-tone--sun">Very large range — totals capped; narrow the range for exact figures</span>}
                </p>
            )}

            {isError && !data ? (
                <div className="flex flex-col items-center rounded-lg bg-card ring-1 ring-foreground/10 px-6 py-16 text-center">
                    <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
                    <p className="mt-3 font-semibold">Couldn’t build the report</p>
                    <p className="mt-1 text-sm text-muted-foreground">{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
                    <Button variant="outline" className="mt-5 h-9 gap-2 px-4" onClick={() => refetch()}><RefreshCw className="size-4" /> Retry</Button>
                </div>
            ) : (
                <div className={cn('flex flex-col gap-4 transition-opacity', isFetching && data && 'opacity-70')} aria-busy={isFetching}>
                    <ActionCenter actions={data?.actions} loading={isLoading} />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {tiles.map((tile, index) => <KpiTile index={index} key={tile.label} {...tile} loading={isLoading || !data} />)}
                    </div>

                    {data && (
                        <>
                            <div className="grid gap-4 lg:grid-cols-3">
                                <SalesTrend data={data} kpis={data.kpis} />
                                <MoneyFlow breakdown={data.breakdown} />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <OrderPipeline statusCounts={data.statusCounts} shipmentCounts={data.shipmentCounts} placed={data.breakdown.placed} />
                                <PaymentMix paymentMethods={data.paymentMethods} paymentStatuses={data.paymentStatuses} />
                                <RecentOrders orders={data.recentOrders} />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <BuyingHeatmap heatmap={data.heatmap} />
                                <CustomerInsights customerMix={data.customerMix} topCustomers={data.topCustomers} kpis={data.kpis} audience={data.audience} />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <TopProducts items={data.topProducts} totalSales={data.categories.reduce((s, c) => s + c.sales, 0)} />
                                <CategoryPerformance categories={data.categories} />
                                <Regions regions={data.regions} />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <ReviewsPanel reviews={data.reviews} kpis={data.kpis} />
                                <AudiencePanel audience={data.audience} kpis={data.kpis} />
                                <CatalogueHealth catalogue={data.catalogue} />
                            </div>
                        </>
                    )}

                    {isLoading && (
                        <div className="grid gap-4 lg:grid-cols-3" aria-hidden="true">
                            <div className="h-[26rem] animate-pulse rounded-xl bg-muted lg:col-span-2" />
                            <div className="h-[26rem] animate-pulse rounded-xl bg-muted" />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AnalyticsDashboard
