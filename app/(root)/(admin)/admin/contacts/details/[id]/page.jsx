'use client'
import { use, useEffect, useState } from 'react'
import useFetch from '@/hooks/useFetch'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ADMIN_CONTACTS_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Mail, User, MessageSquare, Calendar, Tag, Phone, MapPin } from 'lucide-react'
import dayjs from 'dayjs'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_CONTACTS_SHOW, label: 'Contact Queries' },
  { href: '', label: 'View Message' },
]

const ContactDetail = ({ params }) => {
  const { id } = use(params)
  const [contact, setContact] = useState(null)
  const { data, loading } = useFetch(`/api/contact/get/${id}`)

  useEffect(() => {
    if (data?.success) {
      setContact(data.data)
    }
  }, [data])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="View Message"
        description="Full details of this contact query."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card">
        {loading && (
          <div className="flex justify-center items-center py-24 text-muted-foreground text-sm">
            Loading…
          </div>
        )}

        {!loading && !contact && (
          <div className="flex justify-center items-center py-24">
            <p className="text-red-500 text-lg font-medium">Message not found.</p>
          </div>
        )}

        {contact && (
          <div className="p-6 max-w-3xl">

            {/* Status + date row */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {contact.ticketId && (
                  <span className="font-mono text-sm font-semibold tracking-wide">
                    {contact.ticketId}
                  </span>
                )}
                {contact.isRead ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Read
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                <span>{dayjs(contact.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg border p-4 flex gap-3">
                <User className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">From</p>
                  <p className="font-medium text-sm">{contact.name}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 flex gap-3">
                <Mail className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-medium text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {contact.email}
                  </a>
                </div>
              </div>

              <div className="rounded-lg border p-4 flex gap-3">
                <Phone className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">Mobile</p>
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="font-medium text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {contact.phone}
                    </a>
                  ) : (
                    <p className="font-medium text-sm text-muted-foreground italic">Not provided</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 flex gap-3">
                <MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">Address</p>
                  <p className="font-medium text-sm">{contact.address || <span className="text-muted-foreground italic">Not provided</span>}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 flex gap-3 sm:col-span-2">
                <Tag className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide">Subject</p>
                  <p className="font-medium text-sm">{contact.subject || <span className="text-muted-foreground italic">No subject</span>}</p>
                </div>
              </div>
            </div>

            {/* Message body */}
            <div className="rounded-lg border p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="size-4 text-muted-foreground" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
            </div>

            {/* Reply CTA */}
            <Button asChild>
              <a href={`mailto:${contact.email}?subject=Re: ${contact.subject || 'Your message'}`}>
                <Mail className="size-4 mr-2" />
                Reply via Email
              </a>
            </Button>

          </div>
        )}
      </div>
    </div>
  )
}

export default ContactDetail
