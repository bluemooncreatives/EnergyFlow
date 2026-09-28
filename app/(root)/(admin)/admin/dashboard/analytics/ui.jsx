'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

/** Card shell for one report. `action` sits top-right (a link or toggle). */
export const Panel = ({ title, description, action, className, children, id }) => (
    <section id={id} className={cn('flex min-w-0 flex-col rounded-xl border bg-card', className)} aria-labelledby={id ? `${id}-title` : undefined}>
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
                <h3 id={id ? `${id}-title` : undefined} className="text-[0.9375rem] font-semibold leading-tight">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
            </div>
            {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">{children}</div>
    </section>
)

export const PanelLink = ({ href, children = 'View all' }) => (
    <Link href={href} className="group inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-muted">
        {children}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
)

/**
 * Change vs the previous period. `inverse` for metrics where down is good
 * (cancellation rate). `null` change = no previous data ("New").
 * Colour is never alone: arrow icon + signed text.
 */
export const Delta = ({ change, inverse = false, className }) => {
    if (change === null || change === undefined) {
        return (
            <span className={cn('inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary', className)} title="No data in the previous period to compare with">
                <Sparkles className="size-3" aria-hidden="true" /> New
            </span>
        )
    }
    const flat = Math.abs(change) < 0.05
    const up = change > 0
    const good = flat ? null : inverse ? !up : up
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums',
                good === null ? 'bg-muted text-muted-foreground' : good ? 'bg-[color-mix(in_srgb,var(--viz-good)_12%,transparent)] text-[var(--viz-good)]' : 'bg-[color-mix(in_srgb,var(--viz-bad)_12%,transparent)] text-[var(--viz-bad)]'
            )}
            aria-label={`${flat ? 'No change' : `${up ? 'Up' : 'Down'} ${Math.abs(change)}%`} versus the previous period`}
        >
            <Icon className="size-3" aria-hidden="true" />
            {flat ? '0%' : `${up ? '+' : '−'}${Math.abs(change).toFixed(1).replace(/\.0$/, '')}%`}
        </span>
    )
}

/** Single-series sparkline — one hue, no axes; the tile's title names it. */
export const Sparkline = ({ data, dataKey, id }) => {
    const hasData = data?.some((d) => Number(d[dataKey]) > 0)
    if (!hasData) return <div className="h-10" aria-hidden="true" />
    return (
        <div className="h-10" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={dataKey} stroke="var(--viz-1)" strokeWidth={2} fill={`url(#spark-${id})`} isAnimationActive={false} dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export const KpiTile = ({ label, value, change, inverse, hint, spark, sparkKey, href, loading }) => {
    const body = (
        <>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {!loading && change !== undefined && <Delta change={change} inverse={inverse} />}
            </div>
            <p className="mt-2 font-header text-[1.625rem] font-semibold leading-none tracking-tight tabular-nums">
                {loading ? <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted align-middle" /> : value}
            </p>
            {hint && <p className="mt-1.5 truncate text-xs text-muted-foreground">{hint}</p>}
            {spark && <div className="mt-auto pt-3">{loading ? <div className="h-10 animate-pulse rounded bg-muted/60" /> : <Sparkline data={spark} dataKey={sparkKey} id={sparkKey + label.replace(/\W/g, '')} />}</div>}
        </>
    )
    const cls = 'flex h-full min-w-0 flex-col rounded-xl border bg-card p-4 transition'
    return href ? (
        <Link href={href} className={cn(cls, 'hover:border-primary/40 hover:shadow-[0_8px_24px_-12px_rgb(11_61_46/0.25)]')}>{body}</Link>
    ) : (
        <div className={cls}>{body}</div>
    )
}

/** Chart / table switch (every chart has a table view). */
export const ViewToggle = ({ value, onChange }) => (
    <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium" role="tablist" aria-label="Display as">
        {['chart', 'table'].map((mode) => (
            <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={value === mode}
                onClick={() => onChange(mode)}
                className={cn('rounded-md px-2.5 py-1 capitalize transition', value === mode ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
            >
                {mode}
            </button>
        ))}
    </div>
)

/** Tooltip body for recharts: values in text tokens, a swatch carries identity. */
export const TooltipCard = ({ title, rows }) => (
    <div className="min-w-[10rem] rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg">
        {title && <p className="mb-1.5 font-semibold">{title}</p>}
        <div className="space-y-1">
            {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        {row.color && <span className={cn('inline-block size-2.5 rounded-sm', row.dashed && 'border border-dashed bg-transparent')} style={{ background: row.dashed ? 'transparent' : row.color, borderColor: row.color }} aria-hidden="true" />}
                        {row.label}
                    </span>
                    <span className="font-semibold tabular-nums">{row.value}</span>
                </div>
            ))}
        </div>
    </div>
)

export const EmptyState = ({ icon: Icon, title, children, className }) => (
    <div className={cn('flex flex-1 flex-col items-center justify-center py-8 text-center', className)}>
        {Icon && <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span>}
        <p className="mt-3 text-sm font-medium">{title}</p>
        {children && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{children}</p>}
    </div>
)

/** Horizontal share bar used by ranked lists (single hue, 4px rounded end). */
export const ShareBar = ({ value, max, className }) => (
    <span className={cn('block h-1.5 w-full overflow-hidden rounded-full bg-muted', className)} aria-hidden="true">
        <span className="block h-full rounded-full bg-[var(--viz-1)] transition-[width] duration-700" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
    </span>
)
