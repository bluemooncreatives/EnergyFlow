import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Recycle, Trash2, RotateCcw, Trash, Download, MoreHorizontal } from 'lucide-react'
import useDeleteMutation from '@/hooks/useDeleteMutation'
import ButtonLoading from '../ButtonLoading'
import { showToast } from '@/lib/showToast'
import { download, generateCsv, mkConfig } from 'export-to-csv'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import DataTableToolbar from './data-table/DataTableToolbar'
import DataTablePagination from './data-table/DataTablePagination'
import DataTableColumnHeader from './data-table/DataTableColumnHeader'

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
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: initialPageSize,
    })
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState({})
    const [exportLoading, setExportLoading] = useState(false)

    const deleteMutation = useDeleteMutation(queryKey, deleteEndpoint)

    const hasSelection = Object.keys(rowSelection).length > 0
    const handleGlobalFilterChange = (value) => {
        setGlobalFilter((prev) => {
            const nextValue = typeof value === 'function' ? value(prev) : value
            if (nextValue !== prev) {
                setPagination((prevPagination) => ({ ...prevPagination, pageIndex: 0 }))
            }
            return nextValue
        })
    }

    const handleDelete = (ids, selectedDeleteType) => {
        let confirmed = false
        if (selectedDeleteType === 'PD') {
            confirmed = confirm('Are you sure you want to delete the data permanently?')
        } else {
            confirmed = confirm('Are you sure you want to move data into trash?')
        }

        if (confirmed) {
            deleteMutation.mutate({ ids, deleteType: selectedDeleteType })
            setRowSelection({})
        }
    }

    const handleExport = async (selectedRows) => {
        setExportLoading(true)
        try {
            const csvConfig = mkConfig({
                fieldSeparator: ',',
                decimalSeparator: '.',
                useKeysAsHeaders: true,
                filename: 'csv-data',
            })

            let csv

            if (hasSelection) {
                const rowData = selectedRows.map((row) => row.original)
                csv = generateCsv(csvConfig)(rowData)
            } else {
                const { data: response } = await axios.get(exportEndpoint)
                if (!response.success) {
                    throw new Error(response.message)
                }

                csv = generateCsv(csvConfig)(response.data)
            }

            download(csvConfig)(csv)
        } catch (error) {
            showToast('error', error.message)
        } finally {
            setExportLoading(false)
        }
    }

    const {
        data: { data = [], meta } = {},
        isError,
        isRefetching,
        isLoading,
    } = useQuery({
        queryKey: [queryKey, { columnFilters, globalFilter, pagination, sorting }],
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

    const mappedColumns = useMemo(() => {
        const selectionColumn = {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
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
        }

        const dataColumns = (columnsConfig || []).map((col) => ({
            accessorKey: col.accessorKey,
            id: col.id || col.accessorKey,
            header: ({ column }) => {
                const title = typeof col.header === 'string' ? col.header : col.accessorKey
                return (
                    <DataTableColumnHeader column={column} title={title} />
                )
            },
            cell: ({ row, getValue }) => {
                if (typeof col.Cell === 'function') {
                    return col.Cell({ renderedCellValue: getValue(), row: { original: row.original } })
                }
                const value = getValue()
                return value ?? '-'
            },
        }))

        const actionsColumn = {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const actionItems = createAction
                    ? createAction({ original: row.original }, deleteType, handleDelete)
                    : []

                return (
                    <div className="flex justify-end">
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="cursor-pointer">
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
        }

        return [selectionColumn, ...dataColumns, actionsColumn]
    }, [columnsConfig, createAction, deleteType])

    const table = useReactTable({
        data,
        columns: mappedColumns,
        state: {
            sorting,
            pagination,
            rowSelection,
            globalFilter,
            columnFilters,
            columnVisibility,
        },
        rowCount: meta?.totalRowCount ?? 0,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        enableRowSelection: true,
        getRowId: (originalRow) => originalRow._id,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: handleGlobalFilterChange,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <DataTableToolbar
                        table={table}
                        searchPlaceholder="Search in table..."
                        className="flex-1"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                        {deleteType !== 'PD' && (
                            <Button asChild variant="outline" size="lg" className="h-9">
                                <Link href={trashView}>
                                    <Recycle className="mr-2 size-4" />
                                    Recycle Bin
                                </Link>
                            </Button>
                        )}

                        {deleteType === 'SD' && (
                            <Button
                                variant="destructive"
                                size="lg"
                                className="h-9"
                                disabled={!hasSelection}
                                onClick={() => handleDelete(Object.keys(rowSelection), deleteType)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </Button>
                        )}

                        {deleteType === 'PD' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-9"
                                    disabled={!hasSelection}
                                    onClick={() => handleDelete(Object.keys(rowSelection), 'RSD')}
                                >
                                    <RotateCcw className="mr-2 size-4" />
                                    Restore
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="lg"
                                    className="h-9"
                                    disabled={!hasSelection}
                                    onClick={() => handleDelete(Object.keys(rowSelection), deleteType)}
                                >
                                    <Trash className="mr-2 size-4" />
                                    Delete Forever
                                </Button>
                            </>
                        )}

                        <ButtonLoading
                            type="button"
                            text={
                                <>
                                    <Download className="mr-2 size-4" /> Export
                                </>
                            }
                            loading={exportLoading}
                            onClick={() => handleExport(table.getSelectedRowModel().rows)}
                            className="h-9 cursor-pointer"
                            size="lg"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-md bg-card border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="group/row">
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={mappedColumns.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="group/row">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={mappedColumns.length} className="h-24 text-center">
                                    {isError ? 'Error loading data.' : 'No records found.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex flex-col gap-3">
                <div className="px-2 text-sm text-muted-foreground">
                    {isRefetching ? 'Refreshing...' : `${meta?.totalRowCount ?? 0} total rows`}
                </div>
                <DataTablePagination table={table} />
            </div>
        </div>
    )
}

export default Datatable
