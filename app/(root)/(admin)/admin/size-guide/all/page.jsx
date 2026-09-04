'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import EditAction from "@/components/Application/Admin/EditAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import { Button } from "@/components/ui/button"
import { DT_SIZE_GUIDE_COLUMN } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_DASHBOARD, ADMIN_SIZE_GUIDE_ADD, ADMIN_SIZE_GUIDE_EDIT, ADMIN_SIZE_GUIDE_SHOW, ADMIN_TRASH } from "@/routes/AdminPanelRoute"
import Link from "next/link"
import { useCallback, useMemo } from "react"
import { Plus } from "lucide-react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SIZE_GUIDE_SHOW, label: 'Size Guides' },
]

const SizeGuideListPage = () => {
    const columns = useMemo(() => {
        return columnConfig(DT_SIZE_GUIDE_COLUMN)
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        return [
            <EditAction key="edit" href={ADMIN_SIZE_GUIDE_EDIT(row.original._id)} />,
            <DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />,
        ]
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Size Guides"
                description="Manage reusable size charts for your catalog."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
                actions={
                    <Button asChild size="lg" className="h-9">
                        <Link href={ADMIN_SIZE_GUIDE_ADD} className="inline-flex items-center gap-2">
                            <Plus className="size-4" />
                            New Size Guide
                        </Link>
                    </Button>
                }
            />

            <div className="rounded-md bg-card">
                <DatatableWrapper
                    queryKey="size-guide-data"
                    fetchUrl="/api/size-guide"
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint="/api/size-guide/export"
                    deleteEndpoint="/api/size-guide/delete"
                    deleteType="SD"
                    trashView={`${ADMIN_TRASH}?trashof=size-guide`}
                    createAction={action}
                />
            </div>
        </div>
    )
}

export default SizeGuideListPage
