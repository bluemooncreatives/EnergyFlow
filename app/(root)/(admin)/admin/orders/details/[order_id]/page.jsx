'use client'
import Image from "next/image"
import placeholderImg from '@/public/assets/images/img-placeholder.webp'
import Link from "next/link"
import { WEBSITE_PRODUCT_DETAILS } from "@/routes/WebsiteRoute"
import useFetch from "@/hooks/useFetch"
import { use, useEffect, useState } from "react"
import { ADMIN_DASHBOARD, ADMIN_ORDER_SHOW } from "@/routes/AdminPanelRoute"
import BreadCrumb from "@/components/Application/Admin/BreadCrumb"
import PageHeader from "@/components/Application/Admin/PageHeader"
import ShipmentManagement from "@/components/Application/Admin/ShipmentManagement"
import ButtonLoading from "@/components/Application/ButtonLoading"
import { showToast } from "@/lib/showToast"
import AdminEmptyState, { AdminLoadingState } from "@/components/Application/Admin/AdminEmptyState"
import { CircleAlert, PackageX } from "lucide-react"
import axios from "axios"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: ADMIN_ORDER_SHOW, label: 'Orders' },
    { href: '', label: 'Order Details' },
]

const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Unverified', value: 'unverified' },
]

const OrderDetails = ({ params }) => {
    const { order_id } = use(params)
    const [orderData, setOrderData] = useState()
    const [orderStatus, setOrderStatus] = useState()
    const [updatingStatus, setUpdatingStatus] = useState(false)
    const { data, loading, error, errorStatus, refetch } = useFetch(`/api/orders/get/${order_id}`)


    useEffect(() => {
        if (data && data.success) {
            setOrderData(data.data)
            setOrderStatus(data?.data?.status)
        }
    }, [data])


    const handleOrderStatus = async () => {
        setUpdatingStatus(true)
        try {
            const { data: response } = await axios.put('/api/orders/update-status', {
                _id: orderData?._id,
                status: orderStatus
            })
            if (!response.success) {
                throw new Error(response.message)
            }

            // The response isn't populated, so only take the new status from it.
            setOrderData((current) => ({ ...current, status: orderStatus }))
            showToast('success', response.message)

        } catch (error) {
            // Put the dropdown back to the saved status so it doesn't show a change that was refused.
            setOrderStatus(orderData?.status)
            showToast('error', error.message)
        } finally {
            setUpdatingStatus(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title="Order Details"
                description="Review order items, shipping, and status."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
            />

            <div className="rounded-md bg-card">
                {!orderData && (loading || !error) ? (
                    <AdminLoadingState label="Loading order…" className="py-24" />
                ) : !orderData ? (
                    <AdminEmptyState
                        icon={errorStatus === 404 ? PackageX : CircleAlert}
                        tone="danger"
                        title={errorStatus === 404 ? 'Order not found' : 'Couldn’t load this order'}
                        description={errorStatus === 404 ? `No order matches “${order_id}”. It may have been deleted or the link is wrong.` : error}
                        onRetry={errorStatus === 404 ? undefined : refetch}
                        action={{ href: ADMIN_ORDER_SHOW, label: 'Back to orders' }}
                        className="py-24"
                    />
                ) : (
                    <div className="px-3 py-4 sm:px-4">
                        <dl className="mb-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
                            <dt className="font-semibold">Order Id</dt>
                            <dd className="break-all text-muted-foreground max-sm:-mt-1.5">{orderData?.order_id}</dd>
                            <dt className="font-semibold">Transaction Id</dt>
                            <dd className="break-all text-muted-foreground max-sm:-mt-1.5">{orderData?.payment_id || '---'}</dd>
                            <dt className="font-semibold">Status</dt>
                            <dd className="capitalize text-muted-foreground max-sm:-mt-1.5">{orderData?.status}</dd>
                        </dl>

                            <div className="overflow-hidden rounded-lg border">
                                <Table>
                                    <TableHeader className="hidden md:table-header-group">
                                        <TableRow>
                                            <TableHead className="text-start p-3">Product</TableHead>
                                            <TableHead className="text-center p-3">Price</TableHead>
                                            <TableHead className="text-center p-3">Quantity</TableHead>
                                            <TableHead className="text-center p-3">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {orderData && orderData?.products?.map((product, index) => (
                                        // Phones stack each line item as a block: product, then label/value rows.
                                        <TableRow key={product?.variantId?._id || index} className="block border-b py-1 md:table-row md:py-0">
                                            <TableCell className="block whitespace-normal p-3 md:table-cell">
                                                <div className="flex items-center gap-3 sm:gap-5">
                                                    <Image src={product?.variantId?.media?.[0]?.secure_url || placeholderImg.src} width={60} height={60} alt="product" className="size-14 shrink-0 rounded object-cover sm:size-[60px]" />
                                                    <div className="min-w-0">
                                                        <h4 className="text-base leading-snug break-words sm:text-lg">
                                                            <Link href={WEBSITE_PRODUCT_DETAILS(product?.productId)} className="hover:underline">{product?.productId?.name || product?.name}</Link>
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">Pack Size: {product?.variantId?.size || '---'}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="flex justify-between gap-3 px-3 py-1.5 text-center md:table-cell md:p-3">
                                                <span className="text-muted-foreground md:hidden">Price</span>
                                                <span>{Number(product?.sellingPrice || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                            </TableCell>
                                            <TableCell className="flex justify-between gap-3 px-3 py-1.5 text-center md:table-cell md:p-3">
                                                <span className="text-muted-foreground md:hidden">Quantity</span>
                                                <span>{product?.qty}</span>
                                            </TableCell>
                                            <TableCell className="flex justify-between gap-3 px-3 py-1.5 text-center font-semibold md:table-cell md:p-3 md:font-normal">
                                                <span className="text-muted-foreground md:hidden">Total</span>
                                                <span>{(Number(product?.qty || 0) * Number(product?.sellingPrice || 0)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-6 sm:mt-10">
                                <ShipmentManagement
                                    orderData={orderData}
                                    onShipmentCreated={(updatedOrder) => {
                                        setOrderData(updatedOrder)
                                        setOrderStatus(updatedOrder?.status)
                                    }}
                                />
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-2">
                                <div className="rounded-lg border p-4 sm:p-5">
                                    <h4 className="mb-3 text-base font-semibold sm:mb-5 sm:text-lg">Shipping Address</h4>
                                    <dl className="divide-y text-sm">
                                        {[
                                            ['Name', orderData?.name],
                                            ['Email', orderData?.email],
                                            ['Phone', orderData?.phone],
                                            ['Country', orderData?.country],
                                            ['State', orderData?.state],
                                            ['City', orderData?.city],
                                            ['Pincode', orderData?.pincode],
                                            ['Address', orderData?.address],
                                            ['Landmark', orderData?.landmark],
                                            ['Order note', orderData?.ordernote],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex items-start justify-between gap-4 py-2">
                                                <dt className="shrink-0 font-medium">{label}</dt>
                                                <dd className="min-w-0 break-words text-end text-muted-foreground [overflow-wrap:anywhere]">{value || '---'}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-4 sm:p-5">
                                    <h4 className="mb-3 text-base font-semibold sm:mb-5 sm:text-lg">Order Summary</h4>
                                    <dl className="text-sm">
                                        <div className="flex justify-between gap-4 py-2">
                                            <dt className="font-medium">Subtotal</dt>
                                            <dd className="tabular-nums">{Number(orderData?.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</dd>
                                        </div>
                                        {orderData?.couponDiscountAmount > 0 && (
                                            <div className="flex justify-between gap-4 py-2">
                                                <dt className="font-medium">Coupon Discount</dt>
                                                <dd className="tabular-nums">- {orderData?.couponDiscountAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</dd>
                                            </div>
                                        )}
                                        {orderData?.deliveryCharge > 0 && (
                                            <div className="flex justify-between gap-4 py-2">
                                                <dt className="font-medium">Delivery</dt>
                                                <dd className="tabular-nums">{orderData.deliveryCharge.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</dd>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-4 py-2 text-base font-semibold">
                                            <dt>Total</dt>
                                            <dd className="tabular-nums">{Number(orderData?.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</dd>
                                        </div>
                                    </dl>

                                    <hr className="my-2" />

                                    <div className="pt-3">
                                        <h4 className="mb-2 text-base font-semibold sm:text-lg">Order Status</h4>
                                        <Select
                                            value={orderStatus}
                                            onValueChange={setOrderStatus}
                                        >
                                            <SelectTrigger className="h-11 w-full sm:h-10" aria-label="Order status">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <ButtonLoading type="button" loading={updatingStatus} onClick={handleOrderStatus} text="Save Status" className="mt-4 h-11 w-full cursor-pointer sm:mt-5 sm:h-9 sm:w-auto" size="lg" />
                                    </div>

                                </div>
                            </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default OrderDetails
