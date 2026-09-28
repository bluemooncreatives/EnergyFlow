'use client'

/**
 * Overview section — 3 sub-tabs:
 *   Summary  |  Sales  |  Activity
 * URL: ?ovTab=summary (default) | sales | activity
 */

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LayoutDashboard, TrendingUp, Activity } from 'lucide-react'
import SummaryTab from './SummaryTab'
import SalesTab from './SalesTab'
import ActivityTab from './ActivityTab'

const TABS = [
    { id: 'summary', label: 'Summary', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'activity', label: 'Activity', icon: Activity },
]

const OverviewInner = () => {
    const params = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const valid = TABS.map(t => t.id)
    const ovTab = valid.includes(params.get('ovTab')) ? params.get('ovTab') : 'summary'

    const onChange = (value) => {
        const q = new URLSearchParams(params.toString())
        q.set('ovTab', value)
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={ovTab} onValueChange={onChange} className="space-y-5">
            <div className="w-full overflow-x-auto">
                <TabsList className="gap-1">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <TabsTrigger key={id} value={id} className="gap-1.5 text-xs sm:text-sm">
                            <Icon className="size-3.5" aria-hidden="true" />
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <TabsContent value="summary"><SummaryTab /></TabsContent>
            <TabsContent value="sales"><SalesTab /></TabsContent>
            <TabsContent value="activity"><ActivityTab /></TabsContent>
        </Tabs>
    )
}

const OverviewTabs = () => (
    <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-xl bg-muted" />}>
        <OverviewInner />
    </Suspense>
)

export default OverviewTabs
