'use client'
import Link from 'next/link'
import useFetch from '@/hooks/useFetch';
import { ADMIN_CATEGORY_SHOW, ADMIN_CUSTOMERS_SHOW, ADMIN_PRODUCT_SHOW, ADMIN_ORDER_SHOW } from '@/routes/AdminPanelRoute';
import { FolderTree, Shirt, UsersRound, ShoppingBag, CircleCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
const CountOverview = () => {

    const { data: countData, loading, error, refetch } = useFetch('/api/dashboard/admin/count')

    const cards = [
        {
            title: 'Total Categories',
            value: countData?.data?.category || 0,
            href: ADMIN_CATEGORY_SHOW,
            icon: FolderTree,
            chartVar: '--chart-1'
        },
        {
            title: 'Total Products',
            value: countData?.data?.product || 0,
            href: ADMIN_PRODUCT_SHOW,
            icon: Shirt,
            chartVar: '--chart-2'
        },
        {
            title: 'Total Customers',
            value: countData?.data?.customer || 0,
            href: ADMIN_CUSTOMERS_SHOW,
            icon: UsersRound,
            chartVar: '--chart-3'
        },
        {
            title: 'Total Orders',
            value: countData?.data?.order || 0,
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
                        <Card className={`border-l-4 hover:border-l-8`} style={{ borderLeftColor: `var(${card.chartVar})` }}> 
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <div className="flex items-center gap-2">
                                                <CardTitle className={`text-sm font-medium text-foreground`}>{card.title}</CardTitle>
                                            </div>
                                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: `var(${card.chartVar})`, color: card.chartVar === '--chart-2' ? '#0A2F24' : 'var(--background)' }} aria-hidden>
                                                <card.icon className="h-4 w-4" />
                                            </span>
                                        </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold">{loading || !countData ? <span className="inline-block h-9 w-16 animate-pulse rounded bg-muted" aria-label="Loading" /> : card.value}</div>
                                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success"><CircleCheck className="h-3 w-3" /></span>
                                    <span className="ml-1">Current store total</span>
                                </p>
                            </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

export default CountOverview
