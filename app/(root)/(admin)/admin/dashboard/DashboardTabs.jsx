'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, LayoutDashboard } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnalyticsDashboard from './analytics/AnalyticsDashboard'

// Tab state lives in ?tab= so "Analytics" links, refreshes and the back
// button all land on the view the admin was looking at.
// Default is always "overview" so the overview panel opens first.
const TabsInner = ({ overview }) => {
    const params = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const tab = params.get('tab') === 'analytics' ? 'analytics' : 'overview'

    const onChange = (value) => {
        const q = new URLSearchParams(params.toString())
        q.set('tab', value)
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={tab} onValueChange={onChange} className="space-y-4">
            <div className="no-scrollbar w-full overflow-x-auto print:hidden">
                <TabsList>
                    <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm"><LayoutDashboard className="size-3.5 sm:size-4" aria-hidden="true" /> Overview</TabsTrigger>
                    <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm"><BarChart3 className="size-3.5 sm:size-4" aria-hidden="true" /> Analytics &amp; Reports</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="overview">{overview}</TabsContent>
            <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
        </Tabs>
    )
}

const DashboardTabs = (props) => (
    <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-xl bg-muted" />}>
        <TabsInner {...props} />
    </Suspense>
)

export default DashboardTabs
