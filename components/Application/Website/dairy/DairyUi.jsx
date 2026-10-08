import { CakeSlice, Coffee, CookingPot, Flame, HandPlatter, Milk, PackageCheck, Scale, Soup, Sprout, Wheat } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionTag } from '../gifting/GiftingUi'

// A wooden bilona: the shaft, the cross-bar handle and the star-cut head.
const Bilona = ({ className, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M12 2v14" />
        <path d="M8 5h8" />
        <path d="M12 16l-3.5 3.5M12 16l3.5 3.5M12 16v5.5M12 16l-4.5 1M12 16l4.5 1" />
    </svg>
)

// An oil lamp (diya) with its flame.
const Diya = ({ className, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
        <path d="M12 3c1.6 1.9 2 3.3 1.2 4.6-.5.8-1.9.8-2.4 0C10 6.3 10.4 4.9 12 3z" />
        <path d="M3 12h18c-.6 4.4-4.4 7-9 7s-8.4-2.6-9-7z" />
        <path d="M17 12l3-2.5" />
    </svg>
)

const ICONS = {
    sprout: Sprout,
    milk: Milk,
    churn: Bilona,
    butter: HandPlatter,
    flame: Flame,
    jar: PackageCheck,
    scale: Scale,
    pot: CookingPot,
    wheat: Wheat,
    soup: Soup,
    sweet: CakeSlice,
    diya: Diya,
    coffee: Coffee,
}

export const DairyIcon = ({ name, className }) => {
    const Icon = ICONS[name] || Sprout
    return <Icon className={className} aria-hidden="true" />
}

/**
 * The dairy page's section heading, in the gifting page's grammar: a
 * hairline, the numbered label, then the headline (accent half in the
 * brand's bright tone) with an optional lead beside it on desktop.
 */
export const DairySectionHead = ({ number, eyebrow, title, accent, lead, id, inverse = false, className }) => (
    <div className={cn('mb-[var(--section-gap)] border-t pt-5 sm:pt-6', inverse ? 'border-cream/20' : 'border-line-strong', className)}>
        <SectionTag number={number} eyebrow={eyebrow} inverse={inverse} />
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-10" data-reveal>
            <h2 id={id} className="ef-title">
                {title}
                {accent && <> <span className="ef-title__accent">{accent}</span></>}
            </h2>
            {lead && (
                <p className={cn('max-w-md text-[0.9375rem] leading-relaxed lg:justify-self-end lg:pb-1.5', inverse ? 'text-cream/75' : 'text-ink-muted')}>
                    {lead}
                </p>
            )}
        </div>
    </div>
)
