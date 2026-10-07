'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import Section from '@/components/Application/Website/storefront/Section'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'
import { AboutMetaRow, AboutPager, AboutTitle } from './AboutUi'

// Thin bars in the progress card, after the reference's calorie tracker.
const BARS = 28

// Two interlocking rings beside the headline: grower and kitchen.
const RingsMark = ({ className }) => (
    <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
        <circle cx="17" cy="16" r="12" />
        <circle cx="31" cy="16" r="12" />
    </svg>
)

/**
 * "How we work", after the wellness reference's featured-treatment block:
 * the headline with a ring mark, the lead and a row of phase chips (proper
 * tabs) on the left, then the chosen step as a card — a pine number tile
 * beside its title, copy and "02 / 04" with arrows. On the right, the
 * section photo with a white tracker card on top (the journey as striped
 * bars that fill step by step, origin to kitchen) and the photo title on
 * its foot.
 *
 * content — content.sourcing
 */
const AboutSourcing = ({ content, number, tone = 'page' }) => {
    const uid = useId()
    const tabRefs = useRef([])
    const [active, setActive] = useState(0)

    const steps = content.steps.filter((step) => step.title)
    if (!steps.length) return null

    const count = steps.length
    const index = Math.min(active, count - 1)
    const step = steps[index]
    // Each step's own photo, else the section's. Steps sharing a photo share
    // one <Image>, so a switch only cross-fades when the picture changes.
    const fallback = content.image?.url ? content.image : null
    const arts = steps.map((item) => (item.image?.url ? item.image : fallback))
    const photo = arts[index]
    const frames = [...new Map(arts.filter(Boolean).map((art) => [art.url, art])).values()]
    const filled = Math.round((BARS * (index + 1)) / count)

    const select = (i, focus = false) => {
        const target = (i + count) % count
        setActive(target)
        if (focus) tabRefs.current[target]?.focus()
    }
    const onKeyDown = (event, i) => {
        const moves = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: count - 1 }
        if (event.key in moves) {
            event.preventDefault()
            select(moves[event.key], true)
        }
    }
    const tabId = (i) => `${uid}-tab-${i}`
    const panelId = `${uid}-panel`

    return (
        <Section tone={tone} id="how-we-work" aria-labelledby="sourcing-title">
            <AboutMetaRow label={content.eyebrow} number={number} />

            <div className="grid gap-[clamp(1.5rem,3.5vw,3.5rem)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
                <div className="flex min-w-0 flex-col gap-[clamp(1.25rem,2.5vw,2rem)]">
                    <div className="flex flex-col gap-4" data-reveal>
                        <div className="flex items-start gap-5">
                            <AboutTitle id="sourcing-title" title={content.title} accent={content.titleAccent} className="min-w-0" />
                            <RingsMark className="mt-[0.5em] hidden h-8 w-12 shrink-0 text-brand sm:block" />
                        </div>
                        {content.lead && <p className="ef-lead max-w-xl">{content.lead}</p>}
                        {content.indexLabel && (
                            <p className="text-[0.75rem] font-semibold uppercase text-ink-muted">{content.indexLabel}</p>
                        )}
                    </div>

                    {count > 1 && (
                        <div role="tablist" aria-label={content.title} className="flex flex-wrap gap-2" data-reveal>
                            {steps.map((item, i) => {
                                const selected = i === index
                                return (
                                    <button
                                        key={`${item.title}-${i}`}
                                        ref={(el) => { tabRefs.current[i] = el }}
                                        id={tabId(i)}
                                        type="button"
                                        role="tab"
                                        aria-selected={selected}
                                        aria-controls={panelId}
                                        tabIndex={selected ? 0 : -1}
                                        onClick={() => select(i)}
                                        onKeyDown={(event) => onKeyDown(event, i)}
                                        className={cn(
                                            'ef-focus inline-flex items-center gap-2 rounded-[var(--radius-control)] px-3.5 py-2 text-[0.8125rem] font-medium leading-tight transition-colors duration-200 motion-reduce:transition-none',
                                            selected
                                                ? 'bg-brand text-on-brand shadow-elev-1'
                                                : 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft hover:ring-line-strong'
                                        )}
                                    >
                                        <span className={cn('text-[0.6875rem] font-semibold tabular-nums', selected ? 'opacity-70' : 'text-ink-muted')}>{pad2(i + 1)}</span>
                                        {item.phase || item.title}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* The chosen step */}
                    <div
                        id={panelId}
                        role={count > 1 ? 'tabpanel' : undefined}
                        aria-labelledby={count > 1 ? tabId(index) : undefined}
                        className="ef-card grid gap-4 p-3 shadow-elev-1 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-6 sm:p-4 lg:mt-auto"
                        data-reveal
                    >
                        <div className="relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-card bg-pine p-4 text-cream sm:aspect-auto sm:min-h-[12rem]">
                            <span aria-hidden="true" className="absolute inset-0 -z-0" style={{ background: 'var(--brand-panel-gradient)' }} />
                            <span className="relative text-[0.6875rem] font-semibold uppercase text-cream/70">{step.phase || 'Step'}</span>
                            <span key={index} className="relative font-header text-[clamp(3.5rem,3rem+2vw,5rem)] font-semibold leading-none text-sun duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
                                {pad2(index + 1)}
                            </span>
                        </div>
                        <div className="flex min-w-0 flex-col justify-between gap-5 py-1 sm:pr-2">
                            <div key={index} className="flex flex-col gap-2.5 duration-500 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none" aria-live="polite">
                                <h3 className="m-0 font-header text-[clamp(1.25rem,1.05rem+0.8vw,1.75rem)] font-medium leading-tight text-ink-strong">{step.title}</h3>
                                <p className="text-[0.9375rem] leading-relaxed text-ink-body">{step.body}</p>
                            </div>
                            {count > 1 && (
                                <AboutPager
                                    current={index}
                                    count={count}
                                    onPrev={() => select(index - 1)}
                                    onNext={() => select(index + 1)}
                                    noun="step"
                                    className="justify-between border-t border-line-soft pt-4"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Photo with the journey tracker */}
                <figure
                    className="ef-tile relative m-0 flex min-h-[28rem] flex-col justify-between bg-pine p-3 text-cream shadow-elev-2 sm:min-h-[34rem] sm:p-4"
                    data-reveal
                >
                    {frames.map((frame) => {
                        const shown = frame.url === photo?.url
                        return (
                            <Image
                                key={frame.url}
                                src={frame.url}
                                alt={shown ? frame.alt : ''}
                                fill
                                sizes="(max-width: 1024px) 92vw, 40vw"
                                className={cn(
                                    '-z-20 object-cover transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
                                    shown ? 'scale-100 opacity-100' : 'scale-[1.04] opacity-0'
                                )}
                                style={{ objectPosition: frame.position || 'center' }}
                            />
                        )
                    })}
                    {!photo && (
                        <span aria-hidden="true" className="absolute inset-0 -z-20" style={{ background: 'var(--brand-panel-gradient)' }} />
                    )}
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/80 via-transparent to-transparent" />

                    <div className="w-full max-w-[22rem] rounded-card bg-surface-card p-4 text-ink-strong shadow-elev-2 sm:p-5" aria-hidden="true">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[0.625rem] font-semibold uppercase leading-tight text-ink-muted">{content.photoEyebrow || 'Source to home'}</p>
                                <p className="mt-1.5 truncate font-header text-[1.125rem] font-semibold leading-tight">{step.phase || step.title}</p>
                            </div>
                            <p className="shrink-0 font-header text-[1.75rem] font-semibold leading-none tabular-nums">
                                {pad2(index + 1)}<span className="text-[0.875rem] text-ink-muted">/{pad2(count)}</span>
                            </p>
                        </div>
                        <div className="mt-4 flex h-9 items-end gap-[3px]">
                            {Array.from({ length: BARS }, (_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'h-full flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none',
                                        i < filled ? 'bg-brand' : 'bg-surface-sunken ring-1 ring-inset ring-line-soft'
                                    )}
                                    style={{ transitionDelay: `${i * 12}ms` }}
                                />
                            ))}
                        </div>
                        <div className="mt-2 flex justify-between text-[0.6875rem] font-medium text-ink-muted">
                            <span>{steps[0]?.phase || 'Origin'}</span>
                            <span>Your kitchen</span>
                        </div>
                    </div>

                    {content.photoTitle && (
                        <figcaption className="max-w-xs px-1 pb-1 font-header text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-medium leading-tight [text-wrap:balance]">
                            {content.photoTitle}
                        </figcaption>
                    )}
                </figure>
            </div>
        </Section>
    )
}

export default AboutSourcing
