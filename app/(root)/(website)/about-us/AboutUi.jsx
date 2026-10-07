import { ArrowLeft, ArrowRight } from 'lucide-react'
import { COMPANY } from '@/lib/company'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'

/* Shared pieces of the About page's own section language (distinct from the
   gift boxes page's numbered discs), so every section reads the same:
   - numbered sections open with the meta row; unnumbered ones (hero,
     statement, closing band) with an .ef-eyebrow pill
   - headlines use ABOUT_TITLE, long sentences ABOUT_STATEMENT
   - every carousel steps with AboutPager
   - tags on photos are PhotoTag; chips use the control radius
   - page actions are .ef-btn; a button set on a photo is .ef-cta--accent */

// "// WHY SHOPPERS STAY ───────────── [03]"
export const AboutMetaRow = ({ label, number, inverse = false, className }) => (
    <div
        className={cn(
            'mb-[clamp(1.5rem,3vw,2.5rem)] flex items-center gap-4 text-[0.75rem] font-semibold uppercase',
            inverse ? 'text-cream/70' : 'text-ink-muted',
            className
        )}
        data-reveal
    >
        {label && <p className="shrink-0">{'//'} {label}</p>}
        <span aria-hidden="true" className={cn('h-px min-w-6 flex-1', inverse ? 'bg-cream/20' : 'bg-line-strong')} />
        {number ? <span aria-hidden="true" className="shrink-0 tabular-nums">[{pad2(number)}]</span> : null}
    </div>
)

// A sentence set large: the promise, a review, the store's invitation.
export const ABOUT_STATEMENT = 'm-0 font-header text-[clamp(1.375rem,1.05rem+1.4vw,2.5rem)] font-medium leading-[1.18] text-ink-strong [text-wrap:pretty]'

export const ABOUT_TITLE = 'm-0 font-header text-[clamp(1.75rem,1.15rem+2.5vw,3.5rem)] font-semibold leading-[1.02] text-ink-strong [text-wrap:balance] [overflow-wrap:anywhere]'

// Headline with an optional accent half on its own colour.
export const AboutTitle = ({ id, title, accent, className, as: Tag = 'h2' }) => (
    <Tag id={id} className={cn(ABOUT_TITLE, className)}>
        {title}
        {accent && <> <span className="text-brand-bright">{accent}</span></>}
    </Tag>
)

// The largest number in "2-4 days" (→ 4), for proportional timeline bars.
export const upperNumber = (value) => {
    const numbers = String(value || '').match(/\d+(?:\.\d+)?/g)
    return numbers ? Math.max(...numbers.map(Number)) : null
}

// Google Maps at the store's address (the hero card and the visit section).
export const DIRECTIONS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([COMPANY.brand, ...COMPANY.addressLines].join(', '))}`

// The cream, sun-dot tag the storefront's photo cards share.
export const PhotoTag = ({ children, className }) => (
    <span
        className={cn(
            'inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 truncate rounded-[var(--radius-control)] bg-cream/90 px-2.5 py-1.5 text-[0.6875rem] font-semibold leading-none text-pine shadow-elev-1 backdrop-blur',
            className
        )}
    >
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-sun ring-1 ring-olive" />
        {children}
    </span>
)

// "03 / 07" with the two arrows: the one pager every carousel on the page
// uses. `stacked` puts the count above the arrows for narrow slots.
export const AboutPager = ({ current, count, onPrev, onNext, prevDisabled = false, nextDisabled = false, noun = 'item', stacked = false, className }) => (
    <div className={cn('flex gap-3', stacked ? 'flex-col items-start' : 'items-center', className)}>
        <p className="m-0 flex items-baseline gap-1 tabular-nums" aria-hidden="true">
            <span className="font-header text-[1.125rem] font-semibold leading-none text-ink-strong">{pad2(current + 1)}</span>
            <span className="text-[0.8125rem] font-semibold text-ink-muted">/ {pad2(count)}</span>
        </p>
        <div className="flex items-center gap-2">
            <button type="button" className="ef-icon-btn" onClick={onPrev} disabled={prevDisabled} aria-label={`Previous ${noun}`}>
                <ArrowLeft aria-hidden="true" />
            </button>
            <button type="button" className="ef-icon-btn" onClick={onNext} disabled={nextDisabled} aria-label={`Next ${noun}`}>
                <ArrowRight aria-hidden="true" />
            </button>
        </div>
    </div>
)
