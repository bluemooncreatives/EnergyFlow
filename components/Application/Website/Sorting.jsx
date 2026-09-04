import { memo } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { sortings } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal } from 'lucide-react'

const Sorting = ({ sorting, setSorting, mobileFilterOpen, setMobileFilterOpen, resultCount }) => {
    return (
        <div className='flex flex-wrap items-center gap-2.5 font-neue sm:px-4 sm:py-3 lg:justify-end'>
            {/* Filter trigger — mobile/tablet only. Matches the sort dropdown's
                exact style (height, border, radius, brand text) so the two sit
                on one row as a consistent pair; hidden on desktop where the
                filter lives in the sticky sidebar. */}
            <Button
                type="button"
                className="h-9 shrink-0 rounded-md border-border/70 bg-background px-3 text-base font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary)] lg:hidden"
                variant="outline"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
                <SlidersHorizontal className='size-4' />
                Sidebar
            </Button>

            <Select value={sorting} onValueChange={(value) => setSorting(value)}>
                <SelectTrigger aria-label="Sort products" className="h-9 flex-1 rounded-md border-border/70 bg-background text-base font-semibold text-[var(--brand-primary)] md:w-[230px] md:flex-none">
                    <SelectValue placeholder="Default Sorting" />
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    className="rounded-md border-border/70 font-neue w-[var(--radix-select-trigger-width)]"
                >
                    {sortings.map(option => (
                        <SelectItem key={option.value} value={option.value} className="text-base font-semibold text-[var(--brand-primary)]">{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {typeof resultCount === 'number' && (
                <span className="w-full text-base font-semibold text-[var(--brand-primary)]/60 lg:w-auto">
                    {resultCount > 0 ? `Showing ${resultCount} items` : 'Showing 0 items'}
                </span>
            )}
        </div>
    )
}

export default memo(Sorting)
