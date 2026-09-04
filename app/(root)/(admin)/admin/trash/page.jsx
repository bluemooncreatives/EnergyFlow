'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import DatatableWrapper from "@/components/Application/Admin/DatatableWrapper"
import DeleteAction from "@/components/Application/Admin/DeleteAction"
import PageHeader from "@/components/Application/Admin/PageHeader"
import { DT_CATEGORY_COLUMN, DT_CONTACT_COLUMN, DT_COUPON_COLUMN, DT_CUSTOMERS_COLUMN, DT_ORDER_COLUMN, DT_PRODUCT_COLUMN, DT_PRODUCT_VARIANT_COLUMN, DT_REVIEW_COLUMN, DT_SIZE_GUIDE_COLUMN } from "@/lib/column"
import { columnConfig } from "@/lib/helperFunction"
import { ADMIN_DASHBOARD, ADMIN_TRASH } from "@/routes/AdminPanelRoute"

import { useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_TRASH, label: 'Trash' },
]

const TRASH_CONFIG = {
    category: {
        title: 'Category Trash',
        columns: DT_CATEGORY_COLUMN,
        fetchUrl: '/api/category',
        exportUrl: '/api/category/export',
        deleteUrl: '/api/category/delete'
    },

    product: {
        title: 'Product Trash',
        columns: DT_PRODUCT_COLUMN,
        fetchUrl: '/api/product',
        exportUrl: '/api/product/export',
        deleteUrl: '/api/product/delete'
    },
    "product-variant": {
        title: 'Product Variant Trash',
        columns: DT_PRODUCT_VARIANT_COLUMN,
        fetchUrl: '/api/product-variant',
        exportUrl: '/api/product-variant/export',
        deleteUrl: '/api/product-variant/delete'
    },
    coupon: {
        title: 'Coupon Trash',
        columns: DT_COUPON_COLUMN,
        fetchUrl: '/api/coupon',
        exportUrl: '/api/coupon/export',
        deleteUrl: '/api/coupon/delete'
    },
    customers: {
        title: 'Customers Trash',
        columns: DT_CUSTOMERS_COLUMN,
        fetchUrl: '/api/customers',
        exportUrl: '/api/customers/export',
        deleteUrl: '/api/customers/delete'
    },
    review: {
        title: 'Review Trash',
        columns: DT_REVIEW_COLUMN,
        fetchUrl: '/api/review',
        exportUrl: '/api/review/export',
        deleteUrl: '/api/review/delete'
    },
    orders: {
        title: 'Orders Trash',
        columns: DT_ORDER_COLUMN,
        fetchUrl: '/api/orders',
        exportUrl: '/api/orders/export',
        deleteUrl: '/api/orders/delete'
    },

    'size-guide': {
        title: 'Size Guide Trash',
        columns: DT_SIZE_GUIDE_COLUMN,
        fetchUrl: '/api/size-guide',
        exportUrl: '/api/size-guide/export',
        deleteUrl: '/api/size-guide/delete'
    },

    contacts: {
        title: 'Contact Queries Trash',
        columns: DT_CONTACT_COLUMN,
        fetchUrl: '/api/contact',
        exportUrl: '/api/contact/export',
        deleteUrl: '/api/contact/delete'
    },

}

import { Suspense } from "react"

const TrashContent = () => {

    const searchParams = useSearchParams()
    const trashOf = searchParams.get('trashof')

    const config = TRASH_CONFIG[trashOf]

    if (!config) {
        return (
            <div className="flex flex-col gap-4 sm:gap-6">
                <PageHeader
                    title="Trash"
                    description="Select a section to review deleted items."
                    breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
                />
                <div className="rounded-md bg-card px-4 py-6 text-sm text-muted-foreground">
                    Choose a valid trash section from an entity table.
                </div>
            </div>
        )
    }

    const columns = useMemo(() => {
        return columnConfig(config.columns, false, false, true)
    }, [])

    const action = useCallback((row, deleteType, handleDelete) => {
        return [<DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />]
    }, [])

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title={config.title}
                description="Restore items or delete them permanently."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card">
                <DatatableWrapper
                    queryKey={`${trashOf}-data-deleted`}
                    fetchUrl={config.fetchUrl}
                    initialPageSize={10}
                    columnsConfig={columns}
                    exportEndpoint={config.exportUrl}
                    deleteEndpoint={config.deleteUrl}
                    deleteType="PD"
                    createAction={action}
                />
            </div>
        </div>
    )
}

const Trash = () => {
    return (
        <Suspense fallback={null}>
            <TrashContent />
        </Suspense>
    )
}

export default Trash
