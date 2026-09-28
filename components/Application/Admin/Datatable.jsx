import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, Download, Inbox, Loader2, MoreHorizontal, Recycle, RotateCcw, SearchX, Trash, Trash2, X } from 'lucide-react'
import useDeleteMutation from '@/hooks/useDeleteMutation'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import { download, generateCsv, mkConfig } from 'export-to-csv'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DataTableToolbar from './data-table/DataTableToolbar'
import DataTablePagination from './data-table/DataTablePagination'
import DataTableColumnHeader from './data-table/DataTableColumnHeader'
import DataTableViewOptions from './data-table/DataTableViewOptions'
import ConfirmDialog from './data-table/ConfirmDialog'

const SKELETON_ROWS = 6

// CSV cells must be flat: arrays/objects become JSON, dates stay strings.
const flattenForCsv = (rows) =>
    rows.map((row) => Object.fromEntries(
        Object.entries(row || {}).map(([key, value]) => [
            key,
            value === null || value === undefined
                ? ''
                : typeof value === 'object'
                    ? JSON.stringify(value)
                    : value,
        ])
    ))

const DELETE_COPY = {
    SD: (n) => ({
        title: `Move ${n} ${n === 1 ? 'record' : 'records'} to the recycle bin?`,
        description: 'They disappear from this list but can be restored from the recycle bin at any time.',
        confirmLabel: 'Move to bin',
        tone: 'danger',
    }),
    PD: (n) => ({
        title: `Delete ${n} ${n === 1 ? 'record' : 'records'} forever?`,
        description: 'This permanently removes the data. It cannot be undone.',
        confirmLabel: 'Delete forever',
        tone: 'danger',
    }),
    RSD: (n) => ({
        title: `Restore ${n} ${n === 1 ? 'record' : 'records'}?`,
        description: 'They go back to their original list and become active again.',
        confirmLabel: 'Restore',
        tone: 'neutral',
    }),
}

/**
 * Server-driven admin table (search, sort, paging on the API), shared by
 * every admin list.
 *
 *  • Debounced search, click-to-sort headers, column visibility.
 *  • Selecting rows swaps the toolbar for a selection bar: export selected,
 *    move to bin / restore / delete forever, clear.
 *  • Select and Actions columns stay pinned while wide tables scroll.
 *  • Skeleton rows while loading, a thin progress bar while refreshing,
 *    an empty state that can clear the search, and an error state with retry.
 *  • Deletes confirm in an in-app dialog and step back a page when the last
 *    row of a page is removed.
 */
const Datatable = ({
    queryKey,
    fetchUrl,
    columnsConfig,
    initialPageSize = 10,
    exportEndpoint,
    deleteEndpoint,
    deleteType,
    trashView,
    createAction,
}) => {
    const [columnFilters, setColumnFilters] = useState([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [sorting, setSorting] = useState([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: initialPageSize })
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const [exportLoading, setExportLoading] = useState(false)
    const [pendingDelete, setPendingDelete] = useState(null)

    const deleteMutation = useDeleteMutation(queryKey, deleteEndpoint)
    const selectedIds = Object.keys(rowSelection)
    const selectedCount = selectedIds.length

    const handleGlobalFilterChange = (value) => {
        setGlobalFilter((prev) => {
            const nextValue = typeof value === 'function' ? value(prev) : value
            if (nextValue !== prev) {
                setPagination((p) => ({ ...p, pageIndex: 0 }))
                setRowSelection({})
            }
            return nextValue
        })
    }

    // Row menus call this; it opens the confirmation instead of acting.
    const handleDelete = (ids, selectedDeleteType) => {
        if (!ids?.length) return
        setPendingDelete({ ids, type: selectedDeleteType })
    }

    const {
        data: { data = [], meta } = {},
        isError,
        isFetching,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: [queryKey, { columnFilters, globalFilter, pagination, sorting, deleteType }],
        queryFn: async () => {
            const { data: response } = await axios.get(fetchUrl, {
                params: {
                    start: pagination.pageIndex * pagination.pageSize,
                    size: pagination.pageSize,
                    filters: JSON.stringify(columnFilters ?? []),
                    globalFilter: globalFilter ?? '',
                    sorting: JSON.stringify(sorting ?? []),
                    deleteType,
                },
            })
            return response
        },
        placeholderData: keepPreviousData,
    })

    const total = Number(meta?.totalRowCount) || 0
    const rows = Array.isArray(data) ? data : []

    const confirmDelete = async () => {
        if (!pendingDelete) return
        const { ids, type } = pendingDelete
        try {
            await deleteMutation.mutateAsync({ ids, deleteType: type })
            setRowSelection({})
            // Removing every row on the last page would leave an empty page.
            if (ids.length >= rows.length && pagination.pageIndex > 0) {
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
            }
            setPendingDelete(null)
        } catch {
            // The mutation already reported the error; keep the dialog open.
        }
    }

    const handleExport = async (selectedRows) => {
        setExportLoading(true)
        try {
            const stamp = new Date().toISOString().slice(0, 10)
            const csvConfig = mkConfig({
                fieldSeparator: ',',
                decimalSeparator: '.',
                useKeysAsHeaders: true,
                filename: `${String(queryKey).replace(/-data$/, '')}-${selectedCount ? 'selected' : 'all'}-${stamp}`,
            })

            let records
            if (selectedCount) {
                records = selectedRows.map((row) => row.original)
            } else {
                const { data: response } = await axios.get(exportEndpoint)
                if (!response.success) throw new Error(response.message)
                records = response.data
            }

            if (!records?.length) {
                showToast('info', 'There is nothing to export yet.')
                return
            }
            download(csvConfig)(generateCsv(csvConfig)(flattenForCsv(records)))
            showToast('success', `Exported ${records.length} ${records.length === 1 ? 'row' : 'rows'}.`)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setExportLoading(false)
        }
    }

    const mappedColumns = useMemo(() => {
        const selectionColumn = {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all rows on this page"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            meta: { pin: 'left' },
        }

        const dataColumns = (columnsConfig || []).map((col) => {
            const title = typeof col.header === 'string' ? col.header : col.accessorKey
            return {
                accessorKey: col.accessorKey,
                id: col.id || col.accessorKey,
                meta: { title },
                header: ({ column }) => <DataTableColumnHeader column={column} title={title} />,
                cell: ({ row, getValue }) => {
                    if (typeof col.Cell === 'function') {
                        return col.Cell({ renderedCellValue: getValue(), row: { original: row.original } })
                    }
                    const value = getValue()
                    if (value === null || value === undefined || value === '' || value === '-') {
                        return <span className="text-muted-foreground/60">—</span>
                    }
                    const text = String(value)
                    return (
                        <span className="block max-w-[240px] truncate" title={text.length > 30 ? text : undefined}>
                            {text}
                        </span>
                    )
                },
            }
        })

        const actionsColumn = {
            id: 'actions',
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => {
                const actionItems = createAction
                    ? createAction({ original: row.original }, deleteType, handleDelete)
                    : []
                if (!actionItems?.length) return null

                return (
                    <div className="flex justify-end">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="cursor-pointer" aria-label="Row actions">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {actionItems}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
            enableSorting: false,
            enableHiding: false,
            meta: { pin: 'right' },
        }

        return [selectionColumn, ...dataColumns, actionsColumn]
        // handleDelete only sets state, so a stale closure is harmless.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnsConfig, createAction, deleteType])

    const table = useReactTable({
        data: rows,
        columns: mappedColumns,
        state: { sorting, pagination, rowSelection, globalFilter, columnFilters, columnVisibility },
        rowCount: total,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        enableRowSelection: true,
        getRowId: (originalRow) => originalRow._id,
        onSortingChange: (updater) => {
            setSorting(updater)
            setPagination((p) => ({ ...p, pageIndex: 0 }))
        },
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: handleGlobalFilterChange,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
    })

    const visibleColumns = table.getVisibleLeafColumns().length
    const searching = Boolean(globalFilter)
    const pinClass = (pin) =>
        pin === 'left'
            ? 'sticky left-0 z-[1] w-12 pl-4 pr-2'
            : pin === 'right'
                ? 'sticky right-0 z-[1] w-14 pr-3 shadow-[inset_1px_0_0_var(--border)]'
                : ''

    const dialogCopy = pendingDelete ? DELETE_COPY[pendingDelete.type]?.(pendingDelete.ids.length) : null

    return (
        <div className="admin-table overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(11_61_46/0.04)]">
            {/* Toolbar / selection bar */}
            <div className="flex min-h-[3.75rem] flex-col gap-3 border-b px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                {selectedCount > 0 ? (
                    <div className="flex w-full flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground tabular-nums">
                                {selectedCount}
                            </span>
                            <span className="font-medium">selected</span>
                            <button type="button" onClick={() => setRowSelection({})} className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
                                <X className="size-3.5" aria-hidden="true" /> Clear
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" className="h-9 gap-2 px-3" disabled={exportLoading} onClick={() => handleExport(table.getSelectedRowModel().rows)}>
                                {exportLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export selected
                            </Button>
                            {deleteType === 'SD' && (
                                <Button variant="destructive" className="h-9 gap-2 px-3" onClick={() => handleDelete(selectedIds, 'SD')}>
                                    <Trash2 className="size-4" /> Move to bin
                                </Button>
                            )}
                            {deleteType === 'PD' && (
                                <>
                                    <Button variant="outline" className="h-9 gap-2 px-3" onClick={() => handleDelete(selectedIds, 'RSD')}>
                                        <RotateCcw className="size-4" /> Restore
                                    </Button>
                                    <Button variant="destructive" className="h-9 gap-2 px-3" onClick={() => handleDelete(selectedIds, 'PD')}>
                                        <Trash className="size-4" /> Delete forever
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <DataTableToolbar table={table} searchPlaceholder="Search this table…" busy={isFetching} />
                        <div className="flex flex-wrap items-center gap-2">
                            <DataTableViewOptions table={table} />
                            {deleteType !== 'PD' && trashView && (
                                <Button asChild variant="outline" className="h-9 gap-2 px-3">
                                    <Link href={trashView}>
                                        <Recycle className="size-4" aria-hidden="true" />
                                        <span className="hidden sm:inline">Recycle bin</span>
                                        <span className="sr-only sm:hidden">Recycle bin</span>
                                    </Link>
                                </Button>
                            )}
                            {exportEndpoint && (
                                <Button className="h-9 gap-2 px-3" disabled={exportLoading || total === 0} onClick={() => handleExport([])}>
                                    {exportLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                                    Export all
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="relative">
                {isFetching && !isLoading && (
                    <div className="absolute inset-x-0 top-0 z-[2] h-0.5 overflow-hidden bg-primary/10" aria-hidden="true">
                        <div className="admin-table__progress h-full w-1/3 bg-primary" />
                    </div>
                )}
                <div className="admin-table__scroll overflow-x-auto">
                    <table className="w-full caption-bottom border-separate border-spacing-0 text-sm">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        const sorted = header.column.getIsSorted()
                                        return (
                                            <th
                                                key={header.id}
                                                scope="col"
                                                aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                                                className={cn(
                                                    'h-11 border-b bg-muted px-3 text-left align-middle text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground',
                                                    pinClass(header.column.columnDef.meta?.pin)
                                                )}
                                            >
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                            </th>
                                        )
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} aria-hidden="true">
                                        {Array.from({ length: visibleColumns }).map((__, j) => (
                                            <td key={j} className="border-b bg-card px-3 py-3.5">
                                                <span
                                                    className="block h-3.5 animate-pulse rounded bg-muted"
                                                    style={{ width: j === 0 ? 16 : j === visibleColumns - 1 ? 20 : `${50 + ((i * 7 + j * 13) % 45)}%` }}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : isError && rows.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns} className="bg-card px-6 py-14">
                                        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                                            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                                                <AlertTriangle className="size-5" aria-hidden="true" />
                                            </span>
                                            <p className="mt-4 font-semibold">Couldn’t load this table</p>
                                            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
                                            <Button variant="outline" className="mt-5 h-9 gap-2 px-4" onClick={() => refetch()}>
                                                <RotateCcw className="size-4" /> Retry
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} className="group/row">
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={cn(
                                                    'whitespace-nowrap border-b bg-card px-3 py-3 align-middle transition-colors group-last/row:border-b-0 group-hover/row:bg-[color-mix(in_srgb,var(--muted)_65%,var(--card))] group-data-[state=selected]/row:bg-secondary',
                                                    pinClass(cell.column.columnDef.meta?.pin)
                                                )}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={visibleColumns} className="bg-card px-6 py-14">
                                        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                                            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                                                {searching ? <SearchX className="size-5" aria-hidden="true" /> : <Inbox className="size-5" aria-hidden="true" />}
                                            </span>
                                            <p className="mt-4 font-semibold">{searching ? `No matches for “${globalFilter}”` : 'Nothing here yet'}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {searching
                                                    ? 'Try a shorter or different search term.'
                                                    : deleteType === 'PD'
                                                        ? 'The recycle bin is empty.'
                                                        : 'New records will appear here as they come in.'}
                                            </p>
                                            {searching && (
                                                <Button variant="outline" className="mt-5 h-9 px-4" onClick={() => table.setGlobalFilter('')}>
                                                    Clear search
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t bg-card px-3 py-3 sm:px-4">
                <DataTablePagination table={table} total={total} />
            </div>

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
                title={dialogCopy?.title}
                description={dialogCopy?.description}
                confirmLabel={dialogCopy?.confirmLabel}
                tone={dialogCopy?.tone}
                loading={deleteMutation.isPending}
                onConfirm={confirmDelete}
            />
        </div>
    )
}

export default Datatable
