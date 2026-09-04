'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import useFetch from '@/hooks/useFetch'
import { WEBSITE_ORDER_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

const breadCrumbData = {
    title: 'Orders',
    links: [{ label: 'Orders' }]
}

const Orders = () => {
    const { data: orderData, loading } = useFetch("/api/user-order")
    const orders = orderData?.data ?? []

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className="rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background">

                    {/* Section header */}
                    <div className="flex items-center gap-2 border-b border-[var(--dark-red)]/20 px-5 py-4">
                        <Package className="size-4 text-[var(--brand-primary)]" />
                        <h2 className="text-lg font-semibold text-[var(--brand-primary)]">
                            My Orders
                        </h2>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--dark-red)]/20 bg-[var(--brand-warm-bg)]/40">
                                    <th className="px-5 py-3 text-left font-neue text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                                        #
                                    </th>
                                    <th className="px-5 py-3 text-left font-neue text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground text-nowrap">
                                        Order ID
                                    </th>
                                    <th className="px-5 py-3 text-left font-neue text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground text-nowrap">
                                        Items
                                    </th>
                                    <th className="px-5 py-3 text-left font-neue text-sm font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-[var(--dark-red)]/20">
                                            {Array.from({ length: 4 }).map((__, j) => (
                                                <td key={j} className="px-5 py-3.5">
                                                    <span className="inline-block h-3.5 w-24 animate-pulse rounded bg-border/60" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-16 text-center">
                                            <p className="text-lg font-semibold text-[var(--brand-primary)]">
                                                No orders yet
                                            </p>
                                            <p className="mt-2 text-sm text-foreground/60 max-w-xs mx-auto">
                                                You haven&apos;t placed any orders. Explore our collections and find something you love.
                                            </p>
                                            <Button asChild variant="brand" className="mt-6 h-11 px-8 text-base font-semibold">
                                                <Link href={WEBSITE_SHOP}>Shop Now</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order, i) => (
                                        <tr key={order._id} className="border-b border-[var(--dark-red)]/20 transition-colors hover:bg-[var(--brand-warm-bg)]/30 last:border-0">
                                            <td className="px-5 py-3.5 font-neue text-sm font-medium text-muted-foreground">
                                                {i + 1}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Link
                                                    href={WEBSITE_ORDER_DETAILS(order.order_id)}
                                                    className="font-neue text-sm font-medium text-[var(--dark-red)] underline underline-offset-2 transition hover:text-[var(--dark-red-2)]"
                                                >
                                                    {order.order_id}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3.5 font-neue text-sm text-muted-foreground">
                                                {order.products.length}
                                            </td>
                                            <td className="px-5 py-3.5 font-neue text-sm font-semibold text-foreground">
                                                {order.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </UserPanelLayout>
        </div>
    )
}

export default Orders
