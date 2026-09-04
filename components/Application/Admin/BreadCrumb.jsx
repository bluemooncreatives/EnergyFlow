import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
const BreadCrumb = ({ breadcrumbData }) => {
    return (
        <Breadcrumb className="mb-5">
            <BreadcrumbList>
                {breadcrumbData.length > 0 && breadcrumbData.map((data, index) => {
                    const isLast = index === breadcrumbData.length - 1
                    return (
                        !isLast
                            ?
                            <div key={index} className="flex items-center">
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={data.href}>{data.label}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="ms-2 mt-1" />
                            </div>
                            :
                            <div key={index} className="flex items-center">
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-semibold">{data.label}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </div>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb >

    )
}

export default BreadCrumb