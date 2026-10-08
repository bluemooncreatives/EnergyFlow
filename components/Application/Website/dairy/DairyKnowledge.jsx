'use client'

import { useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { pad } from '../gifting/GiftingUi'
import WaveEdge from '../storefront/WaveEdge'
import { DairyIcon, DairySectionHead } from './DairyUi'
import { DAIRY_TOPICS, GUIDE_ANCHOR } from './dairyContent'

const Points = ({ points }) => (
    <ol className="mt-6 grid list-none gap-x-6 p-0 sm:grid-cols-2">
        {points.map((point, i) => (
            <li key={point.title} className="flex gap-3 border-t border-cream/15 py-4">
                <span aria-hidden="true" className="w-6 shrink-0 pt-0.5 text-[0.75rem] font-semibold tabular-nums text-sun">{pad(i + 1)}</span>
                <div className="min-w-0">
                    <p className="text-[0.9375rem] font-semibold leading-snug text-cream">{point.title}</p>
                    <p className="mt-1 text-[0.875rem] leading-relaxed text-cream/70">{point.copy}</p>
                </div>
            </li>
        ))}
    </ol>
)

const CompareTable = ({ columns, rows, caption }) => (
    <div className="mt-6 overflow-hidden rounded-card ring-1 ring-inset ring-cream/15">
        <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <colgroup>
                <col className="w-[28%]" />
                <col />
                <col />
            </colgroup>
            <thead>
                <tr className="bg-cream/[0.06]">
                    <td />
                    <th scope="col" className="bg-sun px-3 py-3 font-header text-[0.8125rem] font-semibold uppercase leading-tight text-sun-ink sm:px-4 sm:text-[0.9375rem]">{columns[0]}</th>
                    <th scope="col" className="px-3 py-3 font-header text-[0.8125rem] font-semibold uppercase leading-tight text-cream/70 sm:px-4 sm:text-[0.9375rem]">{columns[1]}</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([label, a, b]) => (
                    <tr key={label} className="border-t border-cream/10">
                        <th scope="row" className="px-3 py-3 align-top text-[0.6875rem] font-semibold uppercase leading-snug text-cream/60 sm:px-4 sm:text-[0.75rem]">{label}</th>
                        <td className="bg-sun/10 px-3 py-3 align-top text-[0.8125rem] font-medium leading-snug text-cream sm:px-4 sm:text-[0.9375rem]">{a}</td>
                        <td className="px-3 py-3 align-top text-[0.8125rem] leading-snug text-cream/70 sm:px-4 sm:text-[0.9375rem]">{b}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/**
 * "Know your dairy" on the pine band: a row of topic tabs (bilona ghee,
 * bilona vs regular, A2 milk, ghee/butter/makkhan, cow vs buffalo,
 * storage), then the picked topic's explainer beside a sunflower card with
 * its key figure. A proper tablist: arrow keys move between topics, and
 * every panel stays in the HTML (hidden) so the copy is crawlable. On
 * phones the tabs scroll sideways.
 */
const DairyKnowledge = ({ number }) => {
    const uid = useId()
    const tabRefs = useRef([])
    const [active, setActive] = useState(0)
    const count = DAIRY_TOPICS.length

    const onKeyDown = (event) => {
        const moves = { ArrowRight: 1, ArrowLeft: -1 }
        let next = null
        if (event.key in moves) next = (active + moves[event.key] + count) % count
        if (event.key === 'Home') next = 0
        if (event.key === 'End') next = count - 1
        if (next === null) return
        event.preventDefault()
        setActive(next)
        tabRefs.current[next]?.focus()
        tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    return (
        <section id={GUIDE_ANCHOR} className="ef-section ef-section--inverse relative z-[1] scroll-mt-20 text-cream" aria-labelledby="dairy-guide-title">
            <WaveEdge position="top" className="text-[var(--surface-inverse)]" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />

            <div className="ef-container">
                <DairySectionHead
                    number={number}
                    eyebrow="Know your dairy"
                    id="dairy-guide-title"
                    title="The dairy"
                    accent="explained."
                    lead="Bilona, A2, makkhan, cow or buffalo: the words on a dairy label, and what they actually mean for what you buy."
                    inverse
                />

                <div
                    role="tablist"
                    aria-label="Dairy topics"
                    onKeyDown={onKeyDown}
                    className="no-scrollbar -mx-[var(--website-gutter)] flex gap-2 overflow-x-auto px-[var(--website-gutter)] pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
                >
                    {DAIRY_TOPICS.map((topic, i) => (
                        <button
                            key={topic.id}
                            ref={(el) => { tabRefs.current[i] = el }}
                            id={`${uid}-tab-${topic.id}`}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            aria-controls={`${uid}-panel-${topic.id}`}
                            tabIndex={i === active ? 0 : -1}
                            onClick={() => setActive(i)}
                            className={cn(
                                'ef-focus inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[0.8125rem] font-semibold leading-none transition-colors duration-200 motion-reduce:transition-none',
                                i === active
                                    ? 'bg-sun text-sun-ink shadow-elev-2'
                                    : 'bg-cream/[0.06] text-cream/80 ring-1 ring-inset ring-cream/15 hover:bg-cream/10 hover:text-cream'
                            )}
                        >
                            <DairyIcon name={topic.icon} className="size-4" />
                            {topic.label}
                        </button>
                    ))}
                </div>

                {DAIRY_TOPICS.map((topic, i) => (
                    <div
                        key={topic.id}
                        id={`${uid}-panel-${topic.id}`}
                        role="tabpanel"
                        aria-labelledby={`${uid}-tab-${topic.id}`}
                        hidden={i !== active}
                        tabIndex={0}
                        className="ef-focus mt-8 grid gap-[var(--grid-gap)] rounded-tile lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-10"
                    >
                        <div className="min-w-0 duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                            <h3 className="font-header text-[clamp(1.75rem,1.3rem+1.8vw,3rem)] font-semibold uppercase leading-[0.95] text-cream">
                                {topic.title} <span className="text-sun">{topic.accent}</span>
                            </h3>
                            {topic.body.map((paragraph) => (
                                <p key={paragraph} className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-cream/75">{paragraph}</p>
                            ))}
                            {topic.points && <Points points={topic.points} />}
                            {topic.table && <CompareTable columns={topic.columns} rows={topic.table} caption={`${topic.columns[0]} compared with ${topic.columns[1].toLowerCase()}`} />}
                        </div>

                        <aside className="ef-tile flex flex-col justify-between gap-8 self-start bg-sun p-6 text-sun-ink shadow-elev-3 duration-500 animate-in fade-in zoom-in-95 motion-reduce:animate-none sm:p-7" aria-label="Key fact">
                            <div className="flex items-center justify-between gap-3">
                                <span className="ef-seal ef-seal--pine !size-14"><DairyIcon name={topic.icon} /></span>
                                <span aria-hidden="true" className="font-header text-[0.875rem] font-semibold tabular-nums opacity-60">{pad(i + 1)} / {pad(count)}</span>
                            </div>
                            <p>
                                <span className="block font-header text-[clamp(2.25rem,1.8rem+1.8vw,3.25rem)] font-semibold uppercase leading-none">{topic.fact.value}</span>
                                <span className="mt-2 block text-[0.9375rem] leading-snug text-sun-ink/80">{topic.fact.label}</span>
                            </p>
                        </aside>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default DairyKnowledge
