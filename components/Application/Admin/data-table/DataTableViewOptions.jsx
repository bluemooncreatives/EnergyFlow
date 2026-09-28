'use client'

import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Show / hide columns, listed by their real titles ("Created At", not
// "createdAt"). Keeps at least one data column visible.
const DataTableViewOptions = ({ table }) => {
    const columns = table.getAllColumns().filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
    const visible = columns.filter((column) => column.getIsVisible()).length
    const hidden = columns.length - visible

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 px-3">
                    <Columns3 className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Columns</span>
                    {hidden > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold leading-4 text-primary-foreground">
                            {hidden} hidden
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 min-w-[220px] overflow-y-auto">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="max-w-[260px] truncate"
                        checked={column.getIsVisible()}
                        disabled={column.getIsVisible() && visible <= 1}
                        onSelect={(event) => event.preventDefault()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                        {column.columnDef.meta?.title || column.id}
                    </DropdownMenuCheckboxItem>
                ))}
                {hidden > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => table.resetColumnVisibility()}>Show all columns</DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default DataTableViewOptions
