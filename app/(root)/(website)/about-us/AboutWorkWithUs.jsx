'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, Handshake, Mail, Phone, Plus } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { COMPANY } from '@/lib/company'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'
import { AboutMetaRow, AboutTitle } from './AboutUi'

const isExternal = (href) => /^https:\/\//.test(href)

const Cta = ({ href, children, className }) =>
    isExternal(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    ) : (
        <Link href={href} className={className}>{children}</Link>
    )

// The heavy asterisk the reference uses as a paragraph mark.
const Asterisk = ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <g fill="currentColor">
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" />
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" transform="rotate(60 12 12)" />
            <rect x="10.2" y="1" width="3.6" height="22" rx="1.8" transform="rotate(-60 12 12)" />
        </g>
    </svg>
)

/**
 * "Bulk orders, gifting and franchise", after the sports-centre reference's
 * courts section: a seal, a segmented tab bar and the headline across the
 * top; below, a pine card for the chosen tab (photo, title, copy, its
 * button, "1 / 3" with arrows, a big faded number behind), and beside it a
 * small photo of the next tab with a round + that moves to it, an asterisk
 * and the section's description with the direct lines.
 *
 * Proper tabs: arrow keys, Home and End move between them.
 */
const AboutWorkWithUs = ({ content, number }) => {
    const uid = useId()
    const tabRefs = useRef([])
    const [active, setActive] = useState(0)

    const tabs = content.tabs.filter((tab) => tab.label && tab.title)
    if (!tabs.length) return null
    const count = tabs.length
    const index = Math.min(active, count - 1)
    const tab = tabs[index]
    const next = tabs[(index + 1) % count]
    const photo = tab.image?.url ? tab.image : null
    const nextPhoto = next.image?.url ? next.image : null

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
        <Section tone="sunken" aria-labelledby="work-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid items-center gap-5 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-8" data-reveal>
                <span className="ef-seal ef-seal--sun !size-16 max-lg:hidden"><Handshake aria-hidden="true" /></span>
                {count > 1 && (
                    <div
                        role="tablist"
                        aria-label={content.title}
                        className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-surface-card p-1 ring-1 ring-inset ring-line-soft max-lg:order-last lg:justify-self-center"
                    >
                        {tabs.map((item, i) => {
                            const selected = i === index
                            return (
                                <button
                                    key={`${item.label}-${i}`}
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
                                        'ef-focus h-9 shrink-0 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors',
                                        selected ? 'bg-brand text-on-brand shadow-elev-1' : 'text-ink-body hover:text-ink-strong'
                                    )}
                                >
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                )}
                <AboutTitle id="work-title" title={content.title} accent={content.titleAccent} className={cn(count < 2 && 'lg:col-span-2')} />
            </div>

            <div className="mt-[clamp(1.5rem,3.5vw,3rem)] grid gap-[var(--grid-gap)] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-[clamp(1.5rem,3vw,3rem)]">
                <div
                    id={panelId}
                    role={count > 1 ? 'tabpanel' : undefined}
                    aria-labelledby={count > 1 ? tabId(index) : undefined}
                    className="ef-tile ef-on-inverse grid bg-pine p-2.5 text-cream shadow-elev-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:p-3"
                    data-reveal
                >
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-[0.18em] right-3 -z-10 select-none font-header text-[clamp(8rem,18vw,15rem)] font-semibold leading-none text-cream/[0.06]">
                        {pad2(index + 1)}
                    </span>
                    <div className="relative aspect-[16/10] overflow-hidden rounded-card bg-pine-deep sm:aspect-auto sm:min-h-[21rem]">
                        {photo ? (
                            <Image key={photo.url} src={photo.url} alt={photo.alt} fill sizes="(max-width: 640px) 92vw, 30vw" className="object-cover duration-500 animate-in fade-in motion-reduce:animate-none" style={{ objectPosition: photo.position }} />
                        ) : (
                            <span aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ background: 'var(--brand-panel-gradient)' }}>
                                <Handshake className="size-14 text-sun/70" strokeWidth={1.25} />
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col justify-between gap-6 p-4 sm:p-6">
                        <div key={index} className="flex flex-col items-start gap-3 duration-500 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
                            <h3 className="m-0 font-header text-[clamp(1.375rem,1.1rem+1vw,2rem)] font-medium leading-tight text-cream">{tab.title}</h3>
                            {tab.body && <p className="text-[0.9375rem] leading-relaxed text-cream/80">{tab.body}</p>}
                            <Cta href={tab.ctaHref} className="ef-btn ef-btn--ghost-light ef-btn--sm mt-2 rounded-full">
                                {tab.ctaLabel} <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                            </Cta>
                        </div>
                        {count > 1 && (
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[0.8125rem] font-semibold tabular-nums text-cream/70">
                                    {index + 1} <span className="opacity-60">/ {count}</span>
                                </span>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => select(index - 1)} className="ef-icon-btn !size-10 border-cream/25 bg-transparent text-cream hover:!border-cream hover:!bg-cream hover:!text-pine" aria-label="Previous">
                                        <ArrowLeft aria-hidden="true" />
                                    </button>
                                    <button type="button" onClick={() => select(index + 1)} className="ef-icon-btn !size-10 border-cream/25 bg-transparent text-cream hover:!border-cream hover:!bg-cream hover:!text-pine" aria-label="Next">
                                        <ArrowRight aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="flex min-w-0 flex-col gap-6 lg:pt-4" aria-label="More about working with us" data-reveal>
                    {count > 1 && (
                        <div className="relative ml-6 w-fit max-w-full">
                            <button
                                type="button"
                                onClick={() => select(index + 1)}
                                className="ef-focus absolute -left-6 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand shadow-elev-2 ring-4 ring-surface-sunken transition-transform hover:rotate-90 motion-reduce:transition-none"
                                aria-label={`Show ${next.label}`}
                            >
                                <Plus className="size-5" aria-hidden="true" />
                            </button>
                            <div className="relative h-36 w-[min(15rem,70vw)] overflow-hidden rounded-tile bg-pine shadow-elev-1 sm:h-40">
                                {nextPhoto ? (
                                    <Image key={nextPhoto.url} src={nextPhoto.url} alt="" fill sizes="15rem" className="object-cover" style={{ objectPosition: nextPhoto.position }} />
                                ) : (
                                    <span aria-hidden="true" className="absolute inset-0" style={{ background: 'var(--brand-panel-gradient)' }} />
                                )}
                                <span className="absolute bottom-2 right-2 inline-flex h-7 items-center rounded-full bg-pine-deep/45 px-3 text-[0.6875rem] font-semibold text-cream backdrop-blur">
                                    Next: {next.label}
                                </span>
                            </div>
                        </div>
                    )}
                    <Asterisk className="size-7 text-brand-bright" />
                    {content.description && <p className="ef-lead max-w-md">{content.description}</p>}
                    <div className="flex flex-col gap-2.5 text-[0.9375rem] text-ink-strong">
                        <a href={COMPANY.phoneHref} className="ef-focus inline-flex w-fit items-center gap-2.5 rounded-sm transition-colors hover:text-brand-bright">
                            <Phone className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.phone}
                        </a>
                        <a href={`mailto:${COMPANY.email}`} className="ef-focus inline-flex w-fit items-center gap-2.5 break-all rounded-sm transition-colors hover:text-brand-bright">
                            <Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}
                        </a>
                    </div>
                </aside>
            </div>
        </Section>
    )
}

export default AboutWorkWithUs
