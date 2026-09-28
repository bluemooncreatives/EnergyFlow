'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn, getPageNumbers } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const PAGE_SIZES = [10, 20, 30, 50, 100]

const NavButton = ({ label, className, ...props }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        className={cn(
            'flex size-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
            className
        )}
        {...props}
    />
)

// Footer: "Showing 11–20 of 57", rows per page, and page navigation. With no
// rows it reads "No results" and the page count is never "1 of 0".
const DataTablePagination = ({ table, total = 0, className }) => {
    const { pageIndex, pageSize } = table.getState().pagination
    const pageCount = Math.max(1, table.getPageCount())
    const currentPage = Math.min(pageIndex + 1, pageCount)
    const pageNumbers = getPageNumbers(currentPage, pageCount)
    const from = total === 0 ? 0 : pageIndex * pageSize + 1
    const to = Math.min(total, (pageIndex + 1) * pageSize)

    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span aria-live="polite">
                    {total === 0 ? 'No results' : <>Showing <b className="font-semibold text-foreground">{from}–{to}</b> of <b className="font-semibold text-foreground">{total.toLocaleString('en-IN')}</b></>}
                </span>
                <label className="flex items-center gap-2">
                    <span className="hidden sm:inline">Rows</span>
                    <Select value={`${pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                        <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {PAGE_SIZES.map((size) => (
                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            </div>

            <nav className="flex items-center gap-1.5" aria-label="Pagination">
                <NavButton label="First page" className="max-sm:hidden" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                    <ChevronsLeft className="size-4" aria-hidden="true" />
                </NavButton>
                <NavButton label="Previous page" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                    <ChevronLeft className="size-4" aria-hidden="true" />
                </NavButton>

                <span className="px-2 text-sm text-muted-foreground sm:hidden">
                    {currentPage} / {pageCount}
                </span>
                <div className="hidden items-center gap-1 sm:flex">
                    {pageNumbers.map((pageNumber, index) => (
                        pageNumber === '...' ? (
                            <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground" aria-hidden="true">…</span>
                        ) : (
                            <button
                                key={pageNumber}
                                type="button"
                                onClick={() => table.setPageIndex(pageNumber - 1)}
                                aria-label={`Page ${pageNumber}`}
                                aria-current={currentPage === pageNumber ? 'page' : undefined}
                                className={cn(
                                    'h-8 min-w-8 rounded-lg px-2 text-sm font-medium tabular-nums transition',
                                    currentPage === pageNumber
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground hover:bg-muted'
                                )}
                            >
                                {pageNumber}
                            </button>
                        )
                    ))}
                </div>

                <NavButton label="Next page" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    <ChevronRight className="size-4" aria-hidden="true" />
                </NavButton>
                <NavButton label="Last page" className="max-sm:hidden" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
                    <ChevronsRight className="size-4" aria-hidden="true" />
                </NavButton>
            </nav>
        </div>
    )
}

export default DataTablePagination
