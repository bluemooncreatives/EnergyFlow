'use client'

/**
 * Overview → Activity Tab
 * Live feed of recent orders, product reviews, and customer sign-ups.
 * Uses the shadcn Table + Card components consistent with the Overview style.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import useFetch from '@/hooks/useFetch'
import Link from 'next/link'
import Image from 'next/image'
import { ADMIN_ORDER_SHOW, ADMIN_ORDER_DETAILS, ADMIN_REVIEW_SHOW, ADMIN_CUSTOMERS_SHOW } from '@/routes/AdminPanelRoute'
import { statusBadge } from '@/lib/helperFunction'
import notFound from '@/public/assets/images/not-found.png'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import {
    ShoppingBag, Star, Users, Clock, CheckCircle2,
    Truck, PackageX, AlertCircle, Hash,
} from 'lucide-react'

// ── helper ────────────────────────────────────────────────────────────
const IconBadge = ({ icon: Icon, bg = 'var(--chart-1)', fg = 'var(--primary-foreground)' }) => (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg, color: fg }} aria-hidden="true">
        <Icon className="size-4" />
    </span>
)

const PanelHeader = ({ icon, iconBg, iconFg, title, description, action }) => (
    <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <IconBadge icon={icon} bg={iconBg} fg={iconFg} />
                <div>
                    <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                    {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
                </div>
            </div>
            {action}
        </div>
    </CardHeader>
)

// ── Status summary chips ──────────────────────────────────────────────
const STATUS_META = [
    { key: 'pending', label: 'Pending', icon: Clock, bg: 'var(--chart-2)', fg: '#0A2F24' },
    { key: 'processing', label: 'Processing', icon: AlertCircle, bg: 'var(--chart-4)', fg: 'var(--primary-foreground)' },
    { key: 'shipped', label: 'Shipped', icon: Truck, bg: 'var(--chart-3)', fg: 'var(--primary-foreground)' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, bg: 'var(--chart-1)', fg: 'var(--primary-foreground)' },
    { key: 'cancelled', label: 'Cancelled', icon: PackageX, bg: 'var(--destructive)', fg: '#fff' },
]

const OrderStatusSummaryCard = () => {
    const [counts, setCounts] = useState({})
    const { data: orderStatus } = useFetch('/api/dashboard/admin/order-status')

    useEffect(() => {
        if (orderStatus?.success) {
            const m = {}
            orderStatus.data.forEach(o => { m[o._id] = o.count })
            setCounts(m)
        }
    }, [orderStatus])

    return (
        <Card>
            <PanelHeader
                icon={ShoppingBag}
                iconBg="var(--chart-1)"
                title="Order Status Breakdown"
                description="All-time counts by current status"
                action={
                    <Button variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                    </Button>
                }
            />
            <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {STATUS_META.map(({ key, label, icon: Icon, bg, fg }) => (
                        <Link key={key} href={ADMIN_ORDER_SHOW} className="group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition hover:border-primary/30 hover:bg-muted/40">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: bg, color: fg }}>
                                <Icon className="size-4" />
                            </span>
                            <span className="text-xl font-bold tabular-nums leading-none">{counts[key] ?? '—'}</span>
                            <span className="text-[0.625rem] font-medium text-muted-foreground">{label}</span>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ── Latest Orders table ───────────────────────────────────────────────
const LatestOrdersCard = () => {
    const [orders, setOrders] = useState([])
    const { data, loading } = useFetch('/api/dashboard/admin/latest-order')

    useEffect(() => {
        if (data?.success) setOrders(data.data)
    }, [data])

    return (
        <Card className="lg:col-span-2">
            <PanelHeader
                icon={Hash}
                iconBg="var(--chart-3)"
                title="Recent Orders"
                description="Latest orders synced from your storefront"
                action={
                    <Button variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                    </Button>
                }
            />
            <CardContent>
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
                ) : !orders.length ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2">
                        <Image src={notFound.src} width={64} height={64} alt="No orders" className="opacity-50" />
                        <p className="text-xs text-muted-foreground">No recent orders</p>
                    </div>
                ) : (
                    <div className="max-h-[280px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Order ID</TableHead>
                                    <TableHead className="text-xs">Items</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-right text-xs">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map(order => (
                                    <TableRow key={order._id}>
                                        <TableCell className="py-2 font-mono text-[0.6875rem]">
                                            <Link href={ADMIN_ORDER_DETAILS(order._id)} className="hover:text-primary hover:underline">
                                                {String(order._id).slice(-8).toUpperCase()}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-2 text-sm text-muted-foreground">{order.products?.length ?? 0}</TableCell>
                                        <TableCell className="py-2">{statusBadge(order.status)}</TableCell>
                                        <TableCell className="py-2 text-right font-semibold tabular-nums">₹{order.totalAmount?.toLocaleString('en-IN')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ── Latest Reviews card ───────────────────────────────────────────────
const LatestReviewsCard = () => {
    const [reviews, setReviews] = useState([])
    const { data, loading } = useFetch('/api/dashboard/admin/latest-review')

    useEffect(() => {
        if (data?.success) setReviews(data.data)
    }, [data])

    return (
        <Card>
            <PanelHeader
                icon={Star}
                iconBg="var(--chart-2)"
                iconFg="#0A2F24"
                title="Latest Reviews"
                description="Recent customer ratings and feedback"
                action={
                    <Button variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={ADMIN_REVIEW_SHOW}>View All</Link>
                    </Button>
                }
            />
            <CardContent>
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">Loading…</div>
                ) : !reviews.length ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-2">
                        <Image src={notFound.src} width={64} height={64} alt="No reviews" className="opacity-50" />
                        <p className="text-xs text-muted-foreground">No reviews yet</p>
                    </div>
                ) : (
                    <ul className="divide-y">
                        {reviews.map(review => (
                            <li key={review._id} className="flex items-center gap-3 py-2.5">
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={review?.product?.media?.[0]?.secure_url || imgPlaceholder.src} />
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{review?.product?.name || 'Product'}</p>
                                    <div className="mt-0.5 flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`size-3 ${i < review.rating ? 'fill-[var(--chart-2)] text-[var(--chart-2)]' : 'text-muted-foreground/30'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">{review.rating}/5</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}

// ── Store counts quick overview ───────────────────────────────────────
const StoreCountsCard = () => {
    const { data: countData, loading } = useFetch('/api/dashboard/admin/count')
    const metrics = [
        { label: 'Categories', value: countData?.data?.category, icon: '📁' },
        { label: 'Products', value: countData?.data?.product, icon: '👕' },
        { label: 'Customers', value: countData?.data?.customer, icon: '👥' },
        { label: 'Orders', value: countData?.data?.order, icon: '📦' },
    ]

    return (
        <Card>
            <PanelHeader
                icon={Users}
                iconBg="var(--chart-4)"
                title="Store Totals"
                description="Current counts across your store"
                action={
                    <Button variant="ghost" className="h-8 text-xs" asChild>
                        <Link href={ADMIN_CUSTOMERS_SHOW}>Customers</Link>
                    </Button>
                }
            />
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map(({ label, value, icon }) => (
                        <div key={label} className="flex items-center gap-3 rounded-lg border p-3">
                            <span className="text-xl">{icon}</span>
                            <div>
                                <p className="text-lg font-bold tabular-nums leading-none">
                                    {loading ? <span className="inline-block h-5 w-10 animate-pulse rounded bg-muted" /> : (value ?? 0).toLocaleString('en-IN')}
                                </p>
                                <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ── Main ActivityTab ──────────────────────────────────────────────────
const ActivityTab = () => (
    <div className="flex flex-col gap-6">
        {/* Order status summary */}
        <OrderStatusSummaryCard />

        {/* Recent orders + reviews */}
        <div className="grid gap-4 lg:grid-cols-3">
            <LatestOrdersCard />
            <LatestReviewsCard />
        </div>

        {/* Store counts */}
        <StoreCountsCard />
    </div>
)

export default ActivityTab
