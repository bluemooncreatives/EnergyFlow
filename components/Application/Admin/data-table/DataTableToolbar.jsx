'use client'
import { Cross2Icon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DataTableViewOptions from './DataTableViewOptions'
import { cn } from '@/lib/utils'

const DataTableToolbar = ({
    table,
    searchPlaceholder = 'Filter...',
    searchKey,
    className,
}) => {
    const isFiltered =
        table.getState().columnFilters?.length > 0 || table.getState().globalFilter

    return (
        <div className={cn("flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
            <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                {searchKey ? (
                    <Input
                        placeholder={searchPlaceholder}
                        value={(table.getColumn(searchKey)?.getFilterValue() ?? '')}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="h-9 w-full sm:w-[220px] lg:w-[280px]"
                    />
                ) : (
                    <Input
                        placeholder={searchPlaceholder}
                        value={table.getState().globalFilter ?? ''}
                        onChange={(event) => table.setGlobalFilter(event.target.value)}
                        className="h-9 w-full sm:w-[220px] lg:w-[280px]"
                    />
                )}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={() => {
                            table.resetColumnFilters?.()
                            table.setGlobalFilter?.('')
                        }}
                        className="h-9 px-2 lg:px-3"
                    >
                        Reset
                        <Cross2Icon className="ms-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    )
}

export default DataTableToolbar
