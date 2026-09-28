'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import useFetch from '@/hooks/useFetch';
import { ADMIN_CATEGORY_SHOW, ADMIN_CUSTOMERS_SHOW, ADMIN_PRODUCT_SHOW, ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute';
import { FolderTree, Shirt, UsersRound, ShoppingBag, CircleCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CountOverview = () => {
    const searchParams = useSearchParams()
    const range = searchParams.get('range')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const date = searchParams.get('date')

    const queryString = useMemo(() => {
        const q = new URLSearchParams()
        if (range) q.set('range', range)
        if (from) q.set('from', from)
        if (to) q.set('to', to)
        if (year) q.set('year', year)
        if (month) q.set('month', month)
        if (date) q.set('date', date)
        const s = q.toString()
        return s ? `?${s}` : ''
    }, [range, from, to, year, month, date])

    const { data: countData, loading, error, refetch } = useFetch(`/api/dashboard/admin/count${queryString}`)

    const hasPeriodFilter = Boolean(range && range !== 'all' || year || month || date || (from && to))

    const cards = [
        {
            title: 'Total Categories',
            value: countData?.data?.category || 0,
            sub: 'Active store categories',
            href: ADMIN_CATEGORY_SHOW,
            icon: FolderTree,
            chartVar: '--chart-1'
        },
        {
            title: 'Total Products',
            value: countData?.data?.product || 0,
            sub: 'Published catalogue',
            href: ADMIN_PRODUCT_SHOW,
            icon: Shirt,
            chartVar: '--chart-2'
        },
        {
            title: hasPeriodFilter ? 'Customers (Period)' : 'Total Customers',
            value: hasPeriodFilter ? (countData?.data?.customerInPeriod ?? countData?.data?.customer ?? 0) : (countData?.data?.customer || 0),
            sub: hasPeriodFilter ? `All-time: ${countData?.data?.customer || 0} accounts` : 'Registered store buyers',
            href: ADMIN_CUSTOMERS_SHOW,
            icon: UsersRound,
            chartVar: '--chart-3'
        },
        {
            title: hasPeriodFilter ? 'Orders (Period)' : 'Total Orders',
            value: hasPeriodFilter ? (countData?.data?.orderInPeriod ?? countData?.data?.order ?? 0) : (countData?.data?.order || 0),
            sub: hasPeriodFilter ? `All-time: ${countData?.data?.order || 0} orders` : 'All-time placed orders',
            href: ADMIN_ORDER_SHOW,
            icon: ShoppingBag,
            chartVar: '--chart-4'
        },
    ]

    if (error) return <div role="alert" className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"><p className="text-sm">Could not load store totals.</p><button type="button" onClick={refetch} className="mt-2 text-sm font-medium underline">Try again</button></div>

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Link key={card.title} href={card.href} aria-label={`${card.title}: ${card.value}`}>
                    <Card
                        className="rounded-xl border-l-4 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                        style={{ borderLeftColor: `var(${card.chartVar})` }}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{card.title}</p>
                            <span
                                className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: `var(${card.chartVar})`,
                                    color: card.chartVar === '--chart-2' ? '#0A2F24' : 'var(--background)'
                                }}
                                aria-hidden
                            >
                                <card.icon className="size-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-2xl sm:text-3xl font-bold leading-none tracking-tight tabular-nums">
                            {loading || !countData ? (
                                <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted align-middle" aria-label="Loading" />
                            ) : (
                                Number(card.value).toLocaleString('en-IN')
                            )}
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CircleCheck className="size-3 shrink-0 text-primary" />
                            <span>{card.sub}</span>
                        </p>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

export default CountOverview
