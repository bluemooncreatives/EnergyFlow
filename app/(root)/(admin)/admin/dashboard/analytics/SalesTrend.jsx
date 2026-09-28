'use client'

import { useMemo, useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bucketLabel, inr, num } from './format'
import { Delta, EmptyState, Panel, TooltipCard, ViewToggle } from './ui'

const METRICS = [
    { id: 'sales', label: 'Net sales', format: (v) => inr(v), axis: (v) => inr(v, { compact: true }), compare: 'previousSales' },
    { id: 'orders', label: 'Orders', format: num, axis: num },
    { id: 'aov', label: 'Avg. order', format: (v) => inr(v), axis: (v) => inr(v, { compact: true }) },
    { id: 'units', label: 'Units', format: num, axis: num },
    { id: 'signups', label: 'Sign-ups', format: num, axis: num },
]

/**
 * The headline trend. One measure at a time on one axis (never dual-axis);
 * net sales can overlay the previous period as a dashed line, aligned
 * bucket-for-bucket. Crosshair tooltip on hover; a table view for exact
 * values and screen readers.
 */
const SalesTrend = ({ data, kpis }) => {
    const [metricId, setMetricId] = useState('sales')
    const [compare, setCompare] = useState(true)
    const [view, setView] = useState('chart')
    const metric = METRICS.find((m) => m.id === metricId)
    const { timeline = [], range } = data
    const granularity = range.granularity
    const showCompare = compare && Boolean(metric.compare)

    const total = useMemo(() => {
        if (metricId === 'aov') return kpis.aov.value
        return timeline.reduce((s, row) => s + (Number(row[metricId]) || 0), 0)
    }, [kpis, metricId, timeline])

    const change = { sales: kpis.sales.change, orders: kpis.orders.change, aov: kpis.aov.change, units: kpis.units.change, signups: kpis.newCustomers.change }[metricId]
    const hasData = timeline.some((row) => Number(row[metricId]) > 0 || (showCompare && Number(row.previousSales) > 0))
    const tickEvery = Math.max(0, Math.ceil(timeline.length / 8) - 1)

    const renderTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null
        const row = payload[0].payload
        const rows = [{ label: metric.label, value: metric.format(row[metricId]), color: 'var(--viz-1)' }]
        if (showCompare) rows.push({ label: 'Previous period', value: metric.format(row[metric.compare]), color: 'var(--viz-prev)', dashed: true })
        if (metricId === 'sales') rows.push({ label: 'Orders', value: num(row.orders) })
        return <TooltipCard title={bucketLabel(label, granularity, true)} rows={rows} />
    }

    return (
        <Panel
            id="trend"
            title="Performance over time"
            description={`${range.label} · by ${granularity} · India time`}
            action={<ViewToggle value={view} onChange={setView} />}
            className="lg:col-span-2"
        >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Metric">
                    {METRICS.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            role="tab"
                            aria-selected={metricId === m.id}
                            onClick={() => setMetricId(m.id)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-xs font-medium transition',
                                metricId === m.id ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                            )}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-2xl sm:text-3xl font-bold tabular-nums leading-none tracking-tight">{metric.format(total)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{metricId === 'aov' ? 'average in range' : 'total in range'}</p>
                    </div>
                    <Delta change={change} />
                </div>
            </div>

            {metric.compare && view === 'chart' && (
                <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} className="size-3.5 accent-[var(--viz-1)]" />
                    Compare with previous period
                </label>
            )}

            {!hasData ? (
                <EmptyState icon={TrendingUp} title={`No ${metric.label.toLowerCase()} in this range`} className="min-h-[16rem]">
                    Try a longer range — the chart fills in as orders come in.
                </EmptyState>
            ) : view === 'table' ? (
                <div className="max-h-[18rem] overflow-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <tr>
                                <th className="px-3 py-2 font-semibold">{granularity === 'hour' ? 'Hour' : granularity === 'month' ? 'Month' : granularity === 'week' ? 'Week' : 'Day'}</th>
                                <th className="px-3 py-2 text-right font-semibold">{metric.label}</th>
                                {metric.compare ? <th className="px-3 py-2 text-right font-semibold">Previous</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {timeline.map((row) => (
                                <tr key={row.key} className="border-t">
                                    <td className="px-3 py-2 text-xs sm:text-sm">{bucketLabel(row.key, granularity, true)}</td>
                                    <td className="px-3 py-2 text-right text-xs sm:text-sm tabular-nums font-medium">{metric.format(row[metricId])}</td>
                                    {metric.compare ? <td className="px-3 py-2 text-right text-xs sm:text-sm tabular-nums text-muted-foreground">{metric.format(row[metric.compare])}</td> : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="h-[18rem] w-full animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none" role="img" aria-label={`${metric.label} ${range.label.toLowerCase()}, total ${metric.format(total)}. Switch to the table view for every value.`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.24} />
                                    <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                            <XAxis
                                dataKey="key"
                                tickFormatter={(k) => bucketLabel(k, granularity)}
                                interval={tickEvery}
                                tick={{ fontSize: 11, fill: 'var(--viz-axis)' }}
                                tickLine={false}
                                axisLine={{ stroke: 'var(--viz-grid)' }}
                                minTickGap={8}
                            />
                            <YAxis
                                tickFormatter={metric.axis}
                                tick={{ fontSize: 11, fill: 'var(--viz-axis)' }}
                                tickLine={false}
                                axisLine={false}
                                width={58}
                                allowDecimals={metricId === 'sales' || metricId === 'aov'}
                            />
                            <Tooltip content={renderTooltip} cursor={{ stroke: 'var(--viz-axis)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            {showCompare && (
                                <Line type="monotone" dataKey={metric.compare} stroke="var(--viz-prev)" strokeWidth={2} strokeDasharray="5 4" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} isAnimationActive={false} />
                            )}
                            <Area
                                type="monotone"
                                dataKey={metricId}
                                stroke="var(--viz-1)"
                                strokeWidth={2}
                                fill="url(#trend-fill)"
                                dot={timeline.length <= 31 ? { r: 2.5, fill: 'var(--viz-1)', strokeWidth: 0 } : false}
                                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--viz-1)' }}
                                isAnimationActive={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}

            {showCompare && hasData && view === 'chart' && (
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground" aria-hidden="true">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[var(--viz-1)]" /> This period</span>
                    <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[var(--viz-prev)]" /> Previous period</span>
                </div>
            )}
        </Panel>
    )
}

export default SalesTrend
