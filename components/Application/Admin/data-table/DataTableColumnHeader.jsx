'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// Click to sort: ascending → descending → off. The arrow shows the state and
// the <th> carries aria-sort (set by the table) for screen readers.
const DataTableColumnHeader = ({ column, title, className }) => {
    if (!column.getCanSort()) {
        return <span className={cn('whitespace-nowrap', className)}>{title}</span>
    }

    const sorted = column.getIsSorted()
    const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown
    const next = sorted === 'asc' ? 'descending' : sorted === 'desc' ? 'unsorted' : 'ascending'

    return (
        <button
            type="button"
            onClick={() => {
                if (sorted === 'asc') column.toggleSorting(true)
                else if (sorted === 'desc') column.clearSorting()
                else column.toggleSorting(false)
            }}
            className={cn(
                '-mx-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 uppercase tracking-[0.06em] transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                sorted && 'text-foreground',
                className
            )}
            title={`Sort ${next}`}
        >
            {title}
            <Icon className={cn('size-3.5', sorted ? 'opacity-100' : 'opacity-40')} aria-hidden="true" />
        </button>
    )
}

export default DataTableColumnHeader
