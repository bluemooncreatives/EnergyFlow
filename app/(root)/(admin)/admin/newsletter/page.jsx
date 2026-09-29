'use client'

import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MailCheck, MailMinus, MailX, Palette, TrendingDown, TrendingUp, UserPlus } from 'lucide-react'

import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import DatatableWrapper from '@/components/Application/Admin/DatatableWrapper'
import DeleteAction from '@/components/Application/Admin/DeleteAction'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { DT_NEWSLETTER_COLUMN } from '@/lib/column'
import { columnConfig } from '@/lib/helperFunction'
import { showToast } from '@/lib/showToast'
import {
  ADMIN_DASHBOARD,
  ADMIN_NEWSLETTER_SETTINGS,
  ADMIN_NEWSLETTER_SHOW,
  ADMIN_TRASH,
} from '@/routes/AdminPanelRoute'

const QUERY_KEY = 'newsletter-data'

const breadcrumbData = [
  { href: ADMIN_DASHBOARD, label: 'Home' },
  { href: ADMIN_NEWSLETTER_SHOW, label: 'Newsletter' },
]

// Row action: manually unsubscribe / re-subscribe (e.g. a customer asked by email).
const StatusAction = ({ row }) => {
  const queryClient = useQueryClient()
  const subscribed = row.original.status === 'subscribed'

  const toggle = async () => {
    try {
      const { data } = await axios.put('/api/newsletter/status', {
        _id: row.original._id,
        status: subscribed ? 'unsubscribed' : 'subscribed',
      })
      if (!data.success) throw new Error(data.message)
      showToast('success', data.message)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    } catch (error) {
      showToast('error', error.message)
    }
  }

  return (
    <DropdownMenuItem onClick={toggle} className="cursor-pointer">
      {subscribed ? <MailMinus className="size-4" /> : <MailCheck className="size-4" />}
      {subscribed ? 'Unsubscribe' : 'Re-subscribe'}
    </DropdownMenuItem>
  )
}

const StatCard = ({ title, value, hint, icon: Icon, chartVar, trend, compact = false }) => (
  <Card className="border-l-4" style={{ borderLeftColor: `var(${chartVar})` }}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      <span
        className="inline-flex size-9 items-center justify-center rounded-full"
        style={{ backgroundColor: `var(${chartVar})`, color: chartVar === '--chart-2' ? '#0A2F24' : 'var(--background)' }}
        aria-hidden
      >
        <Icon className="size-4" />
      </span>
    </CardHeader>
    <CardContent>
      <div className={compact ? 'py-1 text-2xl font-bold' : 'text-4xl font-bold tabular-nums'}>{value}</div>
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {trend === 'up' && (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <TrendingUp className="size-3" />
          </span>
        )}
        {trend === 'down' && (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TrendingDown className="size-3" />
          </span>
        )}
        {hint}
      </p>
    </CardContent>
  </Card>
)

const SOURCE_LABEL = { popup: 'Popup', section: 'Homepage band', footer: 'Footer' }

const NewsletterSubscribersPage = () => {
  const columns = useMemo(() => columnConfig(DT_NEWSLETTER_COLUMN, true), [])

  const { data: stats } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/newsletter/stats')
      if (!data.success) throw new Error(data.message)
      return data.data
    },
  })

  const action = useCallback((row, deleteType, handleDelete) => [
    <StatusAction key="status" row={row} />,
    <DeleteAction key="delete" handleDelete={handleDelete} row={row} deleteType={deleteType} />,
  ], [])

  const growth = stats ? stats.newLast30 - stats.newPrev30 : 0
  const topSource = stats
    ? Object.entries(stats.sources).sort((a, b) => b[1] - a[1]).find(([, count]) => count > 0)
    : null

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        title="Newsletter"
        description="Everyone who joined from the popup, the homepage band or the footer."
        breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
        actions={
          <Button asChild>
            <Link href={ADMIN_NEWSLETTER_SETTINGS}>
              <Palette className="size-4" /> Customise popup & forms
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active subscribers"
          value={stats?.active ?? '—'}
          hint="Currently receiving emails"
          icon={MailCheck}
          chartVar="--chart-1"
        />
        <StatCard
          title="New in last 30 days"
          value={stats?.newLast30 ?? '—'}
          hint={stats ? `${growth >= 0 ? '+' : ''}${growth} vs the 30 days before` : 'Loading…'}
          icon={UserPlus}
          chartVar="--chart-2"
          trend={stats ? (growth >= 0 ? 'up' : 'down') : undefined}
        />
        <StatCard
          title="Unsubscribed"
          value={stats?.unsubscribed ?? '—'}
          hint="Kept for your records"
          icon={MailX}
          chartVar="--chart-4"
        />
        <StatCard
          title="Top source"
          value={topSource ? SOURCE_LABEL[topSource[0]] : '—'}
          hint={
            stats
              ? `Popup ${stats.sources.popup} · Band ${stats.sources.section} · Footer ${stats.sources.footer}`
              : 'Loading…'
          }
          icon={Palette}
          chartVar="--chart-3"
          compact
        />
      </div>

      <div>
        <DatatableWrapper
          queryKey={QUERY_KEY}
          fetchUrl="/api/newsletter"
          initialPageSize={10}
          columnsConfig={columns}
          exportEndpoint="/api/newsletter/export"
          deleteEndpoint="/api/newsletter/delete"
          deleteType="SD"
          trashView={`${ADMIN_TRASH}?trashof=newsletter`}
          createAction={action}
        />
      </div>
    </div>
  )
}

export default NewsletterSubscribersPage
