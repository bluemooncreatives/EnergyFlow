'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import {   DT_CUSTOMERS_COLUMN, } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_DASHBOARD, ADMIN_TRASH } from "@/routes/AdminPanelRoute"

import { useCallback, useMemo } from "react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: '', label: 'Customers' },
]
const ShowCustomers = () => {

    const columns = useMemo(() => {
        return columnConfig(DT_CUSTOMERS_COLUMN)
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        let actionMenu = []

        actionMenu.push(<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />)
        return actionMenu
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Customers"
                description="Review and manage your customer accounts."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card">
                <DatatableWrapper
                    queryKey="customers-data"
                    fetchUrl="/api/customers"
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint="/api/customers/export"
                    deleteEndpoint="/api/customers/delete"
                    deleteType="SD"
                    trashView={`${ADMIN_TRASH}?trashof=customers`}
                    createAction={action}
                />
            </div>
        </div>
    )
}

export default ShowCustomers
