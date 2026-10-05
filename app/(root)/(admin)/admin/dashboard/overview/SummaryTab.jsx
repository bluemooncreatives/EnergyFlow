'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CountOverview from '../CountOverview'
import QuickAdd from '../QuickAdd'
import { OrderOverview } from '../OrderOverview'
import { OrderStatus } from '../OrderStatus'
import LatestOrder from '../LatestOrder'
import LatestReview from '../LatestReview'
import { ADMIN_ORDER_SHOW, ADMIN_REVIEW_SHOW } from '@/routes/AdminPanelRoute'
import { ShoppingBag, TrendingUp, Users, Star } from 'lucide-react'

// Reusable section card header with icon badge
const SectionCard = ({ title, description, action, children, iconBg = 'var(--chart-1)', iconFg = 'var(--primary-foreground)', icon: Icon }) => (
    <Card className="rounded-xl">
        <CardHeader className="px-4 py-3 sm:px-5 pb-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <span
                            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                            style={{ backgroundColor: iconBg, color: iconFg }}
                            aria-hidden="true"
                        >
                            <Icon className="size-4" />
                        </span>
                    )}
                    <div>
                        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                        {description && <CardDescription className="mt-0.5 text-xs text-muted-foreground">{description}</CardDescription>}
                    </div>
                </div>
                {action}
            </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</CardContent>
    </Card>
)

const SummaryTab = () => (
    <div className="flex flex-col gap-4 sm:gap-6">
        {/* Stat cards */}
        <CountOverview />

        {/* Quick actions */}
        <QuickAdd />

        {/* Revenue + Audience row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
                <SectionCard
                    title="Revenue Status"
                    description="Monthly net sales - current year"
                    icon={TrendingUp}
                    iconBg="var(--chart-1)"
                    action={
                        <Button type="button" variant="ghost" className="h-8 text-xs" asChild>
                            <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                        </Button>
                    }
                >
                    <div className="-mx-2 -mb-2">
                        <OrderOverview />
                    </div>
                </SectionCard>
            </div>

            <div className="col-span-1 lg:col-span-3">
                <SectionCard
                    title="Audience Overview"
                    description="All-time order breakdown by status"
                    icon={Users}
                    iconBg="var(--chart-3)"
                    action={
                        <Button type="button" variant="ghost" className="h-8 text-xs" asChild>
                            <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                        </Button>
                    }
                >
                    <OrderStatus />
                </SectionCard>
            </div>
        </div>

        {/* Latest orders + reviews row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <div className="col-span-1 lg:col-span-4">
                <SectionCard
                    title="Earnings Reports"
                    description="Latest orders synced from your active storefront."
                    icon={ShoppingBag}
                    iconBg="var(--chart-2)"
                    iconFg="#0A2F24"
                    action={
                        <Button type="button" variant="ghost" className="h-8 text-xs" asChild>
                            <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                        </Button>
                    }
                >
                    <div className="max-h-[340px] overflow-auto">
                        <LatestOrder />
                    </div>
                </SectionCard>
            </div>

            <div className="col-span-1 lg:col-span-3">
                <SectionCard
                    title="Most Popular Products"
                    description="Recent customer reviews and sentiment trends."
                    icon={Star}
                    iconBg="var(--chart-4)"
                    action={
                        <Button type="button" variant="ghost" className="h-8 text-xs" asChild>
                            <Link href={ADMIN_REVIEW_SHOW}>View All</Link>
                        </Button>
                    }
                >
                    <div className="max-h-[340px] overflow-auto">
                        <LatestReview />
                    </div>
                </SectionCard>
            </div>
        </div>
    </div>
)

export default SummaryTab
