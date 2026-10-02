'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import DeleteAction from '@/components/Application/Admin/DeleteAction'
import ViewAction from '@/components/Application/Admin/ViewAction'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { DT_GIFT_ENQUIRY_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import { ADMIN_DASHBOARD, ADMIN_GIFT_ENQUIRY_DETAILS, ADMIN_TRASH } from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: '', label: 'Corporate Enquiries' },
]

const GiftEnquiriesPage = () => {
  const columns = useMemo(() => columnConfig(DT_GIFT_ENQUIRY_COLUMN, true), [])

  const action = useCallback((row, deleteType, handleDelete) => {
    return [
      <ViewAction key="view" href={ADMIN_GIFT_ENQUIRY_DETAILS(row.original._id)} />,
      <DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />,
    ]
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Corporate Enquiries"
        description="Bulk and corporate gifting requests from the gift boxes page. Unread enquiries are marked with a yellow dot."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div>
        <DatatableWrapper
          queryKey="gift-enquiries-data"
          fetchUrl="/api/gift-enquiry"
          initialPageSize={10}
          columnsConfig={columns}
          exportEndpoint="/api/gift-enquiry/export"
          deleteEndpoint="/api/gift-enquiry/delete"
          deleteType="SD"
          trashView={`${ADMIN_TRASH}?trashof=gift-enquiries`}
          createAction={action}
        />
      </div>
    </div>
  )
}

export default GiftEnquiriesPage
