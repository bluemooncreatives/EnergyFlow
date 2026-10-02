'use client'

/**
 * Analytics → Orders & Fulfillment tab
 * OrderPipeline + PaymentMix + BuyingHeatmap + RecentOrders
 */

import { Clock, Truck, Package, CreditCard } from 'lucide-react'
import { OrderPipeline, PaymentMix, BuyingHeatmap, RecentOrders } from '../Panels'

const SectionLabel = ({ icon: Icon, bg, fg = 'var(--primary-foreground)', title, description }) => (
    <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: bg, color: fg }} aria-hidden="true">
            <Icon className="size-4" />
        </span>
        <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
    </div>
)

const OrdersFulfillmentTab = ({ data, isLoading }) => (
    <div className="flex flex-col gap-4 sm:gap-6">
        {/* Pipeline + Payment */}
        <div>
            <SectionLabel icon={Package} bg="var(--chart-2)" fg="#0A2F24" title="Order Pipeline & Payments" description="Current order status flow and payment breakdown" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <OrderPipeline statusCounts={data?.statusCounts} shipmentCounts={data?.shipmentCounts} placed={data?.breakdown?.placed} />
                <PaymentMix paymentMethods={data?.paymentMethods} paymentStatuses={data?.paymentStatuses} />
                <RecentOrders orders={data?.recentOrders} />
            </div>
        </div>

        {/* Buying heatmap */}
        <div>
            <SectionLabel icon={Clock} bg="var(--chart-4)" title="When Customers Order" description="Orders by weekday and hour (India time) — spot your peak windows" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <BuyingHeatmap heatmap={data?.heatmap} />
                {/* Courier status summary */}
                <div className="rounded-xl border bg-card p-4 sm:p-5">
                    <p className="mb-3 text-sm font-semibold text-foreground">Courier Status Summary</p>
                    {data?.shipmentCounts && Object.keys(data.shipmentCounts).length > 0 ? (
                        <ul className="space-y-2">
                            {Object.entries(data.shipmentCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                                <li key={status} className="flex items-center justify-between text-sm">
                                    <span className="capitalize text-muted-foreground">{status.replace(/_/g, ' ')}</span>
                                    <span className="font-semibold tabular-nums">{count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">No shipment data for this range.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
)

export default OrdersFulfillmentTab
