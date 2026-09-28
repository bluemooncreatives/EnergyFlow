'use client'

/**
 * Analytics → Products & Catalogue tab
 * TopProducts + CategoryPerformance + CatalogueHealth + ReviewsPanel
 */

import { ShoppingBag, Tag, Star, BarChart2 } from 'lucide-react'
import { TopProducts, CategoryPerformance, CatalogueHealth, ReviewsPanel } from '../Panels'

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

const ProductsCatalogueTab = ({ data, isLoading }) => {
    const totalSales = (data?.categories || []).reduce((s, c) => s + c.sales, 0)

    return (
        <div className="flex flex-col gap-6">
            {/* Top products + category performance */}
            <div>
                <SectionLabel icon={ShoppingBag} bg="var(--chart-1)" title="Product Performance" description="Top-selling products and category revenue breakdown" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <TopProducts items={data?.topProducts} totalSales={totalSales} />
                    <CategoryPerformance categories={data?.categories} />
                    <CatalogueHealth catalogue={data?.catalogue} />
                </div>
            </div>

            {/* Reviews & ratings */}
            <div>
                <SectionLabel icon={Star} bg="var(--chart-2)" fg="#0A2F24" title="Ratings & Reviews" description="Customer sentiment trends and low-rated products" />
                <div className="grid gap-4 lg:grid-cols-3">
                    <ReviewsPanel reviews={data?.reviews} kpis={data?.kpis} />
                    {/* Category breakdown summary card */}
                    <div className="rounded-xl border bg-card p-4 sm:p-5">
                        <p className="mb-3 text-sm font-semibold text-foreground">Category Sales Share</p>
                        {(data?.categories || []).slice(0, 8).length > 0 ? (
                            <ul className="space-y-2.5">
                                {(data?.categories || []).slice(0, 8).map((cat, i) => {
                                    const pct = totalSales ? Math.round((cat.sales / totalSales) * 100) : 0
                                    return (
                                        <li key={cat.name} className="space-y-1">
                                            <div className="flex items-baseline justify-between text-xs">
                                                <span className="truncate font-medium">{cat.name}</span>
                                                <span className="shrink-0 text-muted-foreground">{pct}%</span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full transition-[width] duration-700"
                                                    style={{ width: `${pct}%`, background: `var(--chart-${(i % 5) + 1})` }}
                                                />
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <p className="text-xs text-muted-foreground">No category data for this range.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProductsCatalogueTab
