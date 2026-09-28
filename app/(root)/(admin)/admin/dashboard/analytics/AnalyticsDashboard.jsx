'use client'

/**
 * Analytics & Reports — 4 sub-tabs:
 *   Sales & Revenue  |  Orders & Fulfillment  |  Customers  |  Products & Catalogue
 *
 * All tabs share a single API fetch (admin-analytics) for efficiency.
 * Range + active tab both live in the URL (?range=30d&anTab=sales).
 */

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import axios from 'axios'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
    AlertTriangle, CalendarRange, Download, Loader2, Printer, RefreshCw,
    TrendingUp, Truck, Users, ShoppingBag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { relative, shortDate, inr, num, pct } from './format'
import SalesRevenueTab from './tabs/SalesRevenueTab'
import OrdersFulfillmentTab from './tabs/OrdersFulfillmentTab'
import CustomersTab from './tabs/CustomersTab'
import ProductsCatalogueTab from './tabs/ProductsCatalogueTab'

// ── Constants ─────────────────────────────────────────────────────────
const PRESETS = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7d', label: '7D' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '12m', label: '12M' },
    { id: 'ytd', label: 'YTD' },
    { id: 'all', label: 'All' },
]

const AN_TABS = [
    { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
    { id: 'orders', label: 'Orders & Fulfillment', icon: Truck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products & Catalogue', icon: ShoppingBag },
]

const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)

const buildCsv = (d) => {
    const rows = [['Section', 'Metric', 'Value']]
    const add = (section, metric, value) => rows.push([section, metric, value])
    add('Report', 'Range', `${d.range.label} (${shortDate(d.range.start)} to ${shortDate(new Date(new Date(d.range.end).getTime() - 1))})`)
    add('Report', 'Generated', new Date(d.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
    const k = d.kpis
    add('Sales', 'Net sales', k.sales.value); add('Sales', 'Orders', k.orders.value)
    add('Sales', 'Average order value', k.aov.value); add('Sales', 'Units sold', k.units.value)
    add('Sales', 'Coupon discounts', k.discounts.value); add('Sales', 'Collected', k.collected.value)
    add('Sales', 'Outstanding', k.outstanding.value); add('Sales', 'Cancellation rate %', k.cancelRate.value)
    add('Customers', 'Buyers', k.customers.value); add('Customers', 'New accounts', k.newCustomers.value)
    add('Customers', 'Returning buyer rate %', k.returningRate.value)
    d.topProducts?.forEach((p) => add('Top products', p.name, `${p.sales} (${p.units} units)`))
    d.categories?.forEach((c) => add('Categories', c.name, c.sales))
    d.regions?.forEach((r) => add('Regions', r.state, `${r.sales} (${r.orders} orders)`))
    d.paymentMethods?.forEach((p) => add('Payments', p.method, `${p.sales} (${p.orders} orders)`))
    return rows.map((r) => r.map((cell) => '"' + String(cell ?? '').replace(/"/g, '""') + '"').join(',')).join('\n')
}

// ── Main component ────────────────────────────────────────────────────
const AnalyticsDashboard = () => {
    const router = useRouter()
    const pathname = usePathname()
    const params = useSearchParams()

    const range = params.get('range') || '30d'
    const from = params.get('from') || ''
    const to = params.get('to') || ''
    const validTabs = AN_TABS.map(t => t.id)
    const anTab = validTabs.includes(params.get('anTab')) ? params.get('anTab') : 'sales'

    const [customOpen, setCustomOpen] = useState(range === 'custom')
    const [draft, setDraft] = useState({ from: from || '', to: to || todayIst() })
    const [, forceTick] = useState(0)

    useEffect(() => {
        const id = setInterval(() => forceTick((n) => n + 1), 30000)
        return () => clearInterval(id)
    }, [])

    const setQuery = (next) => {
        const q = new URLSearchParams(params.toString())
        if (next.range && next.range !== 'custom' && next.range !== 'month' && next.range !== 'year' && next.range !== 'date') {
            q.delete('year')
            q.delete('month')
            q.delete('date')
            q.delete('from')
            q.delete('to')
        }
        Object.entries(next).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)))
        q.set('tab', 'analytics')
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    const onTabChange = (value) => {
        const q = new URLSearchParams(params.toString())
        q.set('anTab', value)
        q.set('tab', 'analytics')
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    const year = params.get('year') || ''
    const month = params.get('month') || ''
    const date = params.get('date') || ''

    const { data, isLoading, isFetching, isError, error, refetch, dataUpdatedAt } = useQuery({
        queryKey: ['admin-analytics', range, from, to, year, month, date],
        queryFn: async () => {
            const { data: res } = await axios.get('/api/dashboard/admin/analytics', {
                params: { range, from, to, year, month, date }
            })
            if (!res.success) throw new Error(res.message)
            return res.data
        },
        placeholderData: keepPreviousData,
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    })

    const exportCsv = () => {
        if (!data) return
        const blob = new Blob(['\uFEFF' + buildCsv(data)], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `energyflow-report-${data.range.key}-${todayIst()}.csv`
        a.click(); URL.revokeObjectURL(url)
    }

    const applyCustom = (e) => {
        e.preventDefault()
        if (!draft.from || !draft.to || draft.from > draft.to) return
        setQuery({ range: 'custom', from: draft.from, to: draft.to, year: '', month: '', date: '' })
    }

    return (
        <div className="flex flex-col gap-5 print:gap-4">

            {/* ── Controls card ─────────────────────────────────────── */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-xs print:hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                        <span
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: 'var(--chart-1)', color: 'var(--primary-foreground)' }}
                            aria-hidden="true"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Analytics &amp; Reports</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {data
                                    ? <><b className="font-semibold text-foreground">{data.range.label}</b>{' · '}{shortDate(data.range.start)} – {shortDate(new Date(new Date(data.range.end).getTime() - 1))}{' · compared with '}{shortDate(data.range.previousStart)} – {shortDate(new Date(new Date(data.range.previousEnd).getTime() - 1))}{data.truncated && <span className="ml-2 rounded-full border px-2 py-0.5 ef-tone--sun">Very large range — narrow for exact figures</span>}</>
                                    : 'Select a date range to load the report'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden text-xs text-muted-foreground md:inline" aria-live="polite">
                            {isFetching ? 'Updating…' : dataUpdatedAt ? `Updated ${relative(dataUpdatedAt)}` : ''}
                        </span>
                        <Button variant="outline" className="h-8 gap-1.5 px-2.5 text-xs" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
                            {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                        <Button variant="outline" className="h-8 gap-1.5 px-2.5 text-xs" onClick={exportCsv} disabled={!data}>
                            <Download className="size-3.5" /><span className="hidden sm:inline">Export CSV</span>
                        </Button>
                        <Button variant="outline" className="h-8 px-2.5 text-xs" onClick={() => window.print()} disabled={!data} aria-label="Print">
                            <Printer className="size-3.5" />
                        </Button>
                    </div>
                </div>
                {/* Date range selectors */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap rounded-lg bg-muted p-1" role="tablist" aria-label="Date range">
                        {PRESETS.map((p) => (
                            <button
                                key={p.id} type="button" role="tab" aria-selected={range === p.id}
                                onClick={() => { setCustomOpen(false); setQuery({ range: p.id, from: '', to: '', year: '', month: '', date: '' }) }}
                                className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition sm:px-3', range === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}
                            >{p.label}</button>
                        ))}
                        <button
                            type="button" role="tab" aria-selected={range === 'custom'} aria-expanded={customOpen}
                            onClick={() => setCustomOpen((v) => !v)}
                            className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition sm:px-3', range === 'custom' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground')}
                        ><CalendarRange className="size-3.5" aria-hidden="true" /> Custom</button>
                    </div>

                    {/* Direct Month dropdown */}
                    <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs">
                        <span className="text-muted-foreground font-medium">Month:</span>
                        <select
                            value={range === 'month' && month ? `${year || todayIst().slice(0, 4)}-${month}` : ''}
                            onChange={(e) => {
                                if (!e.target.value) return
                                const [y, m] = e.target.value.split('-')
                                setCustomOpen(false)
                                setQuery({ range: 'month', year: y, month: m, date: '', from: '', to: '' })
                            }}
                            className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
                        >
                            <option value="">Month</option>
                            {[...Array(12)].map((_, i) => {
                                const mNum = i + 1
                                const yNum = year || todayIst().slice(0, 4)
                                const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]
                                return <option key={mNum} value={`${yNum}-${mNum}`}>{mName} {yNum}</option>
                            })}
                        </select>
                    </div>

                    {/* Direct Year dropdown */}
                    <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs">
                        <span className="text-muted-foreground font-medium">Year:</span>
                        <select
                            value={range === 'year' && year ? year : ''}
                            onChange={(e) => {
                                if (!e.target.value) return
                                setCustomOpen(false)
                                setQuery({ range: 'year', year: e.target.value, month: '', date: '', from: '', to: '' })
                            }}
                            className="bg-transparent text-xs font-medium text-foreground focus:outline-hidden"
                        >
                            <option value="">Year</option>
                            {['2027', '2026', '2025', '2024'].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {customOpen && (
                        <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                            <label className="sr-only" htmlFor="an-from">From</label>
                            <input id="an-from" type="date" max={draft.to || todayIst()} value={draft.from} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-xs" required />
                            <span className="text-xs text-muted-foreground">to</span>
                            <label className="sr-only" htmlFor="an-to">To</label>
                            <input id="an-to" type="date" min={draft.from} max={todayIst()} value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-xs" required />
                            <Button type="submit" className="h-8 px-3 text-xs" disabled={!draft.from || !draft.to || draft.from > draft.to}>Apply</Button>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Error state ───────────────────────────────────────── */}
            {isError && !data && (
                <div className="flex flex-col items-center rounded-xl border bg-card px-6 py-16 text-center">
                    <span className="inline-flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--chart-1)', color: 'var(--primary-foreground)' }} aria-hidden="true">
                        <AlertTriangle className="size-5" />
                    </span>
                    <p className="mt-4 font-semibold text-foreground">Couldn't build the report</p>
                    <p className="mt-1 text-xs text-muted-foreground">{error?.response?.data?.message || error?.message || 'Please try again.'}</p>
                    <Button variant="outline" className="mt-5 h-8 gap-2 px-3 text-xs" onClick={() => refetch()}><RefreshCw className="size-3.5" /> Retry</Button>
                </div>
            )}

            {/* ── 4-tab analytics body ──────────────────────────────── */}
            {(!isError || data) && (
                <div className={cn('transition-opacity', isFetching && data && 'opacity-60')} aria-busy={isFetching}>
                    <Tabs value={anTab} onValueChange={onTabChange} className="space-y-5">
                        <div className="w-full overflow-x-auto">
                            <TabsList className="gap-1">
                                {AN_TABS.map(({ id, label, icon: Icon }) => (
                                    <TabsTrigger key={id} value={id} className="gap-1.5 text-xs sm:text-sm">
                                        <Icon className="size-3.5" aria-hidden="true" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="sales">
                            <SalesRevenueTab data={data} isLoading={isLoading} kpis={data?.kpis} timeline={data?.timeline} />
                        </TabsContent>
                        <TabsContent value="orders">
                            <OrdersFulfillmentTab data={data} isLoading={isLoading} />
                        </TabsContent>
                        <TabsContent value="customers">
                            <CustomersTab data={data} isLoading={isLoading} kpis={data?.kpis} timeline={data?.timeline} />
                        </TabsContent>
                        <TabsContent value="products">
                            <ProductsCatalogueTab data={data} isLoading={isLoading} />
                        </TabsContent>
                    </Tabs>

                    {/* Loading skeleton */}
                    {isLoading && (
                        <div className="mt-6 grid gap-4 lg:grid-cols-3" aria-hidden="true">
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