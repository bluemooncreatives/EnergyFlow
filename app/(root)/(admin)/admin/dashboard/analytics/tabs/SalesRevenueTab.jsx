'use client'

/**
 * Analytics → Sales & Revenue tab
 * Deep-dive: SalesTrend + MoneyFlow + ActionCenter KPI tiles
 */

import { useMemo } from 'react'
import { IndianRupee, TrendingUp } from 'lucide-react'
import { num, inr, pct } from '../format'
import { KpiTile } from '../ui'
import SalesTrend from '../SalesTrend'
import { MoneyFlow, ActionCenter } from '../Panels'
import { ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute'

const SectionLabel = ({ icon: Icon, bg, fg = 'var(--primary-foreground)', title, description }) => (
    <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg, color: fg }} aria-hidden="true">
            <Icon className="size-4" />
        </span>
        <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
    </div>
)

const SalesRevenueTab = ({ data, isLoading, kpis, timeline }) => {
    const tiles = useMemo(() => kpis ? [
        { label: 'Net sales', value: inr(kpis.sales.value), change: kpis.sales.change, hint: `vs ${inr(kpis.sales.previous)} prior period`, spark: timeline, sparkKey: 'sales', href: ADMIN_ORDER_SHOW },
        { label: 'Orders', value: num(kpis.orders.value), change: kpis.orders.change, hint: `${num(data?.breakdown?.placed)} placed · ${num(data?.breakdown?.cancelled)} cancelled`, spark: timeline, sparkKey: 'orders', href: ADMIN_ORDER_SHOW },
        { label: 'Avg. order value', value: inr(kpis.aov.value), change: kpis.aov.change, hint: `${kpis.unitsPerOrder?.value} units per order`, spark: timeline, sparkKey: 'aov' },
        { label: 'Units sold', value: num(kpis.units.value), change: kpis.units.change, hint: `${inr(kpis.discounts.value)} in coupon discounts`, spark: timeline, sparkKey: 'units' },
        { label: 'Collected', value: inr(kpis.collected?.value), hint: 'Already in bank' },
        { label: 'Outstanding', value: inr(kpis.outstanding?.value), hint: 'COD / partial pending' },
        { label: 'Cancellation rate', value: pct(kpis.cancelRate.value), change: kpis.cancelRate.change, inverse: true, hint: 'Of orders placed' },
        { label: 'Coupon discounts', value: inr(kpis.discounts.value), hint: 'Total discount given' },
    ] : Array.from({ length: 8 }, (_, i) => ({ label: ['Net sales','Orders','Avg. order value','Units sold','Collected','Outstanding','Cancellation rate','Coupon discounts'][i], spark: i < 4 ? [] : undefined })), [kpis, timeline, data])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Action center */}
            <ActionCenter actions={data?.actions} loading={isLoading} />

            {/* KPI tiles */}
            <div>
                <SectionLabel icon={IndianRupee} bg="var(--chart-1)" title="Sales KPIs" description="Compared with the previous period of equal length" />
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {tiles.map((tile, i) => <KpiTile key={tile.label} index={i} {...tile} loading={isLoading || !data} />)}
                </div>
            </div>

            {/* Sales trend + money flow */}
            <div>
                <SectionLabel icon={TrendingUp} bg="var(--chart-3)" title="Revenue Over Time" description="Interactive trend chart with period comparison" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {data ? <SalesTrend data={data} kpis={data.kpis} /> : <div className="h-64 animate-pulse rounded-xl bg-muted lg:col-span-2" />}
                    <MoneyFlow breakdown={data?.breakdown} />
                </div>
            </div>
        </div>
    )
}

export default SalesRevenueTab
