'use client'

import { Suspense } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BarChart3, LayoutDashboard } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AnalyticsDashboard from './analytics/AnalyticsDashboard'

// Tab state lives in ?tab= so "Analytics" links, refreshes and the back
// button all land on the view the admin was looking at.
const TabsInner = ({ overview }) => {
    const params = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const tab = params.get('tab') === 'overview' ? 'overview' : 'analytics'

    const onChange = (value) => {
        const q = new URLSearchParams(params.toString())
        q.set('tab', value)
        router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={tab} onValueChange={onChange} className="space-y-4">
            <div className="w-full overflow-x-auto print:hidden">
                <TabsList>
                    <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="size-4" aria-hidden="true" /> Analytics &amp; reports</TabsTrigger>
                    <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="size-4" aria-hidden="true" /> Overview</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
            <TabsContent value="overview">{overview}</TabsContent>
        </Tabs>
    )
}

const DashboardTabs = (props) => (
    <Suspense fallback={<div className="h-[40rem] animate-pulse rounded-xl bg-muted" />}>
        <TabsInner {...props} />
    </Suspense>
)

export default DashboardTabs
