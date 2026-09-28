import CountOverview from './CountOverview'
import QuickAdd from './QuickAdd'
import PageHeader from '@/components/Application/Admin/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { OrderOverview } from './OrderOverview'
import { OrderStatus } from './OrderStatus'
import LatestOrder from './LatestOrder'
import LatestReview from './LatestReview'
import DashboardTabs from './DashboardTabs'
import { ADMIN_ORDER_SHOW, ADMIN_REVIEW_SHOW, ADMIN_PRODUCT_ADD, ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'

const AdminDashboard = () => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Dashboard"
                description="Sales, customers and catalogue performance — live from your store."
                actions={
                    <>
                        <Button asChild variant="outline" className="h-9">
                            <Link href="/" target="_blank">View store</Link>
                        </Button>
                        <Button asChild variant="outline" className="h-9">
                            <Link href={ADMIN_MEDIA_SHOW}>Upload media</Link>
                        </Button>
                        <Button asChild className="h-9 gap-1.5">
                            <Link href={ADMIN_PRODUCT_ADD}>+ Add product</Link>
                        </Button>
                    </>
                }
            />

            <DashboardTabs
                overview={
                    <div className="space-y-4">
                    <CountOverview />
                    <QuickAdd />

                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                        <Card className='col-span-1 lg:col-span-4'>
                            <CardHeader>
                                <div className='flex justify-between items-center'>
                                    <CardTitle>Revenue Status</CardTitle>
                                    <Button type='button' variant='ghost' className='text-xs' asChild>
                                        <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className='ps-2'>
                                <OrderOverview />
                            </CardContent>
                        </Card>

                        <Card className='col-span-1 lg:col-span-3'>
                            <CardHeader>
                                <div className='flex justify-between items-center'>
                                    <CardTitle>Audience Overview</CardTitle>
                                    <Button type='button' variant='ghost' className='text-xs' asChild>
                                        <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <OrderStatus />
                            </CardContent>
                        </Card>
                    </div>

                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                        <Card className='col-span-1 lg:col-span-4'>
                            <CardHeader>
                                <div className='flex justify-between items-center'>
                                    <CardTitle>Earnings Reports</CardTitle>
                                    <Button type='button' variant='ghost' className='text-xs' asChild>
                                        <Link href={ADMIN_ORDER_SHOW}>View All</Link>
                                    </Button>
                                </div>
                                <CardDescription>Latest orders synced from your active storefront.</CardDescription>
                            </CardHeader>
                            <CardContent className='max-h-[340px] overflow-auto'>
                                <LatestOrder />
                            </CardContent>
                        </Card>

                        <Card className='col-span-1 lg:col-span-3'>
                            <CardHeader>
                                <div className='flex justify-between items-center'>
                                    <CardTitle>Most Popular Products</CardTitle>
                                    <Button type='button' variant='ghost' className='text-xs' asChild>
                                        <Link href={ADMIN_REVIEW_SHOW}>View All</Link>
                                    </Button>
                                </div>
                                <CardDescription>Recent customer reviews and sentiment trends.</CardDescription>
                            </CardHeader>
                            <CardContent className='max-h-[340px] overflow-auto'>
                                <LatestReview />
                            </CardContent>
                        </Card>
                    </div>
                    </div>
                }
            />
        </div>
    )
}

export default AdminDashboard
