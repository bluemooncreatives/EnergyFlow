"use client"

import { Bar, BarChart, CartesianGrid, Cell, Rectangle, XAxis } from "recharts"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useEffect, useState, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import useFetch from "@/hooks/useFetch"
import { Calendar } from "lucide-react"

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
    "October",
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
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const currentYear = new Date().getFullYear()
    const activeYear = searchParams.get('year') || String(currentYear)
    const activeMonth = searchParams.get('month')

    const [chartData, setChartData] = useState([])
    const { data: monthlySales, loading } = useFetch(`/api/dashboard/admin/monthly-sales?year=${activeYear}`)

    const availableYears = useMemo(() => {
        return [currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(String)
    }, [currentYear])

    const handleYearChange = (newYear) => {
        const q = new URLSearchParams(searchParams.toString())
        q.set('year', newYear)
        if (q.get('range') !== 'year' && q.get('range') !== 'month') {
            q.set('range', 'year')
        }
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    useEffect(() => {
        if (monthlySales && monthlySales.success) {
            const getChartData = months.map((month, index) => {
                const monthData = monthlySales.data?.find(item => item._id?.month === index + 1)
                const colorVar = chartVars[index % chartVars.length]
                const isSelectedMonth = activeMonth && String(index + 1) === String(activeMonth)

                return {
                    month,
                    amount: monthData ? monthData.totalSales : 0,
                    orders: monthData ? monthData.orderCount : 0,
                    fill: isSelectedMonth ? "var(--primary)" : `var(${colorVar})`,
                    colorVar,
                }
            })

            setChartData(getChartData)
            return
        }

        const emptyData = months.map((month, index) => ({
            month,
            amount: 0,
            orders: 0,
            fill: `var(${chartVars[index % chartVars.length]})`,
            colorVar: chartVars[index % chartVars.length],
        }))
        setChartData(emptyData)
    }, [monthlySales, activeMonth])

    return (
        <div className="w-full space-y-3">
            {/* Quick Year Selector toolbar */}
            <div className="flex items-center justify-between gap-2 px-2 text-xs">
                <span className="flex items-center gap-1 font-medium text-muted-foreground">
                    <Calendar className="size-3.5" /> Calendar Year:
                </span>
                <div className="flex items-center gap-1">
                    {availableYears.map((y) => (
                        <button
                            key={y}
                            type="button"
                            onClick={() => handleYearChange(y)}
                            className={`rounded-md px-2 py-0.5 font-medium transition ${
                                activeYear === y
                                    ? "bg-primary text-primary-foreground font-semibold"
                                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>

            <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto sm:h-[460px]">
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
                        tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
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
