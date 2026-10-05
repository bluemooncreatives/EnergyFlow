'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import useFetch from "@/hooks/useFetch"
import Link from "next/link"
import AdminEmptyState, { AdminLoadingState } from '@/components/Application/Admin/AdminEmptyState'
import { useEffect, useState } from "react"
import { CreditCard, Hash, Package, ReceiptText, CircleAlert, ShoppingBag } from "lucide-react"
import { statusBadge } from "@/lib/helperFunction"
import { ADMIN_ORDER_DETAILS } from "@/routes/AdminPanelRoute"

const LatestOrder = () => {
    const [latestOrder, setLatestOrder] = useState()
    const { data, loading, error, refetch } = useFetch('/api/dashboard/admin/latest-order')

    useEffect(() => {
        if (data && data.success) {
            setLatestOrder(data.data)
        }
    }, [data])

    if (loading) return <AdminLoadingState className="py-8" />

    if (error) return <AdminEmptyState icon={CircleAlert} tone="danger" title="Couldn’t load this list" description={error} onRetry={refetch} className="py-8" />

    if (!latestOrder || latestOrder.length === 0) return <AdminEmptyState icon={ShoppingBag} title="No orders yet" description="New orders will show up here as customers check out." className="py-8" />

    return (
        <Table>
            <TableHeader>
                <TableRow className="group/row">
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Hash className="size-3.5" />
                            Order ID
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <CreditCard className="size-3.5" />
                            Payment ID
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Package className="size-3.5" />
                            Items
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <ReceiptText className="size-3.5" />
                            Status
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-right text-xs font-semibold text-muted-foreground">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {latestOrder?.map((order) => (
                    <TableRow key={order._id} className="group/row text-xs sm:text-sm">
                        <TableCell className="bg-background py-2.5 font-mono text-xs">
                            <Link href={ADMIN_ORDER_DETAILS(order._id)} className="hover:text-primary hover:underline font-medium">
                                {String(order._id).slice(-8).toUpperCase()}
                            </Link>
                        </TableCell>
                        <TableCell className="bg-background py-2.5 font-mono text-xs text-muted-foreground">
                            {order.payment_id ? String(order.payment_id).slice(-8).toUpperCase() : '-'}
                        </TableCell>
                        <TableCell className="bg-background py-2.5 text-xs sm:text-sm text-muted-foreground">
                            {order.products?.length ?? 0}
                        </TableCell>
                        <TableCell className="bg-background py-2.5">
                            {statusBadge(order.status)}
                        </TableCell>
                        <TableCell className="bg-background py-2.5 text-right font-semibold tabular-nums text-xs sm:text-sm">
                            ₹{Number(order.totalAmount || 0).toLocaleString('en-IN')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default LatestOrder
