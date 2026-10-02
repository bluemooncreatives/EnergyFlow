'use client'
import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import dayjs from 'dayjs'
import { useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Calendar,
  CalendarClock,
  Gift,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Phone,
  Sparkles,
  User,
} from 'lucide-react'
import useFetch from '@/hooks/useFetch'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import PageHeader from '@/components/Application/Admin/PageHeader'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pill } from '@/lib/column'
import { BUDGETS, ENQUIRY_STATUSES, OCCASIONS, labelFor } from '@/lib/giftEnquiry'
import { showToast } from '@/lib/showToast'
import { productPath } from '@/lib/productRoute'
import { ADMIN_DASHBOARD, ADMIN_GIFT_ENQUIRIES_SHOW } from '@/routes/AdminPanelRoute'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_GIFT_ENQUIRIES_SHOW, label: 'Corporate Enquiries' },
  { href: '', label: 'View Enquiry' },
]

// wa.me needs the number with its country code and no symbols; a bare
// 10-digit number is an Indian mobile.
const whatsappHref = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`
}

const Field = ({ icon: Icon, label, children, wide = false }) => (
  <div className={`flex gap-3 rounded-lg border p-4 ${wide ? 'sm:col-span-2' : ''}`}>
    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    <div className="min-w-0">
      <p className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="break-words text-sm font-medium">{children}</div>
    </div>
  </div>
)

const NotProvided = ({ children = 'Not provided' }) => (
  <span className="font-normal italic text-muted-foreground">{children}</span>
)

const GiftEnquiryDetail = ({ params }) => {
  const { id } = use(params)
  const queryClient = useQueryClient()
  const { data, loading, error } = useFetch(`/api/gift-enquiry/get/${id}`)
  const [enquiry, setEnquiry] = useState(null)
  const [status, setStatus] = useState('new')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data?.success) return
    setEnquiry(data.data)
    setStatus(data.data.status || 'new')
    setNotes(data.data.adminNotes || '')
    // Opening it marked the enquiry read — refresh the sidebar count and list.
    queryClient.invalidateQueries({ queryKey: ['gift-enquiry-stats'] })
    queryClient.invalidateQueries({ queryKey: ['gift-enquiries-data'] })
  }, [data, queryClient])

  const dirty = Boolean(enquiry) && (status !== (enquiry.status || 'new') || notes.trim() !== (enquiry.adminNotes || ''))

  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    try {
      const { data: res } = await axios.put('/api/gift-enquiry/update', { _id: id, status, adminNotes: notes })
      if (!res.success) throw new Error(res.message)
      setEnquiry(res.data)
      setNotes(res.data.adminNotes || '')
      queryClient.invalidateQueries({ queryKey: ['gift-enquiries-data'] })
      showToast('success', res.message)
    } catch (err) {
      showToast('error', err?.response?.data?.message || err.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  const currentStatus = ENQUIRY_STATUSES.find((s) => s.value === (enquiry?.status || 'new'))
  const wa = whatsappHref(enquiry?.phone)
  const replySubject = enquiry ? `Your gifting enquiry ${enquiry.ticketId || ''}`.trim() : ''

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="View Enquiry"
        description="Full brief for this corporate / bulk gifting request."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
      />

      <div className="rounded-md bg-card">
        {loading && !enquiry && (
          <div className="flex items-center justify-center py-24 text-sm text-muted-foreground">Loading…</div>
        )}

        {!loading && !enquiry && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <p className="text-lg font-medium text-destructive">{error || 'Enquiry not found.'}</p>
            <Button asChild variant="outline">
              <Link href={ADMIN_GIFT_ENQUIRIES_SHOW}>Back to enquiries</Link>
            </Button>
          </div>
        )}

        {enquiry && (
          <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {/* Reference + status + received */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  {enquiry.ticketId && (
                    <span className="font-mono text-sm font-semibold tracking-wide">{enquiry.ticketId}</span>
                  )}
                  {currentStatus && <Pill tone={currentStatus.tone}>{currentStatus.label}</Pill>}
                  {enquiry.deletedAt && <Pill tone="danger">In trash</Pill>}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-3.5" aria-hidden="true" />
                  <span>Received {dayjs(enquiry.createdAt).format('DD MMM YYYY, hh:mm A')}</span>
                </div>
              </div>

              {/* The ask, at a glance */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Boxes', value: Number(enquiry.quantity || 0).toLocaleString('en-IN') },
                  { label: 'Occasion', value: labelFor(OCCASIONS, enquiry.occasion) },
                  { label: 'Budget / box', value: labelFor(BUDGETS, enquiry.budget) || '—' },
                  { label: 'Needed by', value: enquiry.deliveryDate ? dayjs(enquiry.deliveryDate).format('DD MMM YYYY') : 'Flexible' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-secondary/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold leading-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field icon={User} label="Contact">{enquiry.name}</Field>
                <Field icon={Building2} label="Company">{enquiry.company || <NotProvided>Personal / not given</NotProvided>}</Field>
                <Field icon={Mail} label="Email">
                  <a href={`mailto:${enquiry.email}`} className="text-[var(--brand-primary)] hover:underline">{enquiry.email}</a>
                </Field>
                <Field icon={Phone} label="Phone">
                  <a href={`tel:${enquiry.phone}`} className="tabular-nums text-[var(--brand-primary)] hover:underline">{enquiry.phone}</a>
                </Field>
                <Field icon={MapPin} label="City">{enquiry.city || <NotProvided />}</Field>
                <Field icon={Sparkles} label="Custom branding">{enquiry.branding ? 'Yes — logo / personalised packaging' : 'Not needed'}</Field>
                <Field icon={Gift} label="Boxes of interest" wide>
                  {enquiry.products?.length ? (
                    <ul className="flex flex-wrap gap-2 pt-1">
                      {enquiry.products.map((p) => (
                        <li key={p.product || p.name}>
                          {p.slug ? (
                            <Link
                              href={productPath(p.slug)}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:border-[var(--brand-primary)]"
                            >
                              <Package className="size-3" aria-hidden="true" /> {p.name}
                            </Link>
                          ) : (
                            <span className="inline-flex rounded-full border px-3 py-1 text-xs">{p.name}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <NotProvided>No specific box chosen — open to suggestions</NotProvided>
                  )}
                </Field>
                {enquiry.pagePath && (
                  <Field icon={Globe} label="Sent from" wide>
                    <span className="font-mono text-xs">{enquiry.pagePath}</span>
                  </Field>
                )}
              </div>

              <div className="rounded-lg border p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Message</p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {enquiry.message || <NotProvided>No message — see the brief above.</NotProvided>}
                </p>
              </div>
            </div>

            {/* Actions + pipeline */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-lg border p-5">
                <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">Respond</p>
                <div className="flex flex-col gap-2">
                  <Button asChild>
                    <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent(replySubject)}`}>
                      <Mail className="size-4" aria-hidden="true" /> Reply by email
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`tel:${enquiry.phone}`}>
                      <Phone className="size-4" aria-hidden="true" /> Call {enquiry.name.split(' ')[0]}
                    </a>
                  </Button>
                  {wa && (
                    <Button asChild variant="outline">
                      <a href={wa} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-5">
                <p className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">Pipeline</p>
                {enquiry.deletedAt ? (
                  <p className="text-sm text-muted-foreground">Restore this enquiry from the trash to update it.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="enquiry-status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="enquiry-status" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENQUIRY_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="enquiry-notes">Internal notes</Label>
                      <Textarea
                        id="enquiry-notes"
                        rows={6}
                        maxLength={4000}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Quote sent, follow-up date, preferred boxes… (only visible to admins)"
                      />
                      <p className="text-right text-xs text-muted-foreground tabular-nums">{notes.length}/4000</p>
                    </div>
                    <ButtonLoading
                      type="button"
                      loading={saving}
                      disabled={!dirty || saving}
                      onClick={save}
                      text={dirty ? 'Save changes' : 'Saved'}
                      className="w-full cursor-pointer"
                    />
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="size-3" aria-hidden="true" />
                      Last updated {dayjs(enquiry.updatedAt).format('DD MMM YYYY, hh:mm A')}
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default GiftEnquiryDetail
