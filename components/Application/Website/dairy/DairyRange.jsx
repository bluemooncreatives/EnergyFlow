import { MessageCircle, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import ProductBox from '../ProductBox'
import StoreButton from '../storefront/StoreButton'
import { DairyIcon, DairySectionHead } from './DairyUi'
import { DAIRY_WHATSAPP_HREF, RANGE_ANCHOR } from './dairyContent'

// The ask tile's tall layout, per breakpoint. Where the tile has a full
// grid row to itself it stays a compact strip (icon and copy side by side,
// button underneath); where it shares a row with products it stands tall
// like a card. Literal strings so Tailwind can see them.
const TALL = {
    sm: 'sm:max-md:flex sm:max-md:min-h-[16rem] sm:max-md:flex-col sm:max-md:items-start sm:max-md:justify-between sm:max-md:p-6 sm:max-md:[&>a]:w-auto',
    md: 'md:max-lg:flex md:max-lg:min-h-[16rem] md:max-lg:flex-col md:max-lg:items-start md:max-lg:justify-between md:max-lg:p-6 md:max-lg:[&>a]:w-auto',
    lg: 'lg:flex lg:min-h-[16rem] lg:flex-col lg:items-start lg:justify-between lg:p-6 lg:[&>a]:w-auto',
}

// Closes a short grid so a young aisle still reads as complete: says more
// is coming and opens a WhatsApp chat for anything not listed.
const AskTile = ({ className }) => (
    <div className={cn('ef-tile ef-on-inverse grid h-full grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 bg-pine p-4 text-cream shadow-elev-1 sm:p-5', className)}>
        <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />
        <span className="ef-seal ef-seal--sun !size-12 sm:!size-14"><DairyIcon name="milk" /></span>
        <div className="flex min-w-0 flex-col gap-1.5">
            <h3 className="font-header text-[clamp(1.0625rem,0.95rem+0.6vw,1.625rem)] font-semibold uppercase leading-tight">More from the dairy, soon</h3>
            <p className="text-[0.8125rem] leading-relaxed text-cream/75 sm:text-[0.875rem]">
                We are adding to this aisle. Looking for something you don&apos;t see, or buying in bulk? Ask us.
            </p>
        </div>
        <a href={DAIRY_WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="ef-btn ef-btn--accent ef-btn--sm col-span-2 w-full">
            <MessageCircle aria-hidden="true" /> Ask on WhatsApp
        </a>
    </div>
)

/**
 * "Shop the dairy": every product in the aisle as the storefront's usual
 * product cards (add to cart, buy now, quick view). On phones a lone
 * product takes the full width rather than half a row. While the aisle is
 * short the ask tile closes the grid, as a strip under the products when it
 * has a row of its own; once the aisle is longer than the first 30, a link
 * carries on to the filterable shop.
 */
const DairyRange = ({ products = [], total = 0, shopHref, number }) => {
    if (!products.length) return null
    const count = products.length
    const short = count < 4
    // Does the ask tile get a whole row? Always on phones; on 2-up tablets
    // after an even count; on 3-up after three.
    const fullSm = count % 2 === 0
    const fullMd = count % 3 === 0

    return (
        <section id={RANGE_ANCHOR} className="ef-section ef-section--sunken scroll-mt-20" aria-labelledby="dairy-range-title">
            <div className="ef-container">
                <DairySectionHead
                    number={number}
                    eyebrow="Shop the dairy"
                    id="dairy-range-title"
                    title="From the"
                    accent="dairy."
                    lead="Desi dairy staples, made in small batches and packed fresh for your kitchen."
                />

                <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-[0.8125rem] text-ink-muted">
                        {total} {total === 1 ? 'product' : 'products'}
                    </p>
                    {shopHref && (
                        <StoreButton href={shopHref} variant="outline" size="sm">
                            <SlidersHorizontal className="size-4" aria-hidden="true" /> Filter &amp; sort
                        </StoreButton>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-[var(--grid-gap)] md:grid-cols-3 lg:grid-cols-4" data-reveal>
                    {products.map((product, index) => (
                        <div key={product._id} className={cn(count === 1 && 'max-sm:col-span-2')}>
                            <ProductBox product={product} priority={index < 2} />
                        </div>
                    ))}
                    {short && (
                        <div className={cn('max-sm:col-span-2', fullSm && 'sm:max-md:col-span-2', fullMd && 'md:max-lg:col-span-3')}>
                            <AskTile className={cn(!fullSm && TALL.sm, !fullMd && TALL.md, TALL.lg)} />
                        </div>
                    )}
                </div>

                {total > products.length && shopHref && (
                    <div className="mt-8 flex justify-center">
                        <StoreButton href={shopHref} arrow>View all {total} products</StoreButton>
                    </div>
                )}
            </div>
        </section>
    )
}

export default DairyRange
