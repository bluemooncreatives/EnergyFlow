import { cn } from '@/lib/utils'
import { pad } from '../gifting/GiftingUi'
import { DairyIcon, DairySectionHead } from './DairyUi'
import { DAIRY_USES } from './dairyContent'

const TONES = {
    sun: 'bg-sun text-sun-ink',
    pine: 'ef-on-inverse bg-pine text-cream',
    card: 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft',
}

const SEALS = {
    sun: 'ef-seal--pine',
    pine: 'ef-seal--sun',
    card: 'ef-seal--sun',
}

/**
 * "Dairy in the kitchen": six everyday uses as a bento grid. Two tiles
 * take the brand colours so the grid never reads as a wall of cards. On
 * phones it is two-up, with the first and last tiles full width so no row
 * is left half empty.
 */
const DairyKitchen = ({ number }) => (
    <section className="ef-section ef-section--page" aria-labelledby="dairy-kitchen-title">
        <div className="ef-container">
            <DairySectionHead
                number={number}
                eyebrow="In the kitchen"
                id="dairy-kitchen-title"
                title="Dairy in the"
                accent="kitchen."
                lead="From the first tadka of the day to the last diya of the evening, desi dairy does a lot of work in an Indian home."
            />

            <ul className="grid list-none grid-cols-2 gap-[var(--grid-gap)] p-0 lg:grid-cols-3">
                {DAIRY_USES.map((use, i) => {
                    const tone = use.tone || 'card'
                    return (
                        <li
                            key={use.title}
                            className={cn(
                                'ef-tile flex min-h-[11rem] flex-col justify-between gap-6 p-4 shadow-elev-1 sm:min-h-[14rem] sm:p-6',
                                TONES[tone],
                                (i === 0 || i === DAIRY_USES.length - 1) && 'max-lg:col-span-2'
                            )}
                            data-reveal
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className={cn('ef-seal !size-12 sm:!size-14', SEALS[tone])}>
                                    <DairyIcon name={use.icon} />
                                </span>
                                <span aria-hidden="true" className="font-header text-[0.875rem] font-semibold tabular-nums opacity-50">{pad(i + 1)}</span>
                            </div>
                            <div>
                                <h3 className="font-header text-[clamp(1.0625rem,0.95rem+0.6vw,1.5rem)] font-semibold uppercase leading-tight">{use.title}</h3>
                                <p className={cn('mt-1.5 text-[0.8125rem] leading-relaxed sm:text-[0.9375rem]', tone === 'card' ? 'text-ink-muted' : 'opacity-80')}>{use.copy}</p>
                            </div>
                        </li>
                    )
                })}
            </ul>
        </div>
    </section>
)

export default DairyKitchen
