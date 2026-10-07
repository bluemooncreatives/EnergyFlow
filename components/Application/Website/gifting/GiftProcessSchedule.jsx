'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { EnquireButton } from './GiftingSelection'
import { GiftSectionHead, pad, pickImage } from './GiftingUi'

/**
 * "How bulk orders work", after the reference's match schedule: an accent
 * line over the headline, a short lead and a photo on the left; on the right
 * an indexed list of the steps, one open at a time — the open one shows its
 * detail, what it covers and a photo. A dark pill under the list starts a
 * brief.
 *
 * Every step's copy is in the HTML whether open or not; closed panels are
 * collapsed and inert so keyboards and screen readers skip them.
 */
const GiftProcessSchedule = ({ content, photos = [], number }) => {
    const rootRef = useRef(null)
    const uid = useId()
    const [open, setOpen] = useState(0)
    useReveal(rootRef, [content.items.length])

    const steps = content.items.filter((item) => item.title)
    if (!steps.length) return null
    const lead = pickImage(content.image, photos, 1)

    return (
        <section ref={rootRef} className="ef-section ef-section--sunken" aria-labelledby="process-title">
            <div className="ef-container">
                <GiftSectionHead number={number} eyebrow={content.eyebrow} />

                <div className="grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    <div className="flex min-w-0 flex-col gap-5" data-reveal>
                        <h2 id="process-title" className="ef-title">
                            {content.kicker && <span className="block text-brand-bright">{content.kicker}</span>}
                            {content.title}
                        </h2>
                        {content.description && <p className="ef-lead max-w-md">{content.description}</p>}
                        {lead && (
                            <div className="ef-tile relative mt-auto aspect-[16/10] w-full max-w-md bg-surface-well shadow-elev-1 max-lg:hidden">
                                <Image src={lead.src} alt={lead.alt} fill sizes="(max-width: 1024px) 0px, 28rem" className="object-cover" style={{ objectPosition: lead.position }} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0" data-reveal>
                        <ol className="list-none border-t border-line-strong p-0">
                            {steps.map((step, i) => {
                                const isOpen = i === open
                                const art = pickImage(step.image, photos, i * 2 + 1)
                                const panelId = `${uid}-step-${i}`
                                const buttonId = `${uid}-step-${i}-button`
                                return (
                                    <li key={`${step.title}-${i}`} className="border-b border-line-strong">
                                        <h3>
                                            <button
                                                id={buttonId}
                                                type="button"
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                                onClick={() => setOpen(isOpen ? -1 : i)}
                                                className="ef-focus group flex w-full items-center gap-3 rounded-sm py-4 text-left sm:gap-5 sm:py-5"
                                            >
                                                <span className={cn('w-8 shrink-0 text-[0.8125rem] font-semibold tabular-nums transition-colors', isOpen ? 'text-brand-bright' : 'text-ink-muted')}>
                                                    {pad(i + 1)}.
                                                </span>
                                                <span
                                                    className={cn(
                                                        'min-w-0 flex-1 font-header text-[clamp(1.25rem,1rem+1vw,2rem)] font-semibold uppercase leading-tight transition-colors [overflow-wrap:anywhere]',
                                                        isOpen ? 'text-ink-strong' : 'text-ink-body group-hover:text-ink-strong'
                                                    )}
                                                >
                                                    {step.title}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'grid size-10 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-300 motion-reduce:transition-none',
                                                        isOpen ? 'rotate-180 border-brand bg-brand text-on-brand' : 'border-line-strong bg-surface-card text-ink-strong group-hover:border-brand'
                                                    )}
                                                >
                                                    <ChevronDown className="size-[1.125rem]" />
                                                </span>
                                            </button>
                                        </h3>
                                        <div
                                            id={panelId}
                                            role="region"
                                            aria-labelledby={buttonId}
                                            inert={!isOpen || undefined}
                                            className="grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none"
                                            style={{ gridTemplateRows: isOpen ? '1fr' : '0fr', opacity: isOpen ? 1 : 0 }}
                                        >
                                            <div className="min-h-0 overflow-hidden">
                                                <div className="grid gap-4 pb-6 pl-11 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,11rem)] sm:gap-6 sm:pl-[3.25rem]">
                                                    <div className="flex flex-col gap-4">
                                                        {step.copy && <p className="max-w-xl text-[0.9375rem] leading-relaxed text-ink-body">{step.copy}</p>}
                                                        {step.tags?.length > 0 && (
                                                            <ul className="flex flex-wrap gap-1.5" aria-label="Covers">
                                                                {step.tags.map((tag) => (
                                                                    <li key={tag} className="inline-flex h-8 items-center rounded-full bg-surface-card px-3.5 text-[0.8125rem] font-medium text-ink-strong ring-1 ring-inset ring-line-strong">
                                                                        {tag}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                    {art && (
                                                        <div className="relative aspect-[4/3] w-full max-w-[14rem] overflow-hidden rounded-card bg-surface-well sm:max-w-none">
                                                            <Image src={art.src} alt="" fill sizes="(max-width: 640px) 14rem, 11rem" className="object-cover" style={{ objectPosition: art.position }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>

                        <div className="mt-6 flex justify-end">
                            <EnquireButton className="ef-btn ef-btn--primary">
                                {content.ctaLabel} <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                            </EnquireButton>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default GiftProcessSchedule
