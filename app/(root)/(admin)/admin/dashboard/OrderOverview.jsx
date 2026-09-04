"use client"

import { Bar, BarChart, CartesianGrid, Cell, Rectangle, XAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState } from "react"
import useFetch from "@/hooks/useFetch"

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "November",
    "December",
]

const chartConfig = {
    amount: {
        label: "Amount",
        color: "var(--chart-1)",
    },
}
const chartVars = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"]

export function OrderOverview() {

    const [chartData, setChartData] = useState([])
    const { data: monthlySales } = useFetch('/api/dashboard/admin/monthly-sales')
    useEffect(() => {
        const dummyValues = [18, 26, 14, 22, 30, 19, 27, 16, 24, 12, 20]
        const dummyData = months.map((month, index) => {
            const colorVar = chartVars[index % chartVars.length]
            return {
                month,
                amount: dummyValues[index] ?? 0,
                fill: `var(${colorVar})`,
                colorVar,
            }
        })

        if (monthlySales && monthlySales.success) {
            const getChartData = months.map((month, index) => {
                const monthData = monthlySales.data.find(item => item._id.month === index + 1)
                const colorVar = chartVars[index % chartVars.length]

                return {
                    month: month,
                    amount: monthData ? monthData.totalSales : 0,
                    fill: `var(${colorVar})`,
                    colorVar,
                }
            })

            const hasAnyData = getChartData.some((item) => item.amount > 0)
            setChartData(hasAnyData ? getChartData : dummyData)
            return
        }

        setChartData(dummyData)
    }, [monthlySales])

 
    return (
        <div className='w-full'>
            <ChartContainer config={chartConfig} className="h-[500px] w-full aspect-auto">
                <BarChart
                    accessibilityLayer
                    data={chartData}
                    margin={{ top: 8, right: 12, left: 8, bottom: 28 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                        dataKey="amount"
                        strokeWidth={2}
                        radius={8}
                        activeIndex={Math.max(chartData.length - 1, 0)}
                        activeBar={({ ...props }) => (
                            <Rectangle
                                {...props}
                                fillOpacity={0.8}
                                stroke={props.payload.fill}
                                strokeDasharray={4}
                                strokeDashoffset={4}
                            />
                        )}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${entry.month}-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartContainer>
        </div>
    )
}
