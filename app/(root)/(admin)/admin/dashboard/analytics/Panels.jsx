'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
    AlertTriangle,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    ExternalLink,
    ImageOff,
    Inbox,
    Mail,
    MapPin,
    MessageSquareWarning,
    PackageCheck,
    PackageX,
    ShieldAlert,
    ShoppingBag,
    Star,
    Tag,
    Truck,
    Users,
    Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import {
    ADMIN_CONTACTS_SHOW,
    ADMIN_COUPON_SHOW,
    ADMIN_CUSTOMERS_SHOW,
    ADMIN_NEWSLETTER_SHOW,
    ADMIN_ORDER_DETAILS,
    ADMIN_ORDER_SHOW,
    ADMIN_PRODUCT_EDIT,
    ADMIN_PRODUCT_SHOW,
    ADMIN_REVIEW_SHOW,
} from '@/routes/AdminPanelRoute'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'
import {
    NEWSLETTER_SOURCE_LABEL,
    PAYMENT_METHOD_LABEL,
    PAYMENT_STATUS_LABEL,
    dateTime,
    inr,
    num,
    pct,
    relative,
    share,
    titleCase,
} from './format'
import { EmptyState, Panel, PanelLink, ShareBar, TooltipCard, ViewToggle } from './ui'

// Categorical slots in fixed order (validated palette, see admin.css).
const SLOTS = ['var(--viz-1)', 'var(--viz-2)', 'var(--viz-3)']

// ── Action center ────────────────────────────────────────────────────
export const ActionCenter = ({ actions, loading }) => {
    const items = [
        { key: 'pendingOrders', icon: ShoppingBag, label: 'Orders to process', value: actions?.pendingOrders, href: ADMIN_ORDER_SHOW, tone: 'sun' },
        { key: 'staleOrders', icon: Clock, label: 'Waiting over 48 h', value: actions?.staleOrders, href: ADMIN_ORDER_SHOW, tone: 'danger' },
        { key: 'unverifiedOrders', icon: ShieldAlert, label: 'Unverified orders', value: actions?.unverifiedOrders, href: ADMIN_ORDER_SHOW, tone: 'danger' },
        { key: 'outstandingAmount', icon: Wallet, label: `To collect · ${num(actions?.outstandingOrders)} orders`, value: actions?.outstandingAmount, money: true, href: ADMIN_ORDER_SHOW, tone: 'olive' },
        { key: 'unreadContacts', icon: Inbox, label: 'Unread queries', value: actions?.unreadContacts, href: ADMIN_CONTACTS_SHOW, tone: 'sun' },
        { key: 'lowRatedReviews', icon: MessageSquareWarning, label: 'Low ratings (≤2★)', value: actions?.lowRatedReviews, href: ADMIN_REVIEW_SHOW, tone: 'danger' },
        { key: 'productsWithoutImage', icon: ImageOff, label: 'Products without photos', value: actions?.productsWithoutImage, href: ADMIN_PRODUCT_SHOW, tone: 'olive' },
        { key: 'activeCoupons', icon: Tag, label: 'Active coupons', value: actions?.activeCoupons, href: ADMIN_COUPON_SHOW, tone: 'pine', info: true },
    ]
    const open = items.filter((i) => !i.info && Number(i.value) > 0)

    return (
        <section aria-labelledby="actions-title" className="rounded-xl border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
                <h3 id="actions-title" className="flex items-center gap-2 text-[0.9375rem] font-semibold">
                    Needs attention
                    {!loading && (
                        <span className={cn('rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold', open.length ? 'ef-tone--sun' : 'ef-tone--forest')}>
                            {open.length ? `${open.length} to review` : 'All clear'}
                        </span>
                    )}
                </h3>
                <p className="text-xs text-muted-foreground">Live, not limited to the date range</p>
            </header>
            <ul className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 xl:grid-cols-8">
                {items.map(({ key, icon: Icon, label, value, money, href, tone, info }) => {
                    const active = Number(value) > 0 && !info
                    return (
                        <li key={key} className="bg-card">
                            <Link href={href} className="group flex h-full flex-col gap-2 p-3.5 transition hover:bg-muted/60 sm:p-4">
                                <span className={cn('flex size-8 items-center justify-center rounded-lg border', active ? `ef-tone--${tone}` : 'border-transparent bg-muted text-muted-foreground')}>
                                    <Icon className="size-4" aria-hidden="true" />
                                </span>
                                <span className={cn('font-header text-xl font-semibold tabular-nums leading-none', !active && !info && 'text-muted-foreground')}>
                                    {loading ? <span className="inline-block h-5 w-10 animate-pulse rounded bg-muted" /> : money ? inr(value, { compact: true }) : num(value)}
                                </span>
                                <span className="text-xs leading-snug text-muted-foreground group-hover:text-foreground">{label}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

// ── Money flow ───────────────────────────────────────────────────────
export const MoneyFlow = ({ breakdown }) => {
    const { gross = 0, discounts = 0, sales = 0, collected = 0, outstanding = 0 } = breakdown || {}
    const segments = [
        { label: 'Collected', value: collected, color: SLOTS[0] },
        { label: 'To collect', value: outstanding, color: SLOTS[1] },
        { label: 'Coupon discounts', value: discounts, color: SLOTS[2] },
    ]
    const base = collected + outstanding + discounts
    const rows = [
        { label: 'Item value (before coupons)', value: gross },
        { label: 'Coupon discounts', value: -discounts },
        { label: 'Net sales', value: sales, strong: true },
        { label: 'Collected', value: collected },
        { label: 'Still to collect (COD / part-paid)', value: outstanding },
    ]

    return (
        <Panel id="money" title="Where the money is" description="Net sales split by what's in the bank vs still to collect" action={<PanelLink href={ADMIN_ORDER_SHOW}>Orders</PanelLink>}>
            {base <= 0 ? (
                <EmptyState icon={CircleDollarSign} title="No sales in this range" />
            ) : (
                <>
                    <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-md" role="img" aria-label={segments.map((s) => `${s.label} ${inr(s.value)}`).join(', ')}>
                        {segments.filter((s) => s.value > 0).map((s) => (
                            <span key={s.label} className="h-full first:rounded-l-md last:rounded-r-md" style={{ width: `${share(s.value, base)}%`, background: s.color }} title={`${s.label}: ${inr(s.value)}`} />
                        ))}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        {segments.map((s) => (
                            <li key={s.label} className="flex items-center gap-1.5 text-muted-foreground">
                                <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" />
                                {s.label} <b className="font-semibold text-foreground tabular-nums">{pct(share(s.value, base), 0)}</b>
                            </li>
                        ))}
                    </ul>
                    <dl className="mt-4 divide-y rounded-lg border text-sm">
                        {rows.map((row) => (
                            <div key={row.label} className={cn('flex items-center justify-between gap-3 px-3 py-2', row.strong && 'bg-muted/50')}>
                                <dt className={cn('text-muted-foreground', row.strong && 'font-semibold text-foreground')}>{row.label}</dt>
                                <dd className={cn('tabular-nums', row.strong && 'font-semibold')}>{row.value < 0 ? `−${inr(-row.value)}` : inr(row.value)}</dd>
                            </div>
                        ))}
                    </dl>
                </>
            )}
        </Panel>
    )
}

// ── Order pipeline ───────────────────────────────────────────────────
const PIPELINE = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'processing', label: 'Processing', icon: PackageCheck },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

export const OrderPipeline = ({ statusCounts = {}, shipmentCounts = {}, placed = 0 }) => {
    const max = Math.max(1, ...PIPELINE.map((s) => statusCounts[s.key] || 0))
    const lost = [
        { key: 'cancelled', label: 'Cancelled', value: statusCounts.cancelled || 0 },
        { key: 'unverified', label: 'Unverified', value: statusCounts.unverified || 0 },
    ]
    const shipments = Object.entries(shipmentCounts).sort((a, b) => b[1] - a[1])

    return (
        <Panel id="pipeline" title="Order pipeline" description={`${num(placed)} orders placed in range, by current status`} action={<PanelLink href={ADMIN_ORDER_SHOW}>Manage</PanelLink>}>
            {placed === 0 ? (
                <EmptyState icon={ShoppingBag} title="No orders in this range" />
            ) : (
                <>
                    <ol className="space-y-2.5">
                        {PIPELINE.map(({ key, label, icon: Icon }) => {
                            const value = statusCounts[key] || 0
                            return (
                                <li key={key} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 text-sm">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Icon className="size-4" aria-hidden="true" /> {label}</span>
                                    <span className="h-6 overflow-hidden rounded-md bg-muted">
                                        <span className="flex h-full items-center rounded-md bg-[var(--viz-1)] transition-[width] duration-700" style={{ width: `${value ? Math.max(4, (value / max) * 100) : 0}%` }} />
                                    </span>
                                    <span className="text-right font-semibold tabular-nums">{num(value)}</span>
                                </li>
                            )
                        })}
                    </ol>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {lost.map((l) => (
                            <div key={l.key} className={cn('rounded-lg border px-3 py-2 text-sm', l.value ? 'ef-tone--danger' : 'text-muted-foreground')}>
                                <p className="text-xs">{l.label}</p>
                                <p className="font-semibold tabular-nums">{num(l.value)} <span className="text-xs font-normal">· {pct(share(l.value, placed), 0)}</span></p>
                            </div>
                        ))}
                    </div>
                    {shipments.length > 0 && (
                        <div className="mt-4">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">Courier status</p>
                            <div className="flex flex-wrap gap-1.5">
                                {shipments.map(([status, count]) => (
                                    <span key={status} className="rounded-full border px-2.5 py-0.5 text-xs">
                                        {titleCase(status.toLowerCase())} <b className="tabular-nums">{count}</b>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Panel>
    )
}

// ── Payment mix ──────────────────────────────────────────────────────
const METHOD_ORDER = ['full', 'cod', 'partial', 'unknown']

export const PaymentMix = ({ paymentMethods = [], paymentStatuses = [] }) => {
    const [view, setView] = useState('chart')
    const methods = [...paymentMethods].sort((a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method))
    const total = methods.reduce((s, m) => s + m.sales, 0)
    // Colour follows the method, not its rank.
    const colorOf = (method) => SLOTS[Math.max(0, METHOD_ORDER.indexOf(method)) % SLOTS.length]

    return (
        <Panel id="payments" title="Payment mix" description="Net sales by how customers paid" action={methods.length > 0 && <ViewToggle value={view} onChange={setView} />}>
            {!methods.length ? (
                <EmptyState icon={Wallet} title="No payments in this range" />
            ) : view === 'table' ? (
                <table className="w-full text-sm">
                    <thead className="text-left text-[0.6875rem] uppercase tracking-[0.06em] text-muted-foreground">
                        <tr><th className="pb-2 font-semibold">Method</th><th className="pb-2 text-right font-semibold">Orders</th><th className="pb-2 text-right font-semibold">Sales</th><th className="pb-2 text-right font-semibold">Share</th></tr>
                    </thead>
                    <tbody>
                        {methods.map((m) => (
                            <tr key={m.method} className="border-t">
                                <td className="py-2">{PAYMENT_METHOD_LABEL[m.method] || m.method}</td>
                                <td className="py-2 text-right tabular-nums">{num(m.orders)}</td>
                                <td className="py-2 text-right tabular-nums">{inr(m.sales)}</td>
                                <td className="py-2 text-right tabular-nums">{pct(share(m.sales, total), 0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                    <div className="relative size-40 shrink-0" role="img" aria-label={methods.map((m) => `${PAYMENT_METHOD_LABEL[m.method]} ${pct(share(m.sales, total), 0)}`).join(', ')}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={methods} dataKey="sales" nameKey="method" innerRadius="64%" outerRadius="100%" paddingAngle={methods.length > 1 ? 2 : 0} stroke="var(--card)" strokeWidth={2} isAnimationActive animationDuration={700}>
                                    {methods.map((m) => <Cell key={m.method} fill={colorOf(m.method)} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                                    <TooltipCard title={PAYMENT_METHOD_LABEL[payload[0].payload.method]} rows={[
                                        { label: 'Sales', value: inr(payload[0].payload.sales), color: colorOf(payload[0].payload.method) },
                                        { label: 'Orders', value: num(payload[0].payload.orders) },
                                        { label: 'Share', value: pct(share(payload[0].payload.sales, total), 0) },
                                    ]} />
                                ) : null} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="font-header text-lg font-semibold tabular-nums">{inr(total, { compact: true })}</span>
                            <span className="text-[0.6875rem] text-muted-foreground">net sales</span>
                        </div>
                    </div>
                    <ul className="w-full space-y-2.5">
                        {methods.map((m) => (
                            <li key={m.method} className="text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm" style={{ background: colorOf(m.method) }} aria-hidden="true" />{PAYMENT_METHOD_LABEL[m.method] || m.method}</span>
                                    <span className="font-semibold tabular-nums">{pct(share(m.sales, total), 0)}</span>
                                </div>
                                <p className="ml-[1.125rem] text-xs text-muted-foreground">{inr(m.sales)} · {num(m.orders)} {m.orders === 1 ? 'order' : 'orders'}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {paymentStatuses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                    {paymentStatuses.map((p) => (
                        <span key={p.status} className={cn('rounded-full border px-2.5 py-0.5 text-xs', p.status === 'fully_paid' ? 'ef-tone--forest' : p.status === 'partial_paid' ? 'ef-tone--sun' : 'ef-tone--danger')}>
                            {PAYMENT_STATUS_LABEL[p.status] || p.status}: <b className="tabular-nums">{num(p.orders)}</b> · {inr(p.amount, { compact: true })}
                        </span>
                    ))}
                </div>
            )}
        </Panel>
    )
}

// ── When customers buy (weekday × hour, IST) ─────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`

export const BuyingHeatmap = ({ heatmap = [] }) => {
    const [hover, setHover] = useState(null)
    const max = Math.max(0, ...heatmap.flat())
    const peak = useMemo(() => {
        let best = null
        heatmap.forEach((row, d) => row.forEach((v, h) => { if (v > 0 && (!best || v > best.v)) best = { d, h, v } }))
        return best
    }, [heatmap])
    const busiestDay = useMemo(() => {
        const totals = heatmap.map((row) => row.reduce((a, b) => a + b, 0))
        const m = Math.max(0, ...totals)
        return m ? DAYS[totals.indexOf(m)] : null
    }, [heatmap])

    return (
        <Panel id="heatmap" title="When customers order" description="Orders by weekday and hour, India time" className="lg:col-span-2">
            {max === 0 ? (
                <EmptyState icon={Clock} title="No orders to map yet" />
            ) : (
                <>
                    <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {peak && <p><span className="text-muted-foreground">Peak hour </span><b>{DAYS[peak.d]} {hourLabel(peak.h)}–{hourLabel((peak.h + 1) % 24)}</b></p>}
                        {busiestDay && <p><span className="text-muted-foreground">Busiest day </span><b>{busiestDay}</b></p>}
                        <p className="min-h-5 text-muted-foreground" aria-live="polite">
                            {hover ? <>{DAYS[hover.d]} {hourLabel(hover.h)}: <b className="text-foreground">{num(hover.v)} {hover.v === 1 ? 'order' : 'orders'}</b></> : 'Hover a cell for details'}
                        </p>
                    </div>
                    <div className="overflow-x-auto pb-1">
                        <div className="grid min-w-[40rem] grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-[2px]" role="grid" aria-label="Orders by weekday and hour">
                            <span />
                            {Array.from({ length: 24 }).map((_, h) => (
                                <span key={h} className="pb-1 text-center text-[0.625rem] text-muted-foreground">{h % 3 === 0 ? hourLabel(h) : ''}</span>
                            ))}
                            {heatmap.map((row, d) => (
                                <div key={DAYS[d]} className="contents" role="row">
                                    <span className="flex items-center text-[0.6875rem] font-medium text-muted-foreground" role="rowheader">{DAYS[d]}</span>
                                    {row.map((v, h) => (
                                        <span
                                            key={h}
                                            role="gridcell"
                                            aria-label={`${DAYS[d]} ${hourLabel(h)}: ${v} orders`}
                                            title={`${DAYS[d]} ${hourLabel(h)} · ${v} ${v === 1 ? 'order' : 'orders'}`}
                                            onMouseEnter={() => setHover({ d, h, v })}
                                            onMouseLeave={() => setHover(null)}
                                            className={cn('aspect-square rounded-[3px] transition-transform hover:scale-125 hover:ring-2 hover:ring-foreground/40', v === 0 && 'bg-muted')}
                                            style={v ? { background: `color-mix(in srgb, var(--viz-1) ${Math.round(20 + (v / max) * 80)}%, var(--card))` } : undefined}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 text-[0.6875rem] text-muted-foreground" aria-hidden="true">
                        Fewer
                        {[20, 40, 60, 80, 100].map((p) => <span key={p} className="size-3 rounded-[3px]" style={{ background: `color-mix(in srgb, var(--viz-1) ${p}%, var(--card))` }} />)}
                        More
                    </div>
                </>
            )}
        </Panel>
    )
}

// ── Top products ─────────────────────────────────────────────────────
export const TopProducts = ({ items = [], totalSales = 0 }) => {
    const max = Math.max(0, ...items.map((i) => i.sales))
    return (
        <Panel id="products" title="Top products" description="By net item sales in range" action={<PanelLink href={ADMIN_PRODUCT_SHOW}>All products</PanelLink>}>
            {!items.length ? (
                <EmptyState icon={ShoppingBag} title="Nothing sold in this range" />
            ) : (
                <ol className="space-y-3">
                    {items.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-3">
                            <span className="w-4 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                            <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image src={p.image || imgPlaceholder.src} alt="" fill sizes="40px" className="object-cover" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    {p.live ? (
                                        <Link href={ADMIN_PRODUCT_EDIT(p.id)} className="truncate text-sm font-medium hover:text-primary hover:underline" title={`Edit ${p.name}`}>{p.name}</Link>
                                    ) : (
                                        <span className="truncate text-sm font-medium" title="Removed from the catalogue">{p.name}</span>
                                    )}
                                    <span className="shrink-0 text-sm font-semibold tabular-nums">{inr(p.sales)}</span>
                                </div>
                                <ShareBar value={p.sales} max={max} className="mt-1.5" />
                                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                    <span className="truncate">{num(p.units)} {p.units === 1 ? 'unit' : 'units'}{p.category ? ` · ${p.category}` : ''}</span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        {pct(share(p.sales, totalSales), 0)} of sales
                                        {p.slug && (
                                            <Link href={WEBSITE_PRODUCT_DETAILS(p.slug)} target="_blank" aria-label={`View ${p.name} on the storefront`} className="hover:text-foreground">
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </Panel>
    )
}

// ── Ranked bars (categories, regions) ────────────────────────────────
const RankedBars = ({ rows, valueOf, labelOf, subOf, emptyIcon, emptyTitle }) => {
    const max = Math.max(0, ...rows.map(valueOf))
    const total = rows.reduce((s, r) => s + valueOf(r), 0)
    if (!rows.length) return <EmptyState icon={emptyIcon} title={emptyTitle} />
    return (
        <ol className="space-y-3">
            {rows.map((row) => (
                <li key={labelOf(row)}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{labelOf(row)}</span>
                        <span className="shrink-0 tabular-nums"><b>{inr(valueOf(row))}</b> <span className="text-xs text-muted-foreground">{pct(share(valueOf(row), total), 0)}</span></span>
                    </div>
                    <ShareBar value={valueOf(row)} max={max} className="mt-1.5" />
                    {subOf && <p className="mt-1 text-xs text-muted-foreground">{subOf(row)}</p>}
                </li>
            ))}
        </ol>
    )
}

export const CategoryPerformance = ({ categories = [] }) => (
    <Panel id="categories" title="Sales by category" description="Share of net item sales">
        <RankedBars
            rows={categories.slice(0, 7)}
            valueOf={(c) => c.sales}
            labelOf={(c) => c.name}
            subOf={(c) => `${num(c.units)} ${c.units === 1 ? 'unit' : 'units'}`}
            emptyIcon={Tag}
            emptyTitle="No category sales yet"
        />
    </Panel>
)

export const Regions = ({ regions = [] }) => (
    <Panel id="regions" title="Top regions" description="States by net sales">
        <RankedBars
            rows={regions}
            valueOf={(r) => r.sales}
            labelOf={(r) => r.state}
            subOf={(r) => `${num(r.orders)} ${r.orders === 1 ? 'order' : 'orders'}${r.topCity ? ` · mostly ${r.topCity}` : ''}`}
            emptyIcon={MapPin}
            emptyTitle="No deliveries in this range"
        />
    </Panel>
)

// ── Customers ────────────────────────────────────────────────────────
export const CustomerInsights = ({ customerMix, topCustomers = [], kpis, audience }) => {
    const { newCustomers = 0, returningCustomers = 0, newSales = 0, returningSales = 0 } = customerMix || {}
    const buyers = newCustomers + returningCustomers
    const split = [
        { label: 'First-time', value: newCustomers, sales: newSales, color: SLOTS[0] },
        { label: 'Returning', value: returningCustomers, sales: returningSales, color: SLOTS[1] },
    ]
    return (
        <Panel id="customers" title="Customers" description={`${num(buyers)} buyers in range · ${num(audience?.totalCustomers)} registered in total`} action={<PanelLink href={ADMIN_CUSTOMERS_SHOW}>All customers</PanelLink>}>
            {buyers === 0 ? (
                <EmptyState icon={Users} title="No buyers in this range">
                    {kpis?.newCustomers?.value ? `${num(kpis.newCustomers.value)} new accounts signed up, but none ordered yet.` : null}
                </EmptyState>
            ) : (
                <>
                    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-md" role="img" aria-label={split.map((s) => `${s.label} ${s.value}`).join(', ')}>
                        {split.filter((s) => s.value > 0).map((s) => (
                            <span key={s.label} className="h-full first:rounded-l-md last:rounded-r-md" style={{ width: `${share(s.value, buyers)}%`, background: s.color }} />
                        ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        {split.map((s) => (
                            <div key={s.label} className="rounded-lg border p-2.5">
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden="true" /> {s.label}</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums">{num(s.value)} <span className="font-normal text-muted-foreground">· {inr(s.sales, { compact: true })}</span></p>
                            </div>
                        ))}
                    </div>
                    <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Top spenders</p>
                    <ol className="divide-y">
                        {topCustomers.map((c) => (
                            <li key={c.key} className="flex items-center gap-3 py-2">
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.6875rem] font-semibold text-primary">
                                    {String(c.name || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{c.name || 'Guest'} {c.returning && <span className="ml-1 rounded-full border px-1.5 text-[0.625rem] ef-tone--sun">Returning</span>}</p>
                                    <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-semibold tabular-nums">{inr(c.sales)}</p>
                                    <p className="text-xs text-muted-foreground">{num(c.orders)} {c.orders === 1 ? 'order' : 'orders'}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </>
            )}
        </Panel>
    )
}

// ── Reviews ──────────────────────────────────────────────────────────
export const ReviewsPanel = ({ reviews, kpis }) => {
    const distribution = reviews?.distribution || []
    const total = distribution.reduce((s, d) => s + d.count, 0)
    const avg = total ? distribution.reduce((s, d) => s + d.stars * d.count, 0) / total : 0
    const max = Math.max(0, ...distribution.map((d) => d.count))
    return (
        <Panel id="reviews" title="Ratings & reviews" description={`${num(kpis?.reviews?.value)} new in range · ${num(total)} all time`} action={<PanelLink href={ADMIN_REVIEW_SHOW}>Moderate</PanelLink>}>
            {total === 0 ? (
                <EmptyState icon={Star} title="No reviews yet">Reviews appear here as customers rate products.</EmptyState>
            ) : (
                <>
                    <div className="flex items-center gap-5">
                        <div className="text-center">
                            <p className="font-header text-4xl font-semibold tabular-nums leading-none">{avg.toFixed(1)}</p>
                            <p className="mt-1 flex justify-center gap-0.5" aria-label={`${avg.toFixed(1)} out of 5`}>
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} aria-hidden="true" className={cn('size-3', i < Math.round(avg) ? 'fill-[var(--brand-gold)] text-[var(--brand-gold)]' : 'text-foreground/20')} />)}
                            </p>
                        </div>
                        <ul className="flex-1 space-y-1">
                            {distribution.map((d) => (
                                <li key={d.stars} className="flex items-center gap-2 text-xs">
                                    <span className="w-6 tabular-nums text-muted-foreground">{d.stars}★</span>
                                    <ShareBar value={d.count} max={max} className="h-2" />
                                    <span className="w-6 text-right tabular-nums">{d.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {reviews.lowRated?.length > 0 && (
                        <div className="mt-4 border-t pt-3">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--viz-bad)]"><AlertTriangle className="size-3.5" aria-hidden="true" /> Recent low ratings</p>
                            <ul className="space-y-2">
                                {reviews.lowRated.slice(0, 3).map((r) => (
                                    <li key={r.id} className="rounded-lg border p-2.5 text-sm">
                                        <p className="flex items-center justify-between gap-2"><span className="truncate font-medium">{r.product}</span><span className="shrink-0 text-xs text-muted-foreground">{r.rating}★ · {relative(r.createdAt)}</span></p>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.title || r.review}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}
        </Panel>
    )
}

// ── Audience ─────────────────────────────────────────────────────────
export const AudiencePanel = ({ audience, kpis }) => {
    const sources = Object.entries(audience?.newsletterSources || {}).sort((a, b) => b[1] - a[1])
    const max = Math.max(0, ...sources.map(([, v]) => v))
    const stats = [
        { label: 'New accounts', value: kpis?.newCustomers?.value, icon: Users, href: ADMIN_CUSTOMERS_SHOW },
        { label: 'Newsletter sign-ups', value: kpis?.signups?.value, icon: Mail, href: ADMIN_NEWSLETTER_SHOW },
        { label: 'Contact queries', value: audience?.contacts, icon: Inbox, href: ADMIN_CONTACTS_SHOW },
        { label: 'Active subscribers', value: audience?.subscribers, icon: Mail, href: ADMIN_NEWSLETTER_SHOW },
    ]
    return (
        <Panel id="audience" title="Audience growth" description="Accounts, subscribers and enquiries">
            <div className="grid grid-cols-2 gap-2">
                {stats.map(({ label, value, icon: Icon, href }) => (
                    <Link key={label} href={href} className="rounded-lg border p-3 transition hover:border-primary/40 hover:bg-muted/40">
                        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
                        <p className="mt-2 font-header text-xl font-semibold tabular-nums leading-none">{num(value)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                    </Link>
                ))}
            </div>
            <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Sign-ups by placement</p>
            {sources.length ? (
                <ul className="space-y-2">
                    {sources.map(([source, count]) => (
                        <li key={source} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2 text-xs">
                            <span className="truncate">{NEWSLETTER_SOURCE_LABEL[source] || source}</span>
                            <ShareBar value={count} max={max} />
                            <span className="text-right font-semibold tabular-nums">{count}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-muted-foreground">No newsletter sign-ups in this range.</p>
            )}
        </Panel>
    )
}

// ── Catalogue health ─────────────────────────────────────────────────
export const CatalogueHealth = ({ catalogue }) => {
    const { total = 0, sold = 0, unsold = 0, unsoldSample = [] } = catalogue || {}
    return (
        <Panel id="catalogue" title="Catalogue health" description="Which live products sold in this range" action={<PanelLink href={ADMIN_PRODUCT_SHOW}>Products</PanelLink>}>
            {total === 0 ? (
                <EmptyState icon={PackageX} title="No live products" />
            ) : (
                <>
                    <div className="flex items-end justify-between gap-3">
                        <p><span className="font-header text-3xl font-semibold tabular-nums">{pct(share(sold, total), 0)}</span> <span className="text-sm text-muted-foreground">of products sold</span></p>
                        <p className="text-right text-xs text-muted-foreground">{num(sold)} sold · {num(unsold)} not yet</p>
                    </div>
                    <ShareBar value={sold} max={total} className="mt-2 h-2.5" />
                    {unsoldSample.length > 0 && (
                        <>
                            <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">No sales yet — consider featuring or discounting</p>
                            <ul className="flex flex-wrap gap-1.5">
                                {unsoldSample.map((p) => (
                                    <li key={p.id}>
                                        <Link href={ADMIN_PRODUCT_EDIT(p.id)} className="inline-block max-w-[12rem] truncate rounded-full border px-2.5 py-1 text-xs transition hover:border-primary/40 hover:bg-muted">{p.name}</Link>
                                    </li>
                                ))}
                                {unsold > unsoldSample.length && <li className="px-1 py-1 text-xs text-muted-foreground">+{num(unsold - unsoldSample.length)} more</li>}
                            </ul>
                        </>
                    )}
                </>
            )}
        </Panel>
    )
}

// ── Recent orders ────────────────────────────────────────────────────
const STATUS_TONE = { pending: 'sun', processing: 'olive', shipped: 'pine', delivered: 'forest', cancelled: 'danger', unverified: 'danger' }

export const RecentOrders = ({ orders = [] }) => (
    <Panel id="recent" title="Latest orders" description="Most recent in range" action={<PanelLink href={ADMIN_ORDER_SHOW}>All orders</PanelLink>}>
        {!orders.length ? (
            <EmptyState icon={ShoppingBag} title="No orders in this range" />
        ) : (
            <ul className="divide-y">
                {orders.map((o) => (
                    <li key={o.order_id}>
                        <Link href={ADMIN_ORDER_DETAILS(o.order_id)} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/60">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{o.name || 'Guest'}</p>
                                <p className="truncate font-mono text-[0.6875rem] text-muted-foreground">{o.order_id} · {dateTime(o.createdAt)}</p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                                <span className="text-sm font-semibold tabular-nums">{inr(o.totalAmount)}</span>
                                <span className={cn('rounded-full border px-2 py-0 text-[0.625rem] font-medium capitalize', `ef-tone--${STATUS_TONE[o.status] || 'pine'}`)}>{o.status}</span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </Panel>
)
