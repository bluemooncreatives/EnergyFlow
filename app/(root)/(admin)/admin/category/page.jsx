'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import EditAction from "@/components/Application/Admin/EditAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import { Button } from "@/components/ui/button"
import { DT_CATEGORY_COLUMN } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_CATEGORY_ADD, ADMIN_CATEGORY_EDIT, ADMIN_CATEGORY_SHOW, ADMIN_DASHBOARD, ADMIN_TRASH } from "@/routes/AdminPanelRoute"
import Link from "next/link"
import Image from 'next/image'
import { useCallback, useMemo } from "react"
import { Plus } from 'lucide-react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_CATEGORY_SHOW, label: 'Category' },
]
const ShowCategory = () => {

    const columns = useMemo(() => {
        return columnConfig([
            {
                accessorKey: 'cover', header: 'Cover', enableSorting: false, enableColumnFilter: false,
                Cell: ({ row }) => row.original.cover?.src ? (
                    <span className="relative block h-16 w-12 overflow-hidden rounded-md">
                        <Image src={row.original.cover.src} alt={row.original.cover.alt} fill sizes="48px" className="object-cover" style={{ objectPosition: row.original.cover.position }} />
                    </span>
                ) : <span className="text-xs text-muted-foreground">Automatic</span>,
            },
            ...DT_CATEGORY_COLUMN,
        ])
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        let actionMenu = []
        actionMenu.push(<EditAction key="edit" href={ADMIN_CATEGORY_EDIT(row.original._id)} />)
        actionMenu.push(<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />)
        return actionMenu
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Show Category"
                description="Manage categories and their storefront cover images. Edit a category to upload or choose a cover."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
                actions={
                    <Button asChild size="lg" className="h-9">
                        <Link href={ADMIN_CATEGORY_ADD} className="inline-flex items-center gap-2">
                            <Plus className="size-4" />
                            New Category
                        </Link>
                    </Button>
                }
            />

            <div>
                <DatatableWrapper
                    queryKey="category-data"
                    fetchUrl="/api/category"
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint="/api/category/export"
                    deleteEndpoint="/api/category/delete"
                    deleteType="SD"
                    trashView={`${ADMIN_TRASH}?trashof=category`}
                    createAction={action}
                />
            </div>
        </div>
    )
}

export default ShowCategory
