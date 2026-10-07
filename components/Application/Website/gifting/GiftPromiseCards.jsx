'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { EnquireButton } from './GiftingSelection'
import { SectionTag, pad, pickImage } from './GiftingUi'

// Photo-less cards take a fixed palette fill, cycled so neighbours differ.
const FILLS = ['bg-pine text-cream', 'bg-sun text-sun-ink', 'bg-forest text-cream', 'bg-olive text-cream']

// The large card's height; the details column matches it on desktop.
const STAGE_HEIGHT = 'h-[clamp(24rem,36vw,32rem)]'
const STAGE_HEIGHT_LG = 'lg:h-[clamp(24rem,36vw,32rem)]'

// A neighbouring promise as a small tile, styled like the occasions band's
// "Up next" card; picking it brings it centre stage.
const SideTile = ({ item, art, index, label, onPick }) => (
    <button
        type="button"
        onClick={onPick}
        className={cn(
            'ef-tile ef-focus group relative flex aspect-[4/5] w-full flex-col justify-end p-4 text-left shadow-elev-2',
            art ? 'bg-pine-deep text-cream' : FILLS[index % FILLS.length]
        )}
        aria-label={`${label}: ${item.title}`}
    >
        {art ? (
            <>
                <Image
                    src={art.src}
                    alt=""
                    fill
                    sizes="18rem"
                    className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
                    style={{ objectPosition: art.position }}
                />
                <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/90 via-pine-deep/25 to-transparent" />
            </>
        ) : (
            <span aria-hidden="true" className="absolute left-4 top-3 font-header text-[3rem] font-semibold leading-none opacity-20">
                {pad(index + 1)}
            </span>
        )}
        <span
            aria-hidden="true"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-cream text-pine transition-transform duration-300 group-hover:rotate-45 motion-reduce:transition-none"
        >
            <ArrowUpRight className="size-4" />
        </span>
        <span className="block text-[0.6875rem] font-semibold uppercase leading-tight opacity-75">{label}</span>
        <span className="mt-1 block font-header text-[1rem] font-semibold uppercase leading-[1.05] [overflow-wrap:anywhere]">{item.title}</span>
    </button>
)

/**
 * "For teams & brands" as a product-style showcase: the numbered label with
 * a row of promise chips, the headline beside its note, then a stage of the
 * previous promise, the picked one on a large photo card (with a button
 * that starts a brief), its details under a "01 / 04" pager, and the next
 * promise, all sitting on one baseline. On phones the stage is the large
 * card and its details.
 */
const GiftPromiseCards = ({ content, photos = [], number }) => {
    const rootRef = useRef(null)
    const touchRef = useRef(null)
    const [active, setActive] = useState(0)
    useReveal(rootRef, [content.items.length])

    const items = content.items.filter((item) => item.title)
    if (!items.length) return null

    const count = items.length
    const current = Math.min(active, count - 1)
    const prev = (current - 1 + count) % count
    const next = (current + 1) % count
    const item = items[current]
    const tags = (item.tags || []).filter(Boolean)
    const step = (by) => setActive((current + by + count) % count)

    const arts = items.map((entry, i) => pickImage(entry.image, photos, i + 2))
    const art = arts[current]
    // Promises sharing a photo share one <Image>, so a switch only
    // cross-fades when the picture really changes.
    const frames = [...new Map(arts.filter(Boolean).map((entry) => [entry.src, entry])).values()]

    const onTouchStart = (event) => { touchRef.current = event.touches[0].clientX }
    const onTouchEnd = (event) => {
        if (touchRef.current == null) return
        const dx = event.changedTouches[0].clientX - touchRef.current
        touchRef.current = null
        if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1)
    }

    return (
        <section ref={rootRef} className="ef-section ef-section--page overflow-hidden" aria-labelledby="promise-title">
            <div className="ef-container">
                {/* Label and the promise chips */}
                <div className="mb-8 flex flex-col gap-4 border-t border-line-strong pt-5 sm:mb-10 sm:pt-6 lg:flex-row lg:items-center lg:justify-between">
                    <SectionTag number={number} eyebrow={content.eyebrow} />
                    {count > 1 && (
                        <div
                            role="group"
                            aria-label="What you get"
                            className="no-scrollbar -mx-[var(--website-gutter)] flex gap-2 overflow-x-auto px-[var(--website-gutter)] lg:mx-0 lg:flex-wrap lg:justify-end lg:px-0"
                        >
                            {items.map((entry, i) => (
                                <button
                                    key={`${entry.title}-${i}`}
                                    type="button"
                                    onClick={() => setActive(i)}
                                    aria-pressed={i === current}
                                    className={cn(
                                        'ef-focus shrink-0 rounded-[var(--radius-control)] px-3.5 py-2 text-[0.8125rem] font-medium leading-tight transition-colors duration-200 motion-reduce:transition-none',
                                        i === current
                                            ? 'bg-brand text-on-brand shadow-elev-1'
                                            : 'bg-surface-card text-ink-strong ring-1 ring-inset ring-line-soft hover:ring-line-strong'
                                    )}
                                >
                                    {entry.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Headline beside its note */}
                <div className="mb-[var(--section-gap)] grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-10" data-reveal>
                    <h2 id="promise-title" className="ef-title">
                        {content.title}
                        {content.titleAccent && <> <span className="ef-title__accent">{content.titleAccent}</span></>}
                    </h2>
                    {content.note && <p className="max-w-sm text-[0.9375rem] leading-relaxed text-ink-muted lg:justify-self-end lg:pb-2">{content.note}</p>}
                </div>

                {/* The stage: previous · picked · details · next, on one baseline */}
                <div
                    className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2.2fr)] lg:items-end lg:gap-[var(--grid-gap)]"
                    data-reveal
                >
                    {count > 1 && (
                        <div className="max-lg:hidden">
                            <SideTile item={items[prev]} art={arts[prev]} index={prev} label="Previous" onPick={() => setActive(prev)} />
                        </div>
                    )}

                    {/* The picked promise, large */}
                    <div
                        className={cn('ef-tile relative w-full shadow-elev-2 lg:col-start-2', STAGE_HEIGHT, art ? 'bg-surface-well' : FILLS[current % FILLS.length])}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        {frames.map((frame) => (
                            <Image
                                key={frame.src}
                                src={frame.src}
                                alt={frame.src === art?.src ? frame.alt : ''}
                                fill
                                sizes="(max-width: 1024px) 100vw, 34vw"
                                className={cn(
                                    '-z-10 object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
                                    frame.src === art?.src ? 'opacity-100' : 'opacity-0'
                                )}
                                style={{ objectPosition: frame.position }}
                            />
                        ))}
                        {art ? (
                            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-pine-deep/45 to-transparent" />
                        ) : (
                            <span aria-hidden="true" className="absolute left-5 top-3 font-header text-[clamp(5rem,4rem+4vw,8rem)] font-semibold leading-none opacity-15">
                                {pad(current + 1)}
                            </span>
                        )}

                        {tags[0] && (
                            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-cream/90 px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase leading-none text-pine shadow-elev-1 backdrop-blur sm:left-5 sm:top-5">
                                <span aria-hidden="true" className="size-1.5 rounded-full bg-sun ring-1 ring-olive" />
                                {tags[0]}
                            </span>
                        )}

                        {/* Starts a brief, after the reference's "Buy now" bar */}
                        <EnquireButton
                            className="ef-cta ef-cta--accent absolute bottom-4 left-4 shadow-elev-2 sm:bottom-5 sm:left-5"
                            aria-label={`Start a brief: ${item.title}`}
                        >
                            Start a brief
                            <span className="ef-cta__box"><ArrowRight aria-hidden="true" /></span>
                        </EnquireButton>
                    </div>

                    {/* Pager over a hairline, then the picked promise's details */}
                    <div className={cn('flex min-w-0 flex-col lg:col-start-3 lg:justify-between', STAGE_HEIGHT_LG)}>
                        {count > 1 && (
                            <div className="order-last mt-6 flex items-center justify-between gap-4 lg:order-first lg:mt-0 lg:border-b lg:border-line-soft lg:pb-5">
                                <p className="flex items-baseline gap-1 tabular-nums">
                                    <span className="font-header text-[1.375rem] font-semibold leading-none text-ink-strong">{pad(current + 1)}</span>
                                    <span className="text-[0.8125rem] font-semibold text-ink-muted">/ {pad(count)}</span>
                                </p>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="ef-icon-btn min-h-11 min-w-11" onClick={() => step(-1)} aria-label="Previous promise">
                                        <ArrowLeft aria-hidden="true" />
                                    </button>
                                    <button type="button" className="ef-icon-btn min-h-11 min-w-11" onClick={() => step(1)} aria-label="Next promise">
                                        <ArrowRight aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex min-w-0 flex-col items-start" aria-live="polite">
                            <h3 className="font-header text-[clamp(1.625rem,1.3rem+1.1vw,2.375rem)] font-semibold uppercase leading-[0.95] text-ink-strong [overflow-wrap:anywhere]">
                                {item.title}
                            </h3>
                            {item.copy && <p className="mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-ink-body">{item.copy}</p>}
                            {tags.length > 0 && (
                                <ul className="mt-5 flex list-none flex-wrap gap-1.5 p-0" aria-label="Includes">
                                    {tags.map((tag) => (
                                        <li
                                            key={tag}
                                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-surface-card px-2.5 py-1.5 text-[0.75rem] font-medium leading-none text-ink-strong ring-1 ring-inset ring-line-soft"
                                        >
                                            <Check className="size-3 text-brand" strokeWidth={2.5} aria-hidden="true" />
                                            {tag}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {count > 1 && (
                        <div className="max-lg:hidden lg:col-start-4">
                            <SideTile item={items[next]} art={arts[next]} index={next} label="Up next" onPick={() => setActive(next)} />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default GiftPromiseCards
