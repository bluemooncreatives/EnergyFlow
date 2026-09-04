'use client'
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import PageHeader from "@/components/Application/Admin/PageHeader"
import SizeGuideBuilder from "@/components/Application/Admin/SizeGuideBuilder"
import { ADMIN_DASHBOARD, ADMIN_SIZE_GUIDE_SHOW } from "@/routes/AdminPanelRoute"
import { use } from "react"

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_SIZE_GUIDE_SHOW, label: 'Size Guides' },
    { href: '', label: 'Edit Size Guide' },
]

const EditSizeGuidePage = ({ params }) => {
    const { id } = use(params)

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Edit Size Guide"
                description="Update size chart details and rows."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <SizeGuideBuilder mode="edit" sizeGuideId={id} />
        </div>
    )
}

export default EditSizeGuidePage
