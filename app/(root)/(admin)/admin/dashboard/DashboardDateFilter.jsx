'use client'

/**
 * Universal Dashboard Date Filter
 * End-to-end filtering by:
 *   1. Presets (Today, Yesterday, 7D, 30D, 90D, This Month, Last Month, YTD, All)
 *   2. Month (Pick any Month: Jan–Dec + Year: 2024–2027)
 *   3. Year (Pick any Full Calendar Year: 2024–2027)
 *   4. Date (Exact Single Day)
 *   5. Custom Range (From date to To date)
 *
 * URL state is synchronized seamlessly across both Overview and Analytics tabs.
 */

import { useState, useMemo, Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
    Calendar,
    CalendarDays,
    CalendarRange,
    Clock,
    Filter,
    RotateCcw,
    Check,
    CalendarCheck,
    Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const MONTHS = [
    { value: '1', label: 'January', short: 'Jan' },
    { value: '2', label: 'February', short: 'Feb' },
    { value: '3', label: 'March', short: 'Mar' },
    { value: '4', label: 'April', short: 'Apr' },
    { value: '5', label: 'May', short: 'May' },
    { value: '6', label: 'June', short: 'Jun' },
    { value: '7', label: 'July', short: 'Jul' },
    { value: '8', label: 'August', short: 'Aug' },
    { value: '9', label: 'September', short: 'Sep' },
    { value: '10', label: 'October', short: 'Oct' },
    { value: '11', label: 'November', short: 'Nov' },
    { value: '12', label: 'December', short: 'Dec' },
]

export const PRESETS = [
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'yesterday', label: 'Yesterday', icon: Clock },
    { id: '7d', label: '7D' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: '12m', label: '12M' },
    { id: 'ytd', label: 'YTD' },
    { id: 'all', label: 'All' },
]

const todayIst = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10)
const currentYearIst = () => new Date(Date.now() + 330 * 60000).getUTCFullYear()
const currentMonthIst = () => new Date(Date.now() + 330 * 60000).getUTCMonth() + 1

const DashboardDateFilterInner = ({ className, compact = false }) => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const range = searchParams.get('range') || '30d'
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const year = searchParams.get('year') || ''
    const month = searchParams.get('month') || ''
    const date = searchParams.get('date') || ''

    // Determine active filter mode: 'presets' | 'month' | 'year' | 'date' | 'custom'
    const activeMode = useMemo(() => {
        if (date || range === 'date') return 'date'
        if (month || range === 'month') return 'month'
        if ((year && range === 'year') || range === 'year') return 'year'
        if (range === 'custom' || (from && to)) return 'custom'
        return 'presets'
    }, [range, date, month, year, from, to])

    const [selectedMode, setSelectedMode] = useState(activeMode)
    const [draftFrom, setDraftFrom] = useState(from || '')
    const [draftTo, setDraftTo] = useState(to || todayIst())
    const [draftDate, setDraftDate] = useState(date || todayIst())
    const [draftYear, setDraftYear] = useState(year || String(currentYearIst()))
    const [draftMonth, setDraftMonth] = useState(month || String(currentMonthIst()))

    // Years available in dropdown: currentYear - 3 to currentYear + 1
    const availableYears = useMemo(() => {
        const cur = currentYearIst()
        return [cur + 1, cur, cur - 1, cur - 2, cur - 3].map(String)
    }, [])

    // Update URL helper
    const updateParams = (updates) => {
        const q = new URLSearchParams(searchParams.toString())
        // Clear old filter keys
        const filterKeys = ['range', 'from', 'to', 'year', 'month', 'date']
        filterKeys.forEach((k) => q.delete(k))

        // Set new keys
        Object.entries(updates).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                q.set(k, String(v))
            }
        })
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    // Handlers
    const handlePreset = (presetId) => {
        setSelectedMode('presets')
        updateParams({ range: presetId })
    }

    const handleApplyMonth = (m = draftMonth, y = draftYear) => {
        setDraftMonth(m)
        setDraftYear(y)
        updateParams({ range: 'month', month: m, year: y })
    }

    const handleApplyYear = (y = draftYear) => {
        setDraftYear(y)
        updateParams({ range: 'year', year: y })
    }

    const handleApplyDate = (d = draftDate) => {
        setDraftDate(d)
        updateParams({ range: 'date', date: d })
    }

    const handleApplyCustom = (e) => {
        if (e?.preventDefault) e.preventDefault()
        if (!draftFrom || !draftTo || draftFrom > draftTo) return
        updateParams({ range: 'custom', from: draftFrom, to: draftTo })
    }

    const handleReset = () => {
        setSelectedMode('presets')
        setDraftFrom('')
        setDraftTo(todayIst())
        setDraftDate(todayIst())
        setDraftYear(String(currentYearIst()))
        setDraftMonth(String(currentMonthIst()))
        updateParams({ range: '30d' })
    }

    // Active label badge text
    const activeLabel = useMemo(() => {
        if (date || range === 'date') {
            return `Date: ${date || draftDate}`
        }
        if (month || range === 'month') {
            const mObj = MONTHS.find((m) => m.value === (month || draftMonth))
            return `Month: ${mObj?.label || 'Month'} ${year || draftYear}`
        }
        if ((year && range === 'year') || range === 'year') {
            return `Full Year: ${year || draftYear}`
        }
        if (range === 'custom') {
            return `Range: ${from || draftFrom} to ${to || draftTo}`
        }
        const pObj = PRESETS.find((p) => p.id === range)
        return pObj ? `Preset: ${pObj.label}` : 'Preset: Last 30 days'
    }, [range, date, month, year, from, to, draftDate, draftMonth, draftYear, draftFrom, draftTo])

    const isNonDefault = range !== '30d' || year || month || date || from || to

    return (
        <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm print:hidden', className)}>
            {/* Top Bar: Mode Selector & Active Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Filter className="size-3.5 text-primary" /> Filter by:
                    </span>

                    {/* Mode buttons: one scrollable segmented row on phones */}
                    <div className="no-scrollbar flex max-w-full items-center overflow-x-auto rounded-lg bg-muted p-0.5 max-sm:w-full">
                        <button
                            type="button"
                            onClick={() => setSelectedMode('presets')}
                            className={cn(
                                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-2 sm:py-1',
                                selectedMode === 'presets' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Clock className="size-3" /> Quick Presets
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedMode('month')}
                            className={cn(
                                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-2 sm:py-1',
                                selectedMode === 'month' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <CalendarDays className="size-3" /> Month
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedMode('year')}
                            className={cn(
                                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-2 sm:py-1',
                                selectedMode === 'year' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <CalendarCheck className="size-3" /> Year
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedMode('date')}
                            className={cn(
                                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-2 sm:py-1',
                                selectedMode === 'date' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <Calendar className="size-3" /> Specific Date
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedMode('custom')}
                            className={cn(
                                'flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition sm:px-2 sm:py-1',
                                selectedMode === 'custom' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <CalendarRange className="size-3" /> Custom Range
                        </button>
                    </div>
                </div>

                {/* Right: Active Filter Pill + Reset */}
                <div className="flex min-w-0 items-center gap-2 max-sm:w-full max-sm:justify-between">
                    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="truncate">{activeLabel}</span>
                    </span>
                    {isNonDefault && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 shrink-0 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground sm:h-7"
                            title="Reset to 30 Days default"
                        >
                            <RotateCcw className="size-3" /> Reset
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom Controls Area depending on selectedMode */}
            <div className="px-3 py-3 sm:px-4 sm:py-2.5">
                {/* 1. PRESETS MODE */}
                {selectedMode === 'presets' && (
                    <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                        {PRESETS.map((p) => {
                            const isSelected = activeMode === 'presets' && range === p.id
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handlePreset(p.id)}
                                    className={cn(
                                        'whitespace-nowrap rounded-md px-1.5 py-2 text-xs font-medium transition sm:px-2.5 sm:py-1',
                                        isSelected
                                            ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                            : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    {p.label}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* 2. MONTH FILTER MODE */}
                {selectedMode === 'month' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-muted-foreground">Year:</label>
                            <select
                                aria-label="Year"
                                value={draftYear}
                                onChange={(e) => {
                                    setDraftYear(e.target.value)
                                    handleApplyMonth(draftMonth, e.target.value)
                                }}
                                className="h-9 rounded-md border border-input bg-background px-2.5 text-base font-medium shadow-xs focus:outline-hidden focus:ring-1 focus:ring-primary sm:h-8 sm:text-xs"
                            >
                                {availableYears.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Pills */}
                        <div className="grid w-full grid-cols-6 gap-1 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
                            {MONTHS.map((m) => {
                                const isCurrent = activeMode === 'month' && String(month || draftMonth) === m.value && String(year || draftYear) === String(draftYear)
                                return (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => handleApplyMonth(m.value, draftYear)}
                                        className={cn(
                                            'rounded-md px-2 py-2 text-xs font-medium transition sm:py-1',
                                            isCurrent
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        {m.short}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Quick Month Actions */}
                        <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center sm:border-l sm:pl-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => handleApplyMonth(String(currentMonthIst()), String(currentYearIst()))}
                            >
                                Current Month
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => {
                                    const curM = currentMonthIst()
                                    const lastM = curM === 1 ? 12 : curM - 1
                                    const lastY = curM === 1 ? currentYearIst() - 1 : currentYearIst()
                                    handleApplyMonth(String(lastM), String(lastY))
                                }}
                            >
                                Last Month
                            </Button>
                        </div>
                    </div>
                )}

                {/* 3. YEAR FILTER MODE */}
                {selectedMode === 'year' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">Select Calendar Year:</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {availableYears.map((y) => {
                                const isCurrent = activeMode === 'year' && String(year || draftYear) === y
                                return (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => handleApplyYear(y)}
                                        className={cn(
                                            'rounded-md px-3 py-2 text-xs font-medium transition sm:py-1',
                                            isCurrent
                                                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                                                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        )}
                                    >
                                        {y}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center sm:border-l sm:pl-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => handleApplyYear(String(currentYearIst()))}
                            >
                                This Year ({currentYearIst()})
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => handleApplyYear(String(currentYearIst() - 1))}
                            >
                                Last Year ({currentYearIst() - 1})
                            </Button>
                        </div>
                    </div>
                )}

                {/* 4. EXACT DATE FILTER MODE */}
                {selectedMode === 'date' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="dash-single-date">
                            Select Exact Day:
                        </label>
                        <input
                            id="dash-single-date"
                            type="date"
                            max={todayIst()}
                            value={draftDate}
                            onChange={(e) => {
                                setDraftDate(e.target.value)
                                if (e.target.value) handleApplyDate(e.target.value)
                            }}
                            className="h-10 min-w-0 rounded-md border border-input bg-background px-2.5 text-base font-medium shadow-xs max-sm:flex-1 sm:h-8 sm:text-xs"
                        />
                        <Button
                            type="button"
                            size="sm"
                            className="h-10 px-3 text-xs sm:h-8"
                            onClick={() => handleApplyDate(draftDate)}
                        >
                            Filter Date
                        </Button>
                        <div className="grid w-full grid-cols-2 gap-1.5 sm:flex sm:w-auto sm:items-center sm:border-l sm:pl-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => {
                                    const t = todayIst()
                                    setDraftDate(t)
                                    handleApplyDate(t)
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs sm:h-7"
                                onClick={() => {
                                    const yest = new Date(Date.now() + 330 * 60000 - 86400000).toISOString().slice(0, 10)
                                    setDraftDate(yest)
                                    handleApplyDate(yest)
                                }}
                            >
                                Yesterday
                            </Button>
                        </div>
                    </div>
                )}

                {/* 5. CUSTOM RANGE MODE */}
                {selectedMode === 'custom' && (
                    <form onSubmit={handleApplyCustom} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 sm:flex sm:flex-wrap">
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="dash-from">
                            From:
                        </label>
                        <input
                            id="dash-from"
                            type="date"
                            max={draftTo || todayIst()}
                            value={draftFrom}
                            onChange={(e) => setDraftFrom(e.target.value)}
                            className="h-10 min-w-0 rounded-md border border-input bg-background px-2.5 text-base font-medium shadow-xs max-sm:flex-1 sm:h-8 sm:text-xs"
                            required
                        />
                        <span className="text-xs text-muted-foreground max-sm:hidden">to</span>
                        <label className="text-xs font-medium text-muted-foreground" htmlFor="dash-to">
                            To:
                        </label>
                        <input
                            id="dash-to"
                            type="date"
                            min={draftFrom}
                            max={todayIst()}
                            value={draftTo}
                            onChange={(e) => setDraftTo(e.target.value)}
                            className="h-10 min-w-0 rounded-md border border-input bg-background px-2.5 text-base font-medium shadow-xs max-sm:flex-1 sm:h-8 sm:text-xs"
                            required
                        />
                        <Button
                            type="submit"
                            size="sm"
                            className="h-10 px-3.5 text-xs max-sm:col-span-2 sm:h-8"
                            disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                        >
                            Apply Custom Range
                        </Button>
                    </form>
                )}
            </div>
        </div>
    )
}

const DashboardDateFilter = (props) => (
    <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-muted" />}>
        <DashboardDateFilterInner {...props} />
    </Suspense>
)

export default DashboardDateFilter
