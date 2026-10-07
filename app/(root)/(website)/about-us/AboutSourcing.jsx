'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { AboutMetaRow, AboutPager, AboutTitle, PhotoTag } from './AboutUi'

// Two interlocking rings beside the headline: grower and kitchen.
const RingsMark = ({ className }) => (
    <svg viewBox="0 0 48 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
        <circle cx="17" cy="16" r="12" />
        <circle cx="31" cy="16" r="12" />
    </svg>
)

/**
 * "How we work": the journey from grower to kitchen, one step at a time.
 * Each part has one job:
 * - the stepper picks a step and shows progress: numbered stops on a line
 *   that fills as you go (done stops ticked), with how far the pack still
 *   has to travel beside its label;
 * - the step card says what happens there and steps on with the pager;
 * - the photo shows that step (each step's own photo cross-fades in), and a
 *   "Next stop" card on it moves along — on the last step it hands over to
 *   the shop, because the next stop is your kitchen.
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
    const last = index === count - 1
    const next = last ? null : steps[index + 1]
    const remaining = count - 1 - index
    const distance = last ? 'Last stop: your kitchen' : `${remaining} more ${remaining === 1 ? 'stage' : 'stages'} to your kitchen`

    // Each step's own photo, else the section's. Steps sharing a photo share
    // one <Image>, so a switch only cross-fades when the picture changes.
    const fallback = content.image?.url ? content.image : null
    const arts = steps.map((item) => (item.image?.url ? item.image : fallback))
    const photo = arts[index]
    const frames = [...new Map(arts.filter(Boolean).map((art) => [art.url, art])).values()]

    const select = (i, focus = false) => {
        const target = Math.max(0, Math.min(i, count - 1))
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

    // The stepper line runs between the first and last stop's centres.
    const inset = `calc(100% / ${2 * count})`
    const span = `calc(100% - 100% / ${count})`

    return (
        <Section tone={tone} id="how-we-work" aria-labelledby="sourcing-title">
            <AboutMetaRow label={content.eyebrow} number={number} />

            <div className="grid gap-[clamp(1.75rem,3.5vw,3.5rem)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
                <div className="flex min-w-0 flex-col gap-[clamp(1.5rem,3vw,2.5rem)]">
                    <div className="flex flex-col gap-4" data-reveal>
                        <div className="flex items-start gap-5">
                            <AboutTitle id="sourcing-title" title={content.title} accent={content.titleAccent} className="min-w-0" />
                            <RingsMark className="mt-[0.5em] hidden h-8 w-12 shrink-0 text-brand sm:block" />
                        </div>
                        {content.lead && <p className="ef-lead max-w-xl">{content.lead}</p>}
                    </div>

                    {/* Stepper: picks a step, shows the way travelled */}
                    {count > 1 && (
                        <div className="flex flex-col gap-4" data-reveal>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                <p className="m-0 text-[0.75rem] font-semibold uppercase text-ink-muted">{content.photoEyebrow || 'Source to home'}</p>
                                <p key={index} className="m-0 text-[0.8125rem] font-medium text-brand-bright duration-500 animate-in fade-in motion-reduce:animate-none">{distance}</p>
                            </div>
                            <div
                                role="tablist"
                                aria-label={content.title}
                                className="relative grid"
                                style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
                            >
                                <span aria-hidden="true" className="absolute top-[1.1875rem] h-0.5 rounded-full bg-line-strong" style={{ left: inset, width: span }} />
                                <span
                                    aria-hidden="true"
                                    className="absolute top-[1.1875rem] h-0.5 rounded-full bg-brand transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                                    style={{ left: inset, width: `calc(${span} * ${index / (count - 1)})` }}
                                />
                                {steps.map((item, i) => {
                                    const selected = i === index
                                    const done = i < index
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
                                            className="ef-focus group relative flex min-w-0 flex-col items-center gap-2.5 rounded-[var(--radius-control)] px-1 text-center"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'grid size-10 place-items-center rounded-full text-[0.75rem] font-semibold tabular-nums transition-[background-color,color,box-shadow] duration-300 motion-reduce:transition-none',
                                                    selected && 'bg-brand text-on-brand shadow-[0_0_0_4px_var(--section-bg),0_0_0_6px_var(--brand-primary-bright)]',
                                                    done && 'bg-brand text-on-brand shadow-[0_0_0_4px_var(--section-bg)]',
                                                    !selected && !done && 'bg-surface-card text-ink-muted shadow-[0_0_0_4px_var(--section-bg),inset_0_0_0_1px_var(--line-strong)] group-hover:text-ink-strong'
                                                )}
                                            >
                                                {done ? <Check className="size-4" strokeWidth={2.5} /> : pad2(i + 1)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[0.75rem] leading-tight [overflow-wrap:anywhere] [text-wrap:balance] transition-colors sm:text-[0.8125rem]',
                                                    selected ? 'font-semibold text-ink-strong' : done ? 'font-medium text-brand-bright' : 'font-medium text-ink-muted group-hover:text-ink-strong'
                                                )}
                                            >
                                                {item.phase || item.title}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* The chosen step */}
                    <div
                        id={panelId}
                        role={count > 1 ? 'tabpanel' : undefined}
                        aria-labelledby={count > 1 ? tabId(index) : undefined}
                        className="ef-card flex flex-col gap-5 p-5 shadow-elev-1 sm:p-6 lg:mt-auto"
                        data-reveal
                    >
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
                                prevDisabled={index === 0}
                                nextDisabled={last}
                                noun="step"
                                className="justify-between border-t border-line-soft pt-4"
                            />
                        )}
                    </div>
                </div>

                {/* The step's photo */}
                <figure
                    className="ef-tile relative m-0 flex min-h-[26rem] flex-col justify-between bg-pine p-4 text-cream shadow-elev-2 sm:min-h-[34rem] sm:p-5"
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
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/85 via-pine-deep/10 to-transparent" />

                    {step.phase ? (
                        <PhotoTag key={`tag-${index}`} className="self-start tabular-nums duration-500 animate-in fade-in motion-reduce:animate-none">
                            {pad2(index + 1)} · {step.phase}
                        </PhotoTag>
                    ) : <span />}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        {content.photoTitle && (
                            <figcaption className="max-w-[15rem] font-header text-[clamp(1.25rem,1rem+0.9vw,1.75rem)] font-medium leading-tight [text-wrap:balance]">
                                {content.photoTitle}
                            </figcaption>
                        )}

                        {next ? (
                            <button
                                type="button"
                                onClick={() => select(index + 1)}
                                className="ef-focus group flex w-full items-center gap-3 rounded-card bg-surface-card p-3 pl-4 text-left text-ink-strong shadow-elev-2 sm:w-auto sm:min-w-[13rem]"
                                aria-label={`Next stop: ${next.phase || next.title}`}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[0.625rem] font-semibold uppercase leading-tight text-ink-muted">Next stop</span>
                                    <span key={index} className="mt-1 block truncate text-[0.875rem] font-semibold leading-tight duration-500 animate-in fade-in motion-reduce:animate-none">
                                        {next.phase || next.title}
                                    </span>
                                </span>
                                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none">
                                    <ArrowRight className="size-4" />
                                </span>
                            </button>
                        ) : (
                            <Link
                                href={WEBSITE_SHOP}
                                className="ef-focus group flex w-full items-center gap-3 rounded-card bg-surface-card p-3 pl-4 text-ink-strong shadow-elev-2 sm:w-auto sm:min-w-[13rem]"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[0.625rem] font-semibold uppercase leading-tight text-ink-muted">Your kitchen</span>
                                    <span className="mt-1 block truncate text-[0.875rem] font-semibold leading-tight">Shop the range</span>
                                </span>
                                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-on-brand transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none">
                                    <ArrowUpRight className="size-4" />
                                </span>
                            </Link>
                        )}
                    </div>
                </figure>
            </div>
        </Section>
    )
}

export default AboutSourcing
