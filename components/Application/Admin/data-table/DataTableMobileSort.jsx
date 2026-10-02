'use client'

import { ArrowDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NONE = '__none'

// Phones see rows as cards, so the click-to-sort column headers are not on
// screen. This menu offers the same sorts: one entry per direction.
const DataTableMobileSort = ({ table, className }) => {
    const columns = table.getAllLeafColumns().filter((column) => column.getCanSort() && column.getIsVisible())
    if (!columns.length) return null

    const [current] = table.getState().sorting
    const value = current ? `${current.id}:${current.desc ? 'desc' : 'asc'}` : NONE

    const onChange = (next) => {
        if (next === NONE) {
            table.resetSorting()
            return
        }
        const [id, direction] = next.split(':')
        table.setSorting([{ id, desc: direction === 'desc' }])
    }

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`h-10 gap-2 px-3 ${className || ''}`} aria-label="Sort rows">
                    <ArrowDownUp className="size-4" aria-hidden="true" />
                    {current && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 min-w-[220px] overflow-y-auto">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
                    <DropdownMenuRadioItem value={NONE}>Default order</DropdownMenuRadioItem>
                    {columns.map((column) => {
                        const title = column.columnDef.meta?.title || column.id
                        return [
                            <DropdownMenuRadioItem key={`${column.id}-asc`} value={`${column.id}:asc`}>
                                {title} <span className="ms-auto text-xs text-muted-foreground">A → Z</span>
                            </DropdownMenuRadioItem>,
                            <DropdownMenuRadioItem key={`${column.id}-desc`} value={`${column.id}:desc`}>
                                {title} <span className="ms-auto text-xs text-muted-foreground">Z → A</span>
                            </DropdownMenuRadioItem>,
                        ]
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default DataTableMobileSort
