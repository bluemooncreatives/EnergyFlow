'use client'

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import slugify from "slugify"

const toColumnKey = (label) => {
    const slug = slugify(label || "", { lower: true, strict: true })
    return slug.replace(/-/g, "_")
}

const SizeGuideTable = ({ columns, rows, isLoading = false, className = "" }) => {
    const safeColumns = Array.isArray(columns) ? columns : []
    const safeRows = Array.isArray(rows) ? rows : []

    // ── Loading skeleton ──────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className={cn("overflow-hidden rounded-md border border-border/60 shadow-sm", className)}>
                <div className="bg-[var(--brand-cream)]/40 px-4 py-3">
                    <Skeleton className="h-3 w-24" />
                </div>
                <div className="divide-y divide-border/50">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
                            <Skeleton className="h-3.5 w-10" />
                            <Skeleton className="h-3 flex-1" />
                            <Skeleton className="h-3 flex-1" />
                            <Skeleton className="h-3 flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // ── Empty state ───────────────────────────────────────────────────
    if (!safeColumns.length || !safeRows.length) {
        return (
            <div className={cn("rounded-md border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center font-neue text-sm text-muted-foreground", className)}>
                No size guide available for this product yet.
            </div>
        )
    }

    const columnKeys = safeColumns.map((column) => toColumnKey(column))

    return (
        <div className={cn("overflow-hidden rounded-md border border-border/60 shadow-sm", className)}>
            <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse text-left font-neue">
                    <thead>
                        <tr className="bg-[var(--brand-cream)]/40">
                            {safeColumns.map((column, index) => (
                                <th
                                    key={column}
                                    scope="col"
                                    className={cn(
                                        "whitespace-nowrap px-4 py-3.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--brand-primary)]",
                                        index === 0 && "border-r border-border/40"
                                    )}
                                >
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {safeRows.map((row, rowIndex) => (
                            <tr
                                key={`size-guide-row-${rowIndex}`}
                                className={cn(
                                    "border-t border-border/50 transition-colors hover:bg-[var(--brand-cream)]/25",
                                    rowIndex % 2 === 1 && "bg-muted/20"
                                )}
                            >
                                {columnKeys.map((key, colIndex) => (
                                    <td
                                        key={`size-guide-cell-${rowIndex}-${colIndex}`}
                                        className={cn(
                                            "whitespace-normal break-words px-4 py-3.5 text-[13px]",
                                            colIndex === 0
                                                ? "border-r border-border/40 font-semibold uppercase tracking-[0.04em] text-[var(--brand-primary)]"
                                                : "tabular-nums text-foreground/80"
                                        )}
                                    >
                                        {row?.[key] ?? "—"}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default SizeGuideTable
