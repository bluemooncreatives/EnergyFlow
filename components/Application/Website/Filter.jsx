'use client'
import { memo, useEffect, useId, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { useRouter, useSearchParams } from 'next/navigation'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { Button } from '@/components/ui/button'
import { BrandButton } from '@/components/Application/Website/BrandButton'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Minus, Plus, Crown, Sparkles } from 'lucide-react'
const Filter = ({ filters, showClearLink = true }) => {
    const instanceId = useId()
    const searchParams = useSearchParams()

    const [priceFilter, setPriceFilter] = useState({ minPrice: 0, maxPrice: 3000 })
    const [selectedCategory, setSelectedCategory] = useState([])
    const [selectedSize, setSelectedSize] = useState([])
    const [bestsellerOnly, setBestsellerOnly] = useState(false)
    const [freshlyArrivedOnly, setFreshlyArrivedOnly] = useState(false)

    const categories = filters?.categories ?? null
    const sizes = filters?.sizes ?? null

    const categoriesReady = Array.isArray(categories)
    const sizesReady = Array.isArray(sizes)

    const urlSearchParams = new URLSearchParams(searchParams.toString())
    const router = useRouter()

    useEffect(() => {
        searchParams.get('category') ? setSelectedCategory(searchParams.get('category').split(',')) : setSelectedCategory([])

        searchParams.get('size') ? setSelectedSize(searchParams.get('size').split(',')) : setSelectedSize([])

        setBestsellerOnly(['true', '1', 'yes'].includes((searchParams.get('bestseller') || '').toLowerCase()))

        setFreshlyArrivedOnly(['true', '1', 'yes'].includes((searchParams.get('freshlyArrived') || '').toLowerCase()))

        const minPrice = parseInt(searchParams.get('minPrice'))
        const maxPrice = parseInt(searchParams.get('maxPrice'))
        const normalizedMin = Number.isFinite(minPrice) ? Math.max(0, Math.min(minPrice, 3000)) : 0
        const normalizedMax = Number.isFinite(maxPrice) ? Math.max(normalizedMin, Math.min(maxPrice, 3000)) : 3000

        setPriceFilter({
            minPrice: normalizedMin,
            maxPrice: normalizedMax,
        })

    }, [searchParams])



    const handlePriceChange = (value) => {
        setPriceFilter({ minPrice: value[0], maxPrice: value[1] })
    }



    const handleCategoryFilter = (categorySlug) => {
        let newSelectedCategory = [...selectedCategory]
        if (newSelectedCategory.includes(categorySlug)) {
            newSelectedCategory = newSelectedCategory.filter(cat => cat !== categorySlug)
        } else {
            newSelectedCategory.push(categorySlug)
        }

        setSelectedCategory(newSelectedCategory)

        newSelectedCategory.length > 0 ? urlSearchParams.set('category', newSelectedCategory.join(',')) : urlSearchParams.delete('category')

        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)

    }

    const handleSizeFilter = (size) => {
        let newSelectedSize = [...selectedSize]
        if (newSelectedSize.includes(size)) {
            newSelectedSize = newSelectedSize.filter(cat => cat !== size)
        } else {
            newSelectedSize.push(size)
        }

        setSelectedSize(newSelectedSize)

        newSelectedSize.length > 0 ? urlSearchParams.set('size', newSelectedSize.join(',')) : urlSearchParams.delete('size')

        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)

    }

    const handleBestsellerFilter = () => {
        const next = !bestsellerOnly
        setBestsellerOnly(next)

        if (next) {
            urlSearchParams.set('bestseller', 'true')
        } else {
            urlSearchParams.delete('bestseller')
        }
        // Reset pagination so toggling the filter doesn't land on an out-of-range page.
        urlSearchParams.delete('page')

        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const handleFreshlyArrivedFilter = () => {
        const next = !freshlyArrivedOnly
        setFreshlyArrivedOnly(next)

        if (next) {
            urlSearchParams.set('freshlyArrived', 'true')
        } else {
            urlSearchParams.delete('freshlyArrived')
        }
        // Reset pagination so toggling the filter doesn't land on an out-of-range page.
        urlSearchParams.delete('page')

        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const handlePriceFilter = () => {
        urlSearchParams.set('minPrice', priceFilter.minPrice)
        urlSearchParams.set('maxPrice', priceFilter.maxPrice)
        router.push(`${WEBSITE_SHOP}?${urlSearchParams}`)
    }

    const hasFilters = searchParams.size > 0


    return (
        <div className="space-y-6 text-sm font-neue">
            {hasFilters && showClearLink && (
                <Button type="button" variant="link" className="h-auto w-fit p-0 text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground" asChild>
                    <Link href={WEBSITE_SHOP}>
                        Clear Filters
                    </Link>
                </Button>
            )}

            <div className="space-y-2.5">
                <button
                    type="button"
                    onClick={handleBestsellerFilter}
                    aria-pressed={bestsellerOnly}
                    className={`flex w-full items-center justify-center gap-2 border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition ${bestsellerOnly
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                        : 'border-border/60 text-[var(--brand-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'}`}
                >
                    <Crown className="size-4" />
                    Bestsellers
                </button>

                <button
                    type="button"
                    onClick={handleFreshlyArrivedFilter}
                    aria-pressed={freshlyArrivedOnly}
                    className={`flex w-full items-center justify-center gap-2 border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition ${freshlyArrivedOnly
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                        : 'border-border/60 text-[var(--brand-ink)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]'}`}
                >
                    <Sparkles className="size-4" />
                    Freshly Arrived
                </button>
            </div>

            <Accordion
                type="multiple"
                defaultValue={['category', 'size', 'price']}
                className="space-y-4"
            >
                <AccordionItem value="category" className="border-b border-border/60">
                    <AccordionTrigger className="group flex w-full items-center justify-between py-2 text-base font-semibold text-[var(--brand-primary)] hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
                        <span>Categories</span>
                        <span className="relative flex size-4 items-center justify-center">
                            <Plus className="absolute size-4 transition-all duration-200 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0" />
                            <Minus className="absolute size-4 opacity-0 transition-all duration-200 group-data-[state=open]:opacity-100" />
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                        <ul className="space-y-2.5">
                            {!categoriesReady && (
                                <li className="px-2 py-1.5 text-[12px] text-muted-foreground">Loading categories...</li>
                            )}
                            {categoriesReady && categories.length === 0 && (
                                <li className="px-2 py-1.5 text-[12px] text-muted-foreground">No categories available.</li>
                            )}
                            {categoriesReady && categories.map((category) => {
                                const categoryId = `${instanceId}-category-${category._id}`
                                const active = selectedCategory.includes(category.slug)
                                return (
                                    <li key={category._id}>
                                        <label
                                            htmlFor={categoryId}
                                            className={`flex cursor-pointer items-center gap-3 px-1 py-1.5 text-[13px] transition ${active ? 'font-medium text-[var(--brand-primary-hover)]' : 'font-semibold text-[var(--brand-ink)] hover:text-[var(--brand-primary-hover)]'}`}
                                        >
                                            <Checkbox
                                                id={categoryId}
                                                onCheckedChange={() => handleCategoryFilter(category.slug)}
                                                checked={selectedCategory.includes(category.slug)}
                                            />
                                            <span>{category.name}</span>
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="size" className="border-b border-border/60">
                    <AccordionTrigger className="group flex w-full items-center justify-between py-2 text-base font-semibold text-[var(--brand-primary)] hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
                        <span>Pack Size</span>
                        <span className="relative flex size-4 items-center justify-center">
                            <Plus className="absolute size-4 transition-all duration-200 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0" />
                            <Minus className="absolute size-4 opacity-0 transition-all duration-200 group-data-[state=open]:opacity-100" />
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                        <ul className="grid grid-cols-2 gap-2">
                            {!sizesReady && (
                                <li className="col-span-2 px-2 py-1.5 text-[12px] text-muted-foreground">Loading pack sizes...</li>
                            )}
                            {sizesReady && sizes.length === 0 && (
                                <li className="col-span-2 px-2 py-1.5 text-[12px] text-muted-foreground">No pack sizes available.</li>
                            )}
                            {sizesReady && sizes.map((size, index) => {
                                const sizeId = `${instanceId}-size-${index}`
                                const active = selectedSize.includes(size)
                                return (
                                    <li key={`${size}-${index}`}>
                                        <label
                                            htmlFor={sizeId}
                                            className={`flex cursor-pointer items-center gap-2 px-1 py-1.5 text-[13px] transition ${active ? 'font-semibold text-[var(--brand-primary-hover)]' : 'font-semibold text-[var(--brand-ink)] hover:text-[var(--brand-primary-hover)]'}`}
                                        >
                                            <Checkbox
                                                id={sizeId}
                                                onCheckedChange={() => handleSizeFilter(size)}
                                                checked={selectedSize.includes(size)}
                                            />
                                            <span>{size}</span>
                                        </label>
                                    </li>
                                )
                            })}
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price" className="border-b border-border/60">
                    <AccordionTrigger className="group flex w-full items-center justify-between py-2 text-base font-semibold text-[var(--brand-primary)] hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden">
                        <span>Price</span>
                        <span className="relative flex size-4 items-center justify-center">
                            <Plus className="absolute size-4 transition-all duration-200 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0" />
                            <Minus className="absolute size-4 opacity-0 transition-all duration-200 group-data-[state=open]:opacity-100" />
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 px-[10px] pb-4">
                        <Slider
                            className="mt-0"
                            value={[priceFilter.minPrice, priceFilter.maxPrice]}
                            max={3000}
                            step={1}
                            onValueChange={handlePriceChange}
                        />
                        <div className="grid grid-cols-2 gap-2 font-neue text-[11px] text-foreground/60">
                            <div className="border border-border/60 px-2 py-2 text-center tracking-[0.04em]">
                                {priceFilter.minPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </div>
                            <div className="border border-border/60 px-2 py-2 text-center tracking-[0.04em]">
                                {priceFilter.maxPrice.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </div>
                        </div>
                        <BrandButton onClick={handlePriceFilter} type="button">
                            Apply Filter
                        </BrandButton>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

export default memo(Filter)
