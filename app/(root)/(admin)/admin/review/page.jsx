'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import { DT_REVIEW_COLUMN, } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_DASHBOARD, ADMIN_TRASH } from "@/routes/AdminPanelRoute"

import { useCallback, useMemo } from "react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: '', label: 'Review' },
]
const ShowReview = () => {

    const columns = useMemo(() => {
        return columnConfig(DT_REVIEW_COLUMN)
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        let actionMenu = []

        actionMenu.push(<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />)
        return actionMenu
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Reviews"
                description="Monitor customer sentiment and product feedback."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card">
                <DatatableWrapper
                    queryKey="review-data"
                    fetchUrl="/api/review"
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint="/api/review/export"
                    deleteEndpoint="/api/review/delete"
                    deleteType="SD"
                    trashView={`${ADMIN_TRASH}?trashof=review`}
                    createAction={action}
                />
            </div>
        </div>
    )
}

export default ShowReview
