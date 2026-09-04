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
    const { data, loading } = useFetch(`/api/orders/get/${order_id}`)


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

            showToast('success', response.message)

        } catch (error) {
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
                {!orderData ? (
                    <div className="flex justify-center items-center py-24">
                        <h4 className="text-red-500 text-xl font-semibold">Order Not Found</h4>
                    </div>
                ) : (
                    <div className="px-4 py-4">
                        <div className="mb-5">
                            <p><b>Order Id:</b> {orderData?.order_id}</p>
                            <p><b>Transaction Id:</b> {orderData?.payment_id}</p>
                            <p className="capitalize"><b>Status:</b> {orderData?.status}</p>
                        </div>

                            <div className="rounded-lg border overflow-hidden">
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
                                    {orderData && orderData?.products?.map((product) => (
                                        <TableRow key={product.variantId._id} className="md:table-row block border-b">
                                            <TableCell className="md:table-cell p-3">
                                                <div className="flex items-center gap-5">
                                                    <Image src={product?.variantId?.media[0]?.secure_url || placeholderImg.src} width={60} height={60} alt="product" className="rounded" />
                                                    <div>
                                                        <h4 className="text-lg">
                                                            <Link href={WEBSITE_PRODUCT_DETAILS(product?.productId?.slug)}>{product?.productId?.name}</Link>
                                                            <p>Color: {product?.variantId?.color}</p>
                                                            <p>Size: {product?.variantId?.size}</p>
                                                        </h4>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center">
                                                <span className="md:hidden font-medium">Price</span>
                                                <span>{product.sellingPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                            </TableCell>
                                            <TableCell className="md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center">
                                                <span className="md:hidden font-medium">Quantity</span>
                                                <span>{product.qty}</span>
                                            </TableCell>
                                            <TableCell className="md:table-cell flex justify-between md:p-3 px-3 pb-2 text-center">
                                                <span className="md:hidden font-medium">Total</span>
                                                <span>{(product.qty * product.sellingPrice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="mt-10">
                                <ShipmentManagement
                                    orderData={orderData}
                                    onShipmentCreated={(updatedOrder) => {
                                        setOrderData(updatedOrder)
                                        setOrderStatus(updatedOrder?.status)
                                    }}
                                />
                            </div>

                            <div className="mt-10 grid gap-4 md:grid-cols-2">
                                <div className="rounded-lg border p-5">
                                    <h4 className="text-lg font-semibold mb-5">Shipping Address</h4>
                                    <div>
                                        <table className="w-full">
                                            <tbody>
                                                <tr>
                                                    <td className="font-medium py-2">Name</td>
                                                    <td className="text-end py-2">{orderData?.name}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Email</td>
                                                    <td className="text-end py-2">{orderData?.email}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Phone</td>
                                                    <td className="text-end py-2">{orderData?.phone}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Country</td>
                                                    <td className="text-end py-2">{orderData?.country}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">State</td>
                                                    <td className="text-end py-2">{orderData?.state}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">City</td>
                                                    <td className="text-end py-2">{orderData?.city}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Pincode</td>
                                                    <td className="text-end py-2">{orderData?.pincode}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2 align-top">Address</td>
                                                    <td className="text-end py-2">{orderData?.address || '---'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Landmark</td>
                                                    <td className="text-end py-2">{orderData?.landmark || '---'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="font-medium py-2">Order note</td>
                                                    <td className="text-end py-2">{orderData?.ordernote || '---'}</td>
                                                </tr>

                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="rounded-lg border bg-muted/30 p-5">
                                    <h4 className="text-lg font-semibold mb-5">Order Summary</h4>
                                    <div>
                                        <table className="w-full">
                                            <tbody>
                                                <tr>
                                                    <td className="font-medium py-2">Subtotal</td>
                                                    <td className="text-end py-2">{orderData?.subtotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                </tr>
                                                {orderData?.couponDiscountAmount > 0 && (
                                                    <tr>
                                                        <td className="font-medium py-2">Coupon Discount</td>
                                                        <td className="text-end py-2">- {orderData?.couponDiscountAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td className="font-medium py-2">Total</td>
                                                    <td className="text-end py-2">{orderData?.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                </tr>


                                            </tbody>
                                        </table>
                                    </div>

                                    <hr />

                                    <div className="pt-3">
                                        <h4 className="text-lg font-semibold mb-2">Order Status</h4>
                                        <Select
                                            value={orderStatus}
                                            onValueChange={setOrderStatus}
                                        >
                                            <SelectTrigger className="w-full h-10">
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
                                        <ButtonLoading type="button" loading={updatingStatus} onClick={handleOrderStatus} text="Save Status" className="mt-5 h-9 cursor-pointer" size="lg" />
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
