'use client'

/**
 * Analytics → Customers tab
 * CustomerInsights + AudiencePanel + Regions + KPI tiles for customers
 */

import { useMemo } from 'react'
import { Users, UserPlus, Repeat2, MapPin } from 'lucide-react'
import { num, pct } from '../format'
import { KpiTile } from '../ui'
import { CustomerInsights, AudiencePanel, Regions } from '../Panels'
import { ADMIN_CUSTOMERS_SHOW } from '@/routes/AdminPanelRoute'

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

const CustomersTab = ({ data, isLoading, kpis, timeline }) => {
    const tiles = useMemo(() => kpis ? [
        { label: 'Buyers', value: num(kpis.customers.value), change: kpis.customers.change, hint: 'Unique customers who ordered', href: ADMIN_CUSTOMERS_SHOW },
        { label: 'New accounts', value: num(kpis.newCustomers.value), change: kpis.newCustomers.change, hint: 'Customer sign-ups this period', spark: timeline, sparkKey: 'signups', href: ADMIN_CUSTOMERS_SHOW },
        { label: 'Returning buyers', value: pct(kpis.returningRate.value), hint: 'Had ordered before this range' },
        { label: 'Cancellation rate', value: pct(kpis.cancelRate.value), change: kpis.cancelRate.change, inverse: true, hint: 'Of all orders placed' },
    ] : Array.from({ length: 4 }, (_, i) => ({ label: ['Buyers','New accounts','Returning buyers','Cancellation rate'][i], spark: i === 1 ? [] : undefined })), [kpis, timeline])

    return (
        <div className="flex flex-col gap-6">
            {/* Customer KPIs */}
            <div>
                <SectionLabel icon={Users} bg="var(--chart-1)" title="Customer KPIs" description="Acquisition, retention and engagement metrics" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {tiles.map((tile, i) => <KpiTile key={tile.label} index={i + 4} {...tile} loading={isLoading || !data} />)}
                </div>
            </div>

            {/* Customer insights + audience growth */}
            <div>
                <SectionLabel icon={UserPlus} bg="var(--chart-2)" fg="#0A2F24" title="Audience & Loyalty" description="New vs returning buyers, top spenders and newsletter growth" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <CustomerInsights customerMix={data?.customerMix} topCustomers={data?.topCustomers} kpis={data?.kpis} audience={data?.audience} />
                    <AudiencePanel audience={data?.audience} kpis={data?.kpis} />
                </div>
            </div>

            {/* Geographic reach */}
            <div>
                <SectionLabel icon={MapPin} bg="var(--chart-3)" title="Geographic Reach" description="States by net sales volume in this range" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Regions regions={data?.regions} />
                </div>
            </div>
        </div>
    )
}

export default CustomersTab
