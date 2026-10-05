import PageHeader from '@/components/Application/Admin/PageHeader'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DashboardTabs from './DashboardTabs'
import OverviewTabs from './overview/OverviewTabs'
import DashboardDateFilter from './DashboardDateFilter'
import { ADMIN_PRODUCT_ADD, ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'

const AdminDashboard = () => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Dashboard"
                description="Sales, customers and catalogue performance - live from your store."
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

            <DashboardDateFilter />

            <DashboardTabs overview={<OverviewTabs />} />
        </div>
    )
}

export default AdminDashboard
