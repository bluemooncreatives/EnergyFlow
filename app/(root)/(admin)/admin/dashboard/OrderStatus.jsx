"use client"

import { Label, Pie, PieChart } from "recharts"

import {

    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"
import useFetch from "@/hooks/useFetch"


const chartConfig = {
    status: {
        label: "Status",
    },
    pending: {
        label: "Pending",
        color: "var(--chart-1)",
    },
    processing: {
        label: "Processing",
        color: "var(--chart-2)",
    },
    shipped: {
        label: "Shipped",
        color: "var(--chart-3)",
    },
    delivered: {
        label: "Delivered",
        color: "var(--chart-4)",
    },
    cancelled: {
        label: "Cancelled",
        color: "var(--chart-5)",
    },
    unverified: {
        label: "Unverified",
        color: "var(--chart-2)",
    },
}

export function OrderStatus() {
    const [chartData, setChartData] = useState([])
    const [statusCount, setStatusCount] = useState()
    const [totalCount, setTotalCount] = useState(0)
    const { data: orderStatus } = useFetch('/api/dashboard/admin/order-status')
    const statusList = [
        { key: 'pending', label: 'Pending', colorVar: '--chart-1' },
        { key: 'processing', label: 'Processing', colorVar: '--chart-2' },
        { key: 'shipped', label: 'Shipped', colorVar: '--chart-3' },
        { key: 'delivered', label: 'Delivered', colorVar: '--chart-4' },
        { key: 'cancelled', label: 'Cancelled', colorVar: '--chart-5' },
        { key: 'unverified', label: 'Unverified', colorVar: '--chart-2' },
    ]

    useEffect(() => {
        if (orderStatus && orderStatus.success) {
            const newOrderStatus = orderStatus.data.map((o) => ({
                status: o._id,
                count: o.count,
                fill: `var(--color-${o._id})`
            }))

            setChartData(newOrderStatus)

            const getTotalCount = orderStatus.data.reduce((acc, curr) => acc + curr.count, 0)
            setTotalCount(getTotalCount)

            const statusObj = orderStatus.data.reduce((acc, item) => {
                acc[item._id] = item.count
                return acc;
            }, {})

            setStatusCount(statusObj)
        }
    }, [orderStatus])

    return (
        <div className="space-y-4">
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
            >
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={60}
                        strokeWidth={5}
                    >
                        <Label
                            content={({ viewBox }) => {
                                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                className="fill-foreground text-3xl font-bold"
                                            >
                                                {totalCount}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={(viewBox.cy || 0) + 24}
                                                className="fill-muted-foreground"
                                            >
                                                Orders
                                            </tspan>
                                        </text>
                                    )
                                }
                            }}
                        />
                    </Pie>
                </PieChart>
            </ChartContainer>

            <div>
                <ul className="space-y-3 text-sm">
                    {statusList.map((status) => (
                        <li key={status.key} className="flex items-center justify-between">
                            <span className="text-muted-foreground">{status.label}</span>
                            <span
                                className="rounded-full px-3 py-1 text-xs font-semibold"
                                style={{
                                    backgroundColor: `var(${status.colorVar})`,
                                    color: 'var(--primary-foreground)',
                                }}
                            >
                                {statusCount?.[status.key] || 0}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    )
}
