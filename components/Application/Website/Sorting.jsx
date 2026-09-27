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
        <div className='flex flex-wrap items-center gap-2.5 font-neue lg:justify-between'>
            {/* Filter trigger — mobile/tablet only. Matches the sort dropdown's
                exact style (height, border, radius, brand text) so the two sit
                on one row as a consistent pair; hidden on desktop where the
                filter lives in the sticky sidebar. */}
            <Button
                type="button"
                className="h-11 shrink-0 rounded-full border-line-strong bg-surface-card px-4 text-[0.9375rem] font-medium text-brand hover:bg-surface-card hover:text-brand lg:hidden"
                variant="outline"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            >
                <SlidersHorizontal className='size-4' aria-hidden="true" />
                Filters
            </Button>

            <Select value={sorting} onValueChange={(value) => setSorting(value)}>
                <SelectTrigger aria-label="Sort products" className="h-11 flex-1 rounded-full border-line-strong bg-surface-card px-4 text-[0.9375rem] font-medium text-brand md:w-[230px] md:flex-none lg:order-2">
                    <SelectValue placeholder="Default Sorting" />
                </SelectTrigger>
                <SelectContent
                    position="popper"
                    className="rounded-2xl border-line-soft font-neue w-[var(--radix-select-trigger-width)]"
                >
                    {sortings.map(option => (
                        <SelectItem key={option.value} value={option.value} className="rounded-xl text-[0.9375rem] text-ink-strong">{option.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {typeof resultCount === 'number' && (
                <span className="w-full text-[0.9375rem] text-ink-muted lg:order-1 lg:w-auto" aria-live="polite">
                    {resultCount === 1 ? '1 product' : `${resultCount} products`}
                </span>
            )}
        </div>
    )
}

export default memo(Sorting)
