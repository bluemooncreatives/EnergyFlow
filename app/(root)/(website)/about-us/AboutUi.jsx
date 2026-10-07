import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'

/* Shared pieces of the About page's own section language (distinct from the
   gift boxes page's numbered discs): an editorial meta row over each
   section, and sentence-case display headlines — the brand speaking in its
   own voice, like the page's <h1>. */

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
