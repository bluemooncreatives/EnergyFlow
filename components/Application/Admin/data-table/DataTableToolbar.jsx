'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEBOUNCE_MS = 350

// Table search. Typing is local and instant; the table (and the server
// query) only updates once typing pauses, so each keystroke is not a
// request. Esc clears. A spinner shows while results refresh.
const DataTableToolbar = ({ table, searchPlaceholder = 'Search…', busy = false, className }) => {
    const applied = table.getState().globalFilter ?? ''
    const [value, setValue] = useState(applied)
    const timer = useRef(null)

    // Follow resets from outside (e.g. "Clear search" in the empty state).
    useEffect(() => { setValue(applied) }, [applied])
    useEffect(() => () => clearTimeout(timer.current), [])

    const update = (next) => {
        setValue(next)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => table.setGlobalFilter(next.trim()), DEBOUNCE_MS)
    }

    const clear = () => {
        clearTimeout(timer.current)
        setValue('')
        table.setGlobalFilter('')
    }

    return (
        <div className={cn('relative w-full sm:max-w-sm', className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
                type="search"
                value={value}
                onChange={(event) => update(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Escape' && value) { event.preventDefault(); clear() } }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
            />
            <span className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
                {busy && value ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin text-muted-foreground" aria-label="Searching" />
                ) : value ? (
                    <button
                        type="button"
                        onClick={clear}
                        aria-label="Clear search"
                        className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-3.5" aria-hidden="true" />
                    </button>
                ) : null}
            </span>
        </div>
    )
}

export default DataTableToolbar
