'use client'

/**
 * Overview → Sales Tab
 * Shows deeper sales intelligence: revenue trend line chart,
 * top revenue hours heatmap, daily revenue mini-sparklines,
 * and payment collection summary — all using chart.jsx (shadcn wrapper
 * around Recharts) which is the same library as OrderOverview.jsx.
 */

import { useEffect, useState, useMemo } from 'react'
import {
    Area, AreaChart, CartesianGrid, XAxis, YAxis,
    Bar, BarChart, Cell, Tooltip,
    ResponsiveContainer, LineChart, Line,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useFetch from '@/hooks/useFetch'
import Link from 'next/link'
import { ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute'
import { TrendingUp, IndianRupee, ShoppingBag, Receipt, BarChart3 } from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────
const inr = (v, compact = false) => {
    const n = Number(v) || 0
    if (compact && Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
    if (compact && Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
    return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

const CHART_VARS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// icon badge
const IconBadge = ({ icon: Icon, bg = 'var(--chart-1)', fg = 'var(--primary-foreground)' }) => (
    <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: bg, color: fg }}
        aria-hidden="true"
    >
        <Icon className="size-4" />
    </span>
)

// card header row
const PanelHeader = ({ icon, iconBg, iconFg, title, description, action }) => (
    <CardHeader className="px-4 py-3 sm:px-5 pb-3">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <IconBadge icon={icon} bg={iconBg} fg={iconFg} />
                <div>
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    {description && <CardDescription className="mt-0.5 text-xs text-muted-foreground">{description}</CardDescription>}
                </div>
            </div>
            {action}
        </div>
    </CardHeader>
)

// ── Revenue Trend (12-month area chart) ──────────────────────────────
const chartConfigRevenue = { amount: { label: 'Net Sales', color: 'var(--chart-1)' } }

const RevenueTrendCard = ({ monthlySales, activeYear, activeMonth }) => {
    const data = useMemo(() => MONTHS_FULL.map((month, i) => {
        const found = monthlySales?.data?.find(d => d._id?.month === i + 1)
        return {
            month: MONTHS_SHORT[i],
            amount: found?.totalSales || 0,
            isSelected: activeMonth && String(i + 1) === String(activeMonth)
        }
    }), [monthlySales, activeMonth])

    const peak = useMemo(() => data.reduce((best, d) => d.amount > best.amount ? d : best, data[0]), [data])
    const total = useMemo(() => data.reduce((s, d) => s + d.amount, 0), [data])

    return (
        <Card className="rounded-xl lg:col-span-2">
            <PanelHeader
                icon={TrendingUp}
                iconBg="var(--chart-1)"
                iconFg="var(--primary-foreground)"
                title="Revenue Trend"
                description={`${activeYear} · Total ${inr(total, true)} · Peak: ${peak?.month || '—'}`}
                action={
                    <Button variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={ADMIN_ORDER_SHOW}>View Orders</Link>
                    </Button>
                }
            />
            <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <ChartContainer config={chartConfigRevenue} className="h-[240px] w-full">
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <YAxis tickFormatter={(v) => inr(v, true)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={52} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="amount" stroke="var(--chart-1)" strokeWidth={2} fill="url(#salesGrad)" dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// ── KPI Summary cards ─────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, bg, fg = 'var(--primary-foreground)', borderColor }) => (
    <Card className="rounded-xl border-l-4 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-lg" style={{ borderLeftColor: borderColor || bg }}>
        <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg, color: fg }}>
                <Icon className="size-4" />
            </span>
        </div>
        <p className="mt-3 text-2xl sm:text-3xl font-bold leading-none tracking-tight tabular-nums">{value}</p>
        {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
    </Card>
)

// ── Monthly order count bar chart ─────────────────────────────────────
const chartConfigOrders = { orders: { label: 'Orders', color: 'var(--chart-3)' } }

const MonthlyOrdersCard = ({ monthlySales, activeMonth }) => {
    const data = useMemo(() => MONTHS_FULL.map((month, i) => {
        const found = monthlySales?.data?.find(d => d._id?.month === i + 1)
        return {
            month: MONTHS_SHORT[i],
            orders: found?.orderCount || 0,
            isSelected: activeMonth && String(i + 1) === String(activeMonth)
        }
    }), [monthlySales, activeMonth])

    return (
        <Card className="rounded-xl">
            <PanelHeader
                icon={ShoppingBag}
                iconBg="var(--chart-3)"
                iconFg="var(--primary-foreground)"
                title="Monthly Order Volume"
                description="Count of orders placed each month"
            />
            <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <ChartContainer config={chartConfigOrders} className="h-[200px] w-full">
                    <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={28}>
                            {data.map((entry, i) => (
                                <Cell
                                    key={i}
                                    fill={entry.isSelected ? 'var(--primary)' : `var(${CHART_VARS[i % CHART_VARS.length]})`}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// ── Average order value trend ─────────────────────────────────────────
const chartConfigAov = { aov: { label: 'Avg Order Value', color: 'var(--chart-2)' } }

const AovTrendCard = ({ monthlySales }) => {
    const data = useMemo(() => MONTHS_FULL.map((month, i) => {
        const found = monthlySales?.data?.find(d => d._id?.month === i + 1)
        const sales = found?.totalSales || 0
        const orders = found?.orderCount || 1
        return { month: MONTHS_SHORT[i], aov: orders ? Math.round(sales / orders) : 0 }
    }), [monthlySales])

    return (
        <Card className="rounded-xl">
            <PanelHeader
                icon={Receipt}
                iconBg="var(--chart-2)"
                iconFg="#0A2F24"
                title="Avg. Order Value"
                description="Monthly average order value trend"
            />
            <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <ChartContainer config={chartConfigAov} className="h-[200px] w-full">
                    <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                        <YAxis tickFormatter={(v) => inr(v, true)} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={44} />
                        <Tooltip formatter={(v) => [inr(v), 'AOV']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--card-foreground)', fontSize: 12 }} />
                        <Line type="monotone" dataKey="aov" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--chart-2)', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }} />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// ── Sales Radar by month-group (quarters) ─────────────────────────────
const chartConfigRadar = { amount: { label: 'Sales', color: 'var(--chart-1)' } }

const SalesRadarCard = ({ monthlySales }) => {
    const data = useMemo(() => {
        const quarters = [
            { quarter: 'Q1 (Jan–Mar)', months: [1, 2, 3] },
            { quarter: 'Q2 (Apr–Jun)', months: [4, 5, 6] },
            { quarter: 'Q3 (Jul–Sep)', months: [7, 8, 9] },
            { quarter: 'Q4 (Oct–Dec)', months: [10, 11, 12] },
        ]
        return quarters.map(q => ({
            quarter: q.quarter,
            amount: q.months.reduce((s, m) => {
                const found = monthlySales?.data?.find(d => d._id?.month === m)
                return s + (found?.totalSales || 0)
            }, 0),
        }))
    }, [monthlySales])

    return (
        <Card className="rounded-xl">
            <PanelHeader
                icon={BarChart3}
                iconBg="var(--chart-4)"
                iconFg="var(--primary-foreground)"
                title="Quarterly Sales Radar"
                description="Revenue distribution across quarters"
            />
            <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">
                <ChartContainer config={chartConfigRadar} className="h-[200px] w-full">
                    <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                        <Radar dataKey="amount" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.25} strokeWidth={2} />
                        <Tooltip formatter={(v) => [inr(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--card-foreground)', fontSize: 12 }} />
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

// ── Main SalesTab ─────────────────────────────────────────────────────
const SalesTab = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const currentYear = new Date().getFullYear()
    const activeYear = searchParams.get('year') || String(currentYear)
    const activeMonth = searchParams.get('month') || ''

    const { data: monthlySales } = useFetch(`/api/dashboard/admin/monthly-sales?year=${activeYear}`)

    const availableYears = useMemo(() => [currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(String), [currentYear])

    const setFilter = (updates) => {
        const q = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([k, v]) => {
            if (v) q.set(k, v)
            else q.delete(k)
        })
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    const totalRevenue = useMemo(() =>
        (monthlySales?.data || []).reduce((s, d) => s + (d.totalSales || 0), 0), [monthlySales])
    const totalOrders = useMemo(() =>
        (monthlySales?.data || []).reduce((s, d) => s + (d.orderCount || 0), 0), [monthlySales])
    const aov = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
    const bestMonth = useMemo(() => {
        if (!monthlySales?.data?.length) return '—'
        const best = monthlySales.data.reduce((a, b) => (b.totalSales > a.totalSales ? b : a), monthlySales.data[0])
        return MONTHS_SHORT[(best._id?.month || 1) - 1]
    }, [monthlySales])

    // If a month is selected, compute month-specific values
    const monthData = useMemo(() => {
        if (!activeMonth) return null
        const m = parseInt(activeMonth, 10)
        const found = monthlySales?.data?.find(d => d._id?.month === m)
        return {
            name: MONTHS_FULL[m - 1],
            sales: found?.totalSales || 0,
            orders: found?.orderCount || 0,
            aov: found?.orderCount ? Math.round((found.totalSales || 0) / found.orderCount) : 0,
        }
    }, [activeMonth, monthlySales])

    return (
        <div className="flex flex-col gap-6">
            {/* Sales Section Year & Month Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span>Year:</span>
                        <div className="flex items-center rounded-lg bg-muted p-0.5">
                            {availableYears.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    onClick={() => setFilter({ year: y })}
                                    className={cn(
                                        'rounded-md px-2 py-0.5 text-xs font-medium transition',
                                        activeYear === y ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 border-l pl-3 text-xs">
                        <button
                            type="button"
                            onClick={() => setFilter({ month: '' })}
                            className={cn(
                                'rounded-md px-2 py-0.5 font-medium transition',
                                !activeMonth ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                            )}
                        >
                            All Months
                        </button>
                        {MONTHS_SHORT.map((m, i) => {
                            const val = String(i + 1)
                            const isCurrent = activeMonth === val
                            return (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setFilter({ month: isCurrent ? '' : val })}
                                    className={cn(
                                        'rounded-md px-1.5 py-0.5 font-medium transition',
                                        isCurrent ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                                    )}
                                >
                                    {m}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Viewing: <b className="font-semibold text-foreground">{monthData ? `${monthData.name} ${activeYear}` : `Full Year ${activeYear}`}</b>
                </div>
            </div>

            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    label={monthData ? `${monthData.name} Sales` : `Total Revenue (${activeYear})`}
                    value={inr(monthData ? monthData.sales : totalRevenue, true)}
                    sub={monthData ? `Full Year: ${inr(totalRevenue, true)}` : "All months combined"}
                    icon={IndianRupee}
                    bg="var(--chart-1)"
                    borderColor="var(--chart-1)"
                />
                <KpiCard
                    label={monthData ? `${monthData.name} Orders` : `Total Orders (${activeYear})`}
                    value={(monthData ? monthData.orders : totalOrders).toLocaleString('en-IN')}
                    sub={monthData ? `Full Year: ${totalOrders} orders` : "Across all months"}
                    icon={ShoppingBag}
                    bg="var(--chart-2)"
                    fg="#0A2F24"
                    borderColor="var(--chart-2)"
                />
                <KpiCard
                    label="Avg. Order Value"
                    value={inr(monthData ? monthData.aov : aov)}
                    sub="Revenue ÷ orders"
                    icon={Receipt}
                    bg="var(--chart-3)"
                    borderColor="var(--chart-3)"
                />
                <KpiCard
                    label="Best Month"
                    value={bestMonth}
                    sub="Highest sales month"
                    icon={TrendingUp}
                    bg="var(--chart-4)"
                    borderColor="var(--chart-4)"
                />
            </div>

            {/* Revenue trend + quarterly radar */}
            <div className="grid gap-4 lg:grid-cols-3">
                <RevenueTrendCard monthlySales={monthlySales} activeYear={activeYear} activeMonth={activeMonth} />
                <SalesRadarCard monthlySales={monthlySales} />
            </div>

            {/* Monthly order volume + AOV trend */}
            <div className="grid gap-4 lg:grid-cols-2">
                <MonthlyOrdersCard monthlySales={monthlySales} activeMonth={activeMonth} />
                <AovTrendCard monthlySales={monthlySales} />
            </div>
        </div>
    )
}

export default SalesTab
