'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Handshake, Mail, Phone, Plus } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { COMPANY } from '@/lib/company'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'
import { AboutMetaRow, AboutPager, AboutTitle, PhotoTag } from './AboutUi'

const isExternal = (href) => /^https:\/\//.test(href)

const Cta = ({ href, children, className }) =>
    isExternal(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    ) : (
        <Link href={href} className={className}>{children}</Link>
    )

// One easing for every card, so the widths trade places in step.
const MOVE = 'duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-0'

/**
 * "Bulk orders, gifting and franchise", after the baseball reference's
 * programmes row: the headline beside the description, then one card per
 * offer in a row. The chosen card grows wide (tags, a large title, copy and
 * its button over the photo); the others shrink to photo tiles with a
 * round + and their label, and picking one swaps the widths with a slide.
 * Phones stack them: the chosen card tall, the rest as slim bars. Under the
 * row, "01 / 03" with arrows and the direct lines.
 */
const AboutWorkWithUs = ({ content, number, tone = 'sunken' }) => {
    const [active, setActive] = useState(0)

    const tabs = content.tabs.filter((tab) => tab.label && tab.title)
    if (!tabs.length) return null

    const count = tabs.length
    const index = Math.min(active, count - 1)
    const select = (i) => setActive((i + count) % count)

    return (
        <Section tone={tone} aria-labelledby="work-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-10" data-reveal>
                <AboutTitle id="work-title" title={content.title} accent={content.titleAccent} />
                {content.description && <p className="ef-lead max-w-md lg:justify-self-end">{content.description}</p>}
            </div>

            <ul
                className="m-0 mt-[clamp(1.5rem,3.5vw,3rem)] flex list-none flex-col gap-[var(--grid-gap)] p-0 lg:h-[clamp(24rem,34vw,30rem)] lg:flex-row"
                aria-label={content.title}
                data-reveal
            >
                {tabs.map((tab, i) => {
                    const open = i === index
                    const photo = tab.image?.url ? tab.image : null
                    return (
                        <li
                            key={`${tab.label}-${i}`}
                            className={cn(
                                'ef-tile relative min-w-0 bg-pine text-cream transition-[flex-grow,height,box-shadow]',
                                MOVE,
                                open ? 'h-[clamp(26rem,110vw,32rem)] shadow-elev-3 lg:h-auto lg:flex-[2.6_1_0%]' : 'h-20 shadow-elev-1 lg:h-auto lg:flex-[1_1_0%]'
                            )}
                        >
                            {photo ? (
                                <Image
                                    src={photo.url}
                                    alt={open ? photo.alt : ''}
                                    fill
                                    sizes="(max-width: 1024px) 92vw, 52vw"
                                    className="-z-20 object-cover"
                                    style={{ objectPosition: photo.position }}
                                />
                            ) : (
                                <span aria-hidden="true" className="absolute inset-0 -z-20 grid place-items-center" style={{ background: 'var(--brand-panel-gradient)' }}>
                                    <Handshake className="size-14 text-sun/60" strokeWidth={1.25} />
                                </span>
                            )}
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'absolute inset-0 -z-10 transition-opacity',
                                    MOVE,
                                    'bg-gradient-to-t from-pine-deep/90 via-pine-deep/35 to-pine-deep/10',
                                )}
                            />
                            <span aria-hidden="true" className={cn('absolute inset-0 -z-10 bg-pine-deep/45 transition-opacity', MOVE, open ? 'opacity-0' : 'opacity-100')} />

                            {open ? (
                                <div
                                    key={`open-${i}`}
                                    className="absolute inset-0 flex flex-col justify-between p-[clamp(1rem,2.2vw,1.75rem)] animate-[slide-up-fade_0.6s_cubic-bezier(0.22,1,0.36,1)_0.2s_both] motion-reduce:animate-none"
                                >
                                    <PhotoTag className="self-start tabular-nums">{pad2(i + 1)} · {tab.label}</PhotoTag>
                                    <div className="flex flex-col items-start gap-4">
                                        <h3 className="m-0 max-w-[14ch] font-header text-[clamp(1.875rem,1.2rem+2.2vw,3.5rem)] font-medium leading-[0.98] [text-wrap:balance]">
                                            {tab.title}
                                        </h3>
                                        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                            {tab.body && <p className="max-w-md text-[0.9375rem] leading-relaxed text-cream/85">{tab.body}</p>}
                                            {tab.ctaLabel && tab.ctaHref && (
                                                <Cta href={tab.ctaHref} className="ef-cta ef-cta--accent shrink-0 shadow-elev-2">
                                                    {tab.ctaLabel}
                                                    <span className="ef-cta__box"><ArrowUpRight aria-hidden="true" /></span>
                                                </Cta>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => select(i)}
                                    className="ef-focus group absolute inset-0 flex items-center justify-between gap-3 p-4 text-left lg:flex-col lg:items-start lg:p-5"
                                    aria-label={`Show ${tab.label}: ${tab.title}`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className="grid size-10 shrink-0 place-items-center rounded-full bg-cream text-pine shadow-elev-1 transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none max-lg:order-last"
                                    >
                                        <Plus className="size-4" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[0.6875rem] font-semibold uppercase tabular-nums text-cream/70">{pad2(i + 1)}</span>
                                        <span className="mt-0.5 block font-header text-[clamp(1.125rem,0.95rem+0.6vw,1.5rem)] font-medium leading-tight [overflow-wrap:anywhere]">{tab.label}</span>
                                    </span>
                                </button>
                            )}
                        </li>
                    )
                })}
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-5 border-t border-line-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
                {count > 1 ? (
                    <AboutPager current={index} count={count} onPrev={() => select(index - 1)} onNext={() => select(index + 1)} noun="offer" />
                ) : <span />}
                <div className="flex flex-col gap-2 text-[0.9375rem] text-ink-strong sm:flex-row sm:items-center sm:gap-6">
                    <a href={COMPANY.phoneHref} className="ef-focus inline-flex w-fit items-center gap-2 rounded-sm transition-colors hover:text-brand-bright">
                        <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" /> {COMPANY.phone}
                    </a>
                    <a href={`mailto:${COMPANY.email}`} className="ef-focus inline-flex w-fit items-center gap-2 break-all rounded-sm transition-colors hover:text-brand-bright">
                        <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" /> {COMPANY.email}
                    </a>
                </div>
            </div>
        </Section>
    )
}

export default AboutWorkWithUs
