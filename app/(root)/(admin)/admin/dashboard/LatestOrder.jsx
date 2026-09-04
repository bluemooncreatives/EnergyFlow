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
import Image from "next/image"
import notFound from '@/public/assets/images/not-found.png'
import { useEffect, useState } from "react"
import { CreditCard, Hash, Package, ReceiptText } from "lucide-react"
import { statusBadge } from "@/lib/helperFunction"
const LatestOrder = () => {
    const [latestOrder, setLatestOrder] = useState()
    const { data, loading } = useFetch('/api/dashboard/admin/latest-order')

    useEffect(() => {
        if (data && data.success) {
            setLatestOrder(data.data)
        }
    }, [data])

    if (loading) return <div className="h-full w-full flex justify-center items-center">Loading...</div>

    if (!latestOrder || latestOrder.length === 0) return <div className="h-full w-full flex justify-center items-center">
        <Image src={notFound.src} width={notFound.width} height={notFound.height} alt="not found" className="w-20" />
    </div>

    return (
        <Table>
            <TableHeader>
                <TableRow className="group/row">
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Hash className="h-3.5 w-3.5" />
                            Order Id
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5" />
                            Payment Id
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5" />
                            Total Item
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <ReceiptText className="h-3.5 w-3.5" />
                            Status
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {latestOrder?.map((order) => (
                    <TableRow key={order._id} className="group/row text-sm">
                        <TableCell className="bg-background py-3 font-medium">{order._id}</TableCell>
                        <TableCell className="bg-background py-3 text-muted-foreground">{order.payment_id}</TableCell>
                        <TableCell className="bg-background py-3 text-muted-foreground">{order.products.length}</TableCell>
                        <TableCell className="bg-background py-3">{statusBadge(order.status)}</TableCell>
                        <TableCell className="bg-background py-3 font-medium">${order.totalAmount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default LatestOrder
