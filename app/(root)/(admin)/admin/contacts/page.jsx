'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import DeleteAction from '@/components/Application/Admin/DeleteAction'
import ViewAction from '@/components/Application/Admin/ViewAction'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { DT_CONTACT_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import {
  ADMIN_CONTACTS_SHOW,
  ADMIN_CONTACT_DETAILS,
  ADMIN_DASHBOARD,
  ADMIN_TRASH,
} from '@/routes/AdminPanelRoute'
import { useCallback, useMemo } from 'react'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: '', label: 'Contact Queries' },
]

const ContactsPage = () => {
  const columns = useMemo(() => columnConfig(DT_CONTACT_COLUMN, true), [])

  const action = useCallback((row, deleteType, handleDelete) => {
    return [
      <ViewAction key="view" href={ADMIN_CONTACT_DETAILS(row.original._id)} />,
      <DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />,
    ]
  }, [])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Contact Queries"
        description="All messages submitted through the contact form."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card">
        <DatatableWrapper
          queryKey="contacts-data"
          fetchUrl="/api/contact"
          initialPageSize={10}
          columnsConfig={columns}
          exportEndpoint="/api/contact/export"
          deleteEndpoint="/api/contact/delete"
          deleteType="SD"
          trashView={`${ADMIN_TRASH}?trashof=contacts`}
          createAction={action}
        />
      </div>
    </div>
  )
}

export default ContactsPage
