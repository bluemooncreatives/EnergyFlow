'use client'

import { useId, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { GiftSectionHead, pad } from './GiftingUi'

/**
 * The "match schedule" layout from the gifting references, used by the
 * collection:
 *
 *   [(03) Schedule] ─────────────────────────────────────────────
 *   Accent line:                     01. Open item         [thumb]
 *   Headline                             short copy
 *   short lead                           (View details)
 *   ┌──────────── photo ───────┐     02. Next item              (›)
 *   └──────────────────────────┘     03. Next item              (›)
 *                                                       [Join us ↗]
 *
 * One item is open at a time; the open one shows its copy, its action and a
 * thumbnail top-right, the rest a small round chevron. Closed copy stays in
 * the HTML but is collapsed and inert.
 *
 * items — [{ key, title, body, action?, thumb?: { src, alt, position } }]
 * photo — (openIndex) => { src, alt, position } | null, the left photo
 * cta   — the dark pill under the list (an element)
 */
const GiftSchedule = ({ id, tone = 'page', number, eyebrow, kicker, title, lead, photo, items, cta, onOpen }) => {
    const rootRef = useRef(null)
    const uid = useId()
    const [open, setOpen] = useState(0)
    useReveal(rootRef, [items.length])

    if (!items.length) return null
    const art = photo?.(open < 0 ? 0 : open) || null

    const toggle = (i) => {
        const next = i === open ? -1 : i
        setOpen(next)
        onOpen?.(next)
    }

    return (
        <section
            ref={rootRef}
            id={id}
            className={cn('ef-section scroll-mt-20', tone === 'sunken' ? 'ef-section--sunken' : 'ef-section--page')}
            aria-labelledby={`${uid}-title`}
        >
            <div className="ef-container">
                <GiftSectionHead number={number} eyebrow={eyebrow} />

                <div className="grid gap-[clamp(2rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                    {/* ── Left: accent line, headline, lead, photo ── */}
                    <div className="flex min-w-0 flex-col gap-4" data-reveal>
                        <h2 id={`${uid}-title`} className="m-0 font-header text-[clamp(1.875rem,1.3rem+2.2vw,3.25rem)] font-medium leading-[1.05] text-ink-strong [text-wrap:balance] [overflow-wrap:anywhere]">
                            {kicker && <span className="block text-brand-bright">{kicker}</span>}
                            {title}
                        </h2>
                        {lead && <p className="max-w-sm text-[0.8125rem] leading-relaxed text-ink-muted">{lead}</p>}
                        {art && (
                            <div className="ef-tile relative mt-[clamp(1rem,3vw,2.5rem)] aspect-[16/10] w-full max-w-md bg-surface-well lg:mt-auto">
                                <Image
                                    key={art.src}
                                    src={art.src}
                                    alt={art.alt || ''}
                                    fill
                                    sizes="(max-width: 1024px) 92vw, 28rem"
                                    className="object-cover duration-500 animate-in fade-in motion-reduce:animate-none"
                                    style={{ objectPosition: art.position || 'center' }}
                                />
                            </div>
                        )}
                    </div>

                    {/* ── Right: the indexed list ── */}
                    <div className="min-w-0" data-reveal>
                        <ol className="list-none border-t border-line-soft p-0">
                            {items.map((item, i) => {
                                const isOpen = i === open
                                const panelId = `${uid}-item-${i}`
                                const buttonId = `${uid}-item-${i}-button`
                                return (
                                    <li key={item.key} className="group/row relative border-b border-line-soft">
                                        {item.thumb && (
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'pointer-events-none absolute right-0 top-4 z-10 hidden aspect-[4/3] w-32 origin-top-right overflow-hidden rounded-card bg-surface-well shadow-elev-2 transition-[opacity,transform] duration-300 ease-out sm:block lg:w-36 motion-reduce:transition-none',
                                                    // Pops up while the open row is hovered (or focused).
                                                    isOpen
                                                        ? 'translate-y-1 scale-90 opacity-0 group-focus-within/row:translate-y-0 group-focus-within/row:scale-100 group-focus-within/row:opacity-100 group-hover/row:translate-y-0 group-hover/row:scale-100 group-hover/row:opacity-100'
                                                        : 'scale-90 opacity-0'
                                                )}
                                            >
                                                <Image src={item.thumb.src} alt="" fill sizes="9rem" className={cn('object-cover', item.thumb.zoom && 'scale-[1.9]')} style={{ objectPosition: item.thumb.position || 'center' }} />
                                            </span>
                                        )}
                                        <h3 className="m-0">
                                            <button
                                                id={buttonId}
                                                type="button"
                                                aria-expanded={isOpen}
                                                aria-controls={panelId}
                                                onClick={() => toggle(i)}
                                                className={cn(
                                                    'ef-focus group flex w-full items-baseline gap-3 rounded-sm py-4 text-left sm:gap-4',
                                                    isOpen && item.thumb && 'sm:pr-40 lg:pr-44'
                                                )}
                                            >
                                                <span className="w-7 shrink-0 text-[0.75rem] tabular-nums text-ink-muted">{pad(i + 1)}.</span>
                                                <span className="min-w-0 flex-1 font-header text-[clamp(1.25rem,1rem+0.8vw,1.75rem)] font-medium leading-tight text-ink-strong [overflow-wrap:anywhere]">
                                                    {item.title}
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'grid size-8 shrink-0 self-center place-items-center rounded-full bg-surface-sunken text-ink-strong ring-1 ring-inset ring-line-soft transition-[opacity,transform,background-color] duration-300 group-hover:bg-brand group-hover:text-on-brand motion-reduce:transition-none',
                                                        isOpen ? 'rotate-90 opacity-0' : 'opacity-100'
                                                    )}
                                                >
                                                    <ChevronRight className="size-4" />
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
                                                <div className={cn('flex flex-col items-start gap-3.5 pb-5 pl-10 sm:pl-11', item.thumb && 'sm:min-h-[5.5rem] sm:pr-40 lg:pr-44')}>
                                                    {item.body && <div className="max-w-md text-[0.8125rem] leading-relaxed text-ink-muted">{item.body}</div>}
                                                    {item.action}
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>

                        {cta && <div className="mt-6 flex justify-end">{cta}</div>}
                    </div>
                </div>
            </div>
        </section>
    )
}

// The reference's "Join us ↗" pill: dark, with the arrow in a light disc.
export const SCHEDULE_PILL = 'ef-focus group inline-flex min-h-11 items-center gap-3 rounded-full bg-brand py-1.5 pl-5 pr-1.5 text-[0.8125rem] font-semibold uppercase text-on-brand shadow-elev-1 transition-colors hover:bg-brand-hover'

export const PillArrow = () => (
    <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-cream text-pine transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none">
        <ArrowUpRight className="size-4" />
    </span>
)

export default GiftSchedule
