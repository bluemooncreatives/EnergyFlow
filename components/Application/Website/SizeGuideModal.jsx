'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import SizeGuideTable from "@/components/Application/Website/SizeGuideTable"
import { Info, Ruler } from "lucide-react"

const SizeGuideModal = ({ open, onOpenChange, sizeGuide }) => {
    const isMobile = useIsMobile()
    const isLoading = sizeGuide === undefined

    const body = (
        <div className="space-y-5">
            <SizeGuideTable
                columns={sizeGuide?.columns}
                rows={sizeGuide?.rows}
                isLoading={isLoading}
            />

            <div className="flex gap-3 rounded-md border border-[var(--brand-cream)] bg-[var(--brand-cream)]/25 p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-[var(--brand-primary)]" strokeWidth={2} />
                <div className="space-y-0.5">
                    <p className="font-neue text-[13px] font-semibold text-[var(--brand-primary)]">Note</p>
                    <p className="font-neue text-[13px] leading-relaxed text-[var(--text-body)]">
                        {sizeGuide?.note ? sizeGuide.note : "Measurements may vary slightly depending on fabric and fit."}
                    </p>
                </div>
            </div>
        </div>
    )

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent
                    side="bottom"
                    className="gap-0 overflow-hidden rounded-t-md border-border/60 bg-background p-0"
                >
                    <div aria-hidden className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

                    <SheetHeader className="flex-row items-center gap-3 border-b border-border/60 px-5 py-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-cream)]/60 text-[var(--brand-primary)]">
                            <Ruler className="size-5" strokeWidth={1.75} />
                        </span>
                        <div className="space-y-0.5">
                            <SheetTitle className="font-header text-2xl leading-none text-[var(--brand-primary)]">
                                Size Guide
                            </SheetTitle>
                            <SheetDescription className="font-neue text-[13px] text-muted-foreground">
                                Find your best fit.
                            </SheetDescription>
                        </div>
                    </SheetHeader>

                    <div className="max-h-[68vh] overflow-y-auto px-5 py-5">
                        {body}
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(94vw,640px)] max-w-[min(94vw,640px)] gap-0 overflow-hidden rounded-md border-border/60 bg-background p-0 sm:max-w-[min(94vw,640px)]">
                <DialogHeader className="flex-row items-center gap-3 border-b border-border/60 px-6 py-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-cream)]/60 text-[var(--brand-primary)]">
                        <Ruler className="size-5" strokeWidth={1.75} />
                    </span>
                    <div className="space-y-0.5">
                        <DialogTitle className="font-header text-[28px] leading-none text-[var(--brand-primary)]">
                            Size Guide
                        </DialogTitle>
                        <DialogDescription className="font-neue text-sm text-muted-foreground">
                            Find your best fit.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="max-h-[72vh] overflow-y-auto px-6 py-6">
                    {body}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default SizeGuideModal
