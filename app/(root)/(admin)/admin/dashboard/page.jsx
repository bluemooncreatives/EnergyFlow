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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ADMIN_ORDER_SHOW, ADMIN_REVIEW_SHOW, ADMIN_PRODUCT_ADD, ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'

const AdminDashboard = () => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Dashboard"
                description="Welcome back! Here's your store overview."
                actions={
                    <>
                        <Link href={ADMIN_PRODUCT_ADD}>
                            <Button className="gap-2 h-9" size="lg">
                                <span>+</span>
                                Add Product
                            </Button>
                        </Link>
                        <Link href={ADMIN_MEDIA_SHOW}>
                            <Button variant="outline" className="h-9" size="lg">Upload Media</Button>
                        </Link>
                    </>
                }
            />

            <Tabs defaultValue="overview" className="space-y-4">
                <div className='w-full overflow-x-auto pb-2'>
                    <TabsList>
                        <TabsTrigger value='overview'>Overview</TabsTrigger>
                        <TabsTrigger value='analytics'>Analytics</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4">
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
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm font-medium'>Revenue Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className='text-2xl font-bold'>+20.1%</p>
                                <p className='text-xs text-muted-foreground'>Compared to previous month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm font-medium'>New Customers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className='text-2xl font-bold'>+180</p>
                                <p className='text-xs text-muted-foreground'>New users acquired this month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm font-medium'>Order Velocity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className='text-2xl font-bold'>+12.4%</p>
                                <p className='text-xs text-muted-foreground'>Average weekly order growth</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-sm font-medium'>Live Sessions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className='text-2xl font-bold'>573</p>
                                <p className='text-xs text-muted-foreground'>Users browsing right now</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
                        <Card className='col-span-1 lg:col-span-4'>
                            <CardHeader>
                                <CardTitle>Sales Overview</CardTitle>
                            </CardHeader>
                            <CardContent className='ps-2'>
                                <OrderOverview />
                            </CardContent>
                        </Card>
                        <Card className='col-span-1 lg:col-span-3'>
                            <CardHeader>
                                <CardTitle>Channel Mix</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <OrderStatus />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default AdminDashboard
