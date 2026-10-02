'use client'
import { use, useEffect, useState } from 'react'
import useFetch from '@/hooks/useFetch'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ADMIN_CONTACTS_SHOW, ADMIN_DASHBOARD } from '@/routes/AdminPanelRoute'
import { Mail, User, MessageSquare, Calendar, Tag, Phone, MapPin, MailX, CircleAlert } from 'lucide-react'
import AdminEmptyState, { AdminLoadingState } from '@/components/Application/Admin/AdminEmptyState'
import dayjs from 'dayjs'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_CONTACTS_SHOW, label: 'Contact Queries' },
  { href: '', label: 'View Message' },
]

const ContactDetail = ({ params }) => {
  const { id } = use(params)
  const [contact, setContact] = useState(null)
  const { data, loading, error, errorStatus, refetch } = useFetch(`/api/contact/get/${id}`)

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
        {!contact && (loading || !error) && <AdminLoadingState label="Loading message…" className="py-24" />}

        {!loading && !contact && error && (
          <AdminEmptyState
            icon={errorStatus && errorStatus !== 404 && errorStatus !== 400 ? CircleAlert : MailX}
            tone="danger"
            title={errorStatus && errorStatus !== 404 && errorStatus !== 400 ? 'Couldn’t load this message' : 'Message not found'}
            description={
              errorStatus && errorStatus !== 404 && errorStatus !== 400
                ? error
                : 'This contact query may have been deleted. Check the link or open another message from the list.'
            }
            onRetry={errorStatus && errorStatus !== 404 && errorStatus !== 400 ? refetch : undefined}
            action={{ href: ADMIN_CONTACTS_SHOW, label: 'Back to messages' }}
            className="py-24"
          />
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
                  <Badge className="bg-success/15 text-success hover:bg-success/15 dark:bg-success/20 dark:text-success">
                    Read
                  </Badge>
                ) : (
                  <Badge className="ef-tone--pine border">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
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
                    className="font-medium text-sm text-[var(--brand-primary)] hover:underline"
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
                      className="font-medium text-sm text-[var(--brand-primary)] hover:underline"
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
