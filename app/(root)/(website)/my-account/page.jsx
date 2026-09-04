'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch';
import { WEBSITE_ORDER_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute';
import Link from 'next/link';
import { ShoppingBag, ShoppingCart, Package, ArrowRight } from 'lucide-react'
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button'

const breadCrumbData = {
    title: 'Dashboard',
    links: [{ label: 'Dashboard' }]
}

const StatCard = ({ icon: Icon, label, value, loading }) => (
    <div className="group flex items-center justify-between gap-4 rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
        <div>
            <p className="text-sm font-medium text-foreground/60">
                {label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--brand-primary)]">
                {loading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-border/60" />
                ) : (
                    value ?? 0
                )}
            </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--dark-red)] shadow-[var(--shadow-brand)]">
            <Icon className="size-5 text-white" />
        </div>
    </div>
)

const MyAccount = () => {
    const { data: dashboardData, loading } = useFetch('/api/dashboard/user')
    const cartStore = useSelector(store => store.cartStore)
    const recentOrders = dashboardData?.data?.recentOrders ?? []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className="space-y-8">

                    {/* Page heading */}
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--brand-primary)]">
                            Overview
                        </h2>
                        <p className="mt-1 text-sm text-foreground/60">
                            A quick look at your account activity.
                        </p>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <StatCard
                            icon={ShoppingBag}
                            label="Total Orders"
                            value={dashboardData?.data?.totalOrder}
                            loading={loading}
                        />
                        <StatCard
                            icon={ShoppingCart}
                            label="Items in Cart"
                            value={cartStore?.count}
                            loading={false}
                        />
                    </div>

                    {/* Recent Orders */}
                    <div className="rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background">
                        {/* Section header */}
                        <div className="flex items-center justify-between border-b border-[var(--dark-red)]/20 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <Package className="size-4 text-[var(--brand-primary)]" />
                                <h3 className="text-lg font-semibold text-[var(--brand-primary)]">
                                    Recent Orders
                                </h3>
                            </div>
                            <Button asChild variant="link" className="h-auto p-0 text-sm font-medium text-foreground/60 hover:text-[var(--brand-primary)] hover:no-underline">
                                <Link href="/orders" className="flex items-center gap-1">
                                    View all <ArrowRight className="size-3" />
                                </Link>
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--dark-red)]/20 bg-[var(--brand-warm-bg)]/40">
                                        <th className="px-5 py-3 text-left text-sm font-semibold text-foreground/60">
                                            #
                                        </th>
                                        <th className="px-5 py-3 text-left text-sm font-semibold text-foreground/60 text-nowrap">
                                            Order ID
                                        </th>
                                        <th className="px-5 py-3 text-left text-sm font-semibold text-foreground/60 text-nowrap">
                                            Items
                                        </th>
                                        <th className="px-5 py-3 text-left text-sm font-semibold text-foreground/60">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i} className="border-b border-[var(--dark-red)]/20">
                                                {Array.from({ length: 4 }).map((__, j) => (
                                                    <td key={j} className="px-5 py-3.5">
                                                        <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-border/60" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : recentOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-12 text-center">
                                                <p className="text-lg font-semibold text-[var(--brand-primary)]">No orders yet</p>
                                                <p className="mt-1 text-sm text-foreground/60">
                                                    Start shopping and your orders will appear here.
                                                </p>
                                                <Button asChild variant="brand" className="mt-5 h-11 px-8 text-base font-semibold">
                                                    <Link href={WEBSITE_SHOP}>Shop Now</Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentOrders.map((order, i) => (
                                            <tr key={order._id} className="border-b border-border/60 transition-colors hover:bg-[var(--brand-warm-bg)]/30 last:border-0">
                                                <td className="px-5 py-3.5 text-sm font-medium text-foreground/60">
                                                    {i + 1}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Link
                                                        href={WEBSITE_ORDER_DETAILS(order.order_id)}
                                                        className="text-sm font-medium text-[var(--dark-red)] underline underline-offset-2 transition hover:text-[var(--dark-red-2)]"
                                                    >
                                                        {order.order_id}
                                                    </Link>
                                                </td>
                                                <td className="px-5 py-3.5 text-sm text-foreground/60">
                                                    {order.products.length}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-semibold text-[var(--brand-primary)]">
                                                    {order.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </UserPanelLayout>
        </div>
    )
}

export default MyAccount
