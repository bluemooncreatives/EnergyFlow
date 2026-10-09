'use client'

import { useId, useState } from 'react'
import { ChevronDown, Loader2, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatFilterRange } from '@/lib/adminCatalogFilters.mjs'

const inputClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-9 sm:text-sm'

function SelectFilter({ spec, value = [], options = [], onChange, busy, disabled }) {
    const [search, setSearch] = useState('')
    // Keep selected values removable even if another filter gives them zero matches.
    const available = [...options, ...value.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v || 'Unassigned', count: 0 }))]
    const shown = available.filter((option) => option.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    return (
        <Popover onOpenChange={() => setSearch('')}>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled && !value.length} className="h-10 max-w-full gap-2 px-3 sm:h-9" aria-label={`Filter by ${spec.label}`}>
                    {spec.label}
                    {value.length > 0 && <span className="rounded bg-primary px-1.5 text-xs text-primary-foreground">{value.length}</span>}
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-3" aria-label={`${spec.label} filter`}>
                <p className="font-semibold">{spec.label}</p>
                <input type="search" className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Find ${spec.label.toLowerCase()}…`} aria-label={`Search ${spec.label} options`} />
                <div className="max-h-64 overflow-y-auto" aria-busy={busy}>
                    {shown.length ? shown.map((option) => (
                        <label key={option.value} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted">
                            <Checkbox checked={value.includes(option.value)} disabled={busy && !value.includes(option.value)} onCheckedChange={(checked) => onChange(checked ? [...value, option.value] : value.filter((v) => v !== option.value))} />
                            <span className="min-w-0 flex-1 break-words">{option.label}</span>
                            <span className="text-xs tabular-nums text-muted-foreground">{option.count}</span>
                        </label>
                    )) : <p className="px-2 py-4 text-sm text-muted-foreground">{busy ? 'Loading options…' : 'No matching options.'}</p>}
                </div>
                {value.length > 0 && <Button variant="ghost" size="sm" onClick={() => onChange([])}>Clear {spec.label.toLowerCase()}</Button>}
            </PopoverContent>
        </Popover>
    )
}

function RangeFilter({ spec, value, bounds, onChange, disabled }) {
    const id = useId()
    const [open, setOpen] = useState(false)
    const [min, setMin] = useState(value?.min ?? '')
    const [max, setMax] = useState(value?.max ?? '')
    const [error, setError] = useState('')
    const active = Boolean(formatFilterRange(value, spec.unit))
    const apply = (event) => {
        event.preventDefault()
        const next = {}
        if (min !== '') next.min = Number(min)
        if (max !== '') next.max = Number(max)
        if (Object.values(next).some((v) => !Number.isFinite(v) || v < 0 || (spec.unit === '%' && v > 100))) {
            setError(spec.unit === '%' ? 'Enter a percentage from 0 to 100.' : 'Enter a valid amount of 0 or more.')
            return
        }
        if (next.min !== undefined && next.max !== undefined && next.min > next.max) {
            setError('Minimum must not exceed maximum.')
            return
        }
        onChange(Object.keys(next).length ? next : undefined)
        setOpen(false)
    }
    return (
        <Popover open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); setMin(value?.min ?? ''); setMax(value?.max ?? ''); setError('') }}>
            <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled && !active} className="h-10 max-w-full gap-2 px-3 sm:h-9" aria-label={`Filter by ${spec.label}`}>
                    {spec.label}
                    {active && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Active" />}
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)] p-3" aria-label={`${spec.label} filter`}>
                <p className="font-semibold">{spec.label} range</p>
                <p className="text-xs text-muted-foreground">{bounds?.min != null ? `Available: ${formatFilterRange(bounds, spec.unit)}` : 'No values match the current search and filters.'}</p>
                <form onSubmit={apply} className="space-y-3" noValidate>
                    <div className="grid grid-cols-2 gap-3">
                        {['min', 'max'].map((bound) => (
                            <div key={bound} className="space-y-1">
                                <label htmlFor={`${id}-${bound}`} className="text-xs font-medium">{bound === 'min' ? 'Minimum' : 'Maximum'} ({spec.unit})</label>
                                <input id={`${id}-${bound}`} type="number" min="0" max={spec.unit === '%' ? 100 : undefined} step="any" inputMode="decimal" className={inputClass} value={bound === 'min' ? min : max} onChange={(e) => { (bound === 'min' ? setMin : setMax)(e.target.value); setError('') }} placeholder={bounds?.[bound] != null ? String(bounds[bound]) : 'Any'} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
                            </div>
                        ))}
                    </div>
                    {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
                    <div className="flex justify-between gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(undefined); setMin(''); setMax(''); setError(''); setOpen(false) }}>Clear</Button>
                        <Button type="submit" size="sm">Apply range</Button>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    )
}

export default function DataTableFilters({ table, config, facets, total, busy, loading, failed }) {
    const filters = table.getState().columnFilters
    const change = (id, value) => table.setColumnFilters((current) => [
        ...current.filter((filter) => filter.id !== id),
        ...(value !== undefined && (!Array.isArray(value) || value.length) ? [{ id, value }] : []),
    ])
    return (
        <div className="space-y-3 border-b bg-muted/20 px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-semibold text-muted-foreground"><SlidersHorizontal className="size-3.5" aria-hidden="true" /> Filters</span>
                {config.map((spec) => {
                    const value = filters.find((filter) => filter.id === spec.id)?.value
                    return spec.type === 'select'
                        ? <SelectFilter key={spec.id} spec={spec} value={value} options={facets?.[spec.id]} onChange={(next) => change(spec.id, next)} busy={busy} disabled={loading || failed} />
                        : <RangeFilter key={spec.id} spec={spec} value={value} bounds={facets?.[spec.id]} onChange={(next) => change(spec.id, next)} disabled={loading || failed} />
                })}
                {filters.length > 0 && <Button variant="ghost" className="h-10 gap-1 px-2 text-muted-foreground sm:h-9" onClick={() => table.resetColumnFilters()}><X className="size-3.5" aria-hidden="true" /> Clear filters</Button>}
                <span role="status" className="ml-auto inline-flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                    {busy ? <><Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Updating…</> : failed ? 'Results unavailable' : `${Number(total).toLocaleString('en-IN')} ${total === 1 ? 'result' : 'results'}`}
                </span>
            </div>
            {filters.length > 0 && (
                <div className="flex flex-wrap gap-2" aria-label="Active filters">
                    {filters.map((filter) => {
                        const spec = config.find((item) => item.id === filter.id)
                        if (!spec) return null
                        const summary = spec.type === 'range' ? formatFilterRange(filter.value, spec.unit) : filter.value.map((v) => v || 'Unassigned').join(', ')
                        return <button type="button" key={filter.id} onClick={() => change(filter.id, undefined)} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary/20 bg-secondary px-2.5 py-1.5 text-xs text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40" aria-label={`Remove ${spec.label} filter: ${summary}`}>
                            <span className="truncate" title={summary}>{spec.label}: {summary}</span><X className="size-3 shrink-0" aria-hidden="true" />
                        </button>
                    })}
                </div>
            )}
        </div>
    )
}
