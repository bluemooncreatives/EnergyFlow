'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import PageHeader from "@/components/Application/Admin/PageHeader"
import SizeGuideBuilder from "@/components/Application/Admin/SizeGuideBuilder"
import { ADMIN_DASHBOARD, ADMIN_SIZE_GUIDE_SHOW } from "@/routes/AdminPanelRoute"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SIZE_GUIDE_SHOW, label: 'Size Guides' },
    { href: '', label: 'Add Size Guide' },
]

const AddSizeGuidePage = () => {
    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Add Size Guide"
                description="Create a new size chart for products."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <SizeGuideBuilder mode="create" />
        </div>
    )
}

export default AddSizeGuidePage
