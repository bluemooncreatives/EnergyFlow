'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import ViewAction from "@/components/Application/Admin/ViewAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import { DT_ORDER_COLUMN, } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_DASHBOARD, ADMIN_ORDER_DETAILS, ADMIN_TRASH } from "@/routes/AdminPanelRoute"
import { useCallback, useMemo } from "react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: "", label: 'Orders' },
]
const ShowOrder = () => {

    const columns = useMemo(() => {
        return columnConfig(DT_ORDER_COLUMN)
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        let actionMenu = []
        actionMenu.push(<ViewAction key="view" href={ADMIN_ORDER_DETAILS(row.original.order_id)} />)
        actionMenu.push(<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />)
        return actionMenu
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Orders"
                description="Track order status, payments, and fulfillment."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card">
                <DatatableWrapper
                    queryKey="orders-data"
                    fetchUrl="/api/orders"
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint="/api/orders/export"
                    deleteEndpoint="/api/orders/delete"
                    deleteType="SD"
                    trashView={`${ADMIN_TRASH}?trashof=orders`}
                    createAction={action}
                />
            </div>
        </div>
    )
}

export default ShowOrder
