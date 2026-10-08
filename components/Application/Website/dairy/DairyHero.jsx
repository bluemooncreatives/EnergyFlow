'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, ChevronRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { jumpTo } from '../gifting/GiftingSelection'
import { DairyIcon } from './DairyUi'
import { GUIDE_ANCHOR, RANGE_ANCHOR } from './dairyContent'

const BADGE_TEXT = 'Pure desi dairy · Small batch · A2 · '

// The ring of text that turns slowly beside the arch.
const SpinningBadge = () => (
    <span
        aria-hidden="true"
        className="absolute -left-2 -top-2 z-20 grid size-[6.5rem] place-items-center rounded-full bg-pine text-cream shadow-elev-2 sm:-left-4 sm:-top-4 sm:size-32"
    >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full motion-safe:animate-[ef-nl-spin_22s_linear_infinite]">
            <defs>
                <path id="dairy-badge-ring" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
            </defs>
            <text className="fill-current text-[8.6px] font-semibold uppercase" style={{ letterSpacing: '0.12em' }}>
                <textPath href="#dairy-badge-ring">{BADGE_TEXT}</textPath>
            </text>
        </svg>
        <DairyIcon name="milk" className="size-7 text-sun sm:size-8" />
    </span>
)

/**
 * The dairy aisle's hero: the <h1> set large with its lead, the two ways
 * in (shop the aisle / know your dairy) and three facts about the aisle;
 * on the right the category's cover photo in an arch on a sunflower disc,
 * up to two product photos as round insets, and a slowly turning badge.
 * Without a cover the first product photo takes the arch. A faint "दूध"
 * (milk) sits behind it all.
 *
 * cover  — the category cover from the admin: { src, alt, position } | null
 * photos — the products' first photos: [{ src, alt }]
 */
const DairyHero = ({ title, cover = null, photos = [], total = 0 }) => {
    const main = cover || photos[0] || null
    const insets = cover ? photos : photos.slice(1)

    const facts = [
        { value: String(total || '—'), label: total === 1 ? 'Product in the aisle' : 'Products in the aisle' },
        { value: 'A2', label: 'Gir cow ghee' },
        { value: '1-2 days', label: 'To pack and dispatch' },
    ]

    return (
        <section className="relative isolate overflow-hidden bg-surface-page pb-[clamp(3rem,6vw,5.5rem)] pt-[5.75rem] sm:pt-[7rem]" aria-labelledby="dairy-title">
            {/* Warm glow and the Devanagari watermark */}
            <span aria-hidden="true" className="pointer-events-none absolute -right-[20%] -top-[10%] -z-10 size-[min(60rem,120vw)] rounded-full bg-[radial-gradient(closest-side,rgb(242_201_76/0.32),transparent)]" />
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-[0.18em] left-[-0.04em] -z-10 select-none font-header text-[clamp(10rem,30vw,26rem)] font-bold leading-none text-ink-strong opacity-[0.04]"
            >
                दूध
            </span>

            <div className="ef-container grid items-center gap-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                {/* ── Copy ── */}
                <div className="flex min-w-0 flex-col items-start">
                    <nav aria-label="Breadcrumb" className="mb-5" data-reveal>
                        <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-ink-muted">
                            <li><Link href="/" className="ef-focus rounded-sm hover:text-brand">Home</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
                            <li><Link href={WEBSITE_SHOP} className="ef-focus rounded-sm hover:text-brand">Shop</Link></li>
                            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
                            <li aria-current="page" className="text-ink-strong">{title}</li>
                        </ol>
                    </nav>

                    <span className="ef-eyebrow" data-reveal>Ghee · A2 · Desi dairy</span>

                    <h1 id="dairy-title" className="mt-5 font-header text-[clamp(2.75rem,1.6rem+5.2vw,6rem)] font-semibold uppercase leading-[0.9] text-ink-strong [text-wrap:balance]" data-reveal>
                        {title}, <span className="text-brand-bright">the desi way.</span>
                    </h1>

                    <p className="ef-lead mt-5 max-w-xl" data-reveal>
                        Pure dairy staples for the Indian kitchen, starting with A2 Gir cow ghee made by the traditional
                        bilona method. Every pack is checked before it leaves us and shipped across India.
                    </p>

                    <div className="mt-7 grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto" data-reveal>
                        <a href={`#${RANGE_ANCHOR}`} onClick={(e) => jumpTo(e, RANGE_ANCHOR)} className="ef-btn ef-btn--primary ef-btn--lg max-sm:!px-3">
                            Shop dairy <ArrowDown aria-hidden="true" />
                        </a>
                        <a href={`#${GUIDE_ANCHOR}`} onClick={(e) => jumpTo(e, GUIDE_ANCHOR)} className="ef-btn ef-btn--outline ef-btn--lg max-sm:!px-3">
                            Know your dairy
                        </a>
                    </div>

                    <dl className="mt-9 grid w-full max-w-xl grid-cols-3 divide-x divide-line-strong border-y border-line-strong" data-reveal>
                        {facts.map((item) => (
                            <div key={item.label} className="flex min-w-0 flex-col-reverse gap-1 px-3 py-4 first:pl-0 sm:px-5">
                                <dt className="text-[0.75rem] leading-snug text-ink-muted sm:text-[0.8125rem]">{item.label}</dt>
                                <dd className="font-header text-[clamp(1.25rem,1rem+1vw,1.875rem)] font-semibold leading-none text-ink-strong">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* ── The aisle in photos ── */}
                <div className="relative mx-auto w-full max-w-[25rem] sm:max-w-[30rem]" data-reveal>
                    <span aria-hidden="true" className="absolute inset-[6%] -z-10 rounded-full bg-sun shadow-elev-3" />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 rounded-full border border-dashed border-olive/50 motion-safe:animate-[ef-nl-spin_60s_linear_infinite]" />

                    <div className="relative mx-auto aspect-[4/5] w-[72%] translate-y-[6%] overflow-hidden rounded-b-[2rem] rounded-t-full border-[6px] border-surface-page bg-surface-well shadow-elev-3">
                        {main ? (
                            <Image src={main.src} alt={main.alt || title} fill priority sizes="(max-width: 640px) 70vw, 22rem" className="object-cover" style={{ objectPosition: main.position || 'center' }} />
                        ) : (
                            <span aria-hidden="true" className="absolute inset-0 grid place-items-center" style={{ background: 'var(--brand-panel-gradient), var(--palette-pine)' }}>
                                <DairyIcon name="milk" className="size-16 text-sun" />
                            </span>
                        )}
                    </div>

                    <SpinningBadge />

                    {insets.slice(0, 2).map((photo, i) => (
                        <span
                            key={photo.src}
                            aria-hidden="true"
                            className={i === 0
                                ? 'absolute -right-1 top-[18%] z-20 size-24 overflow-hidden rounded-full border-4 border-surface-page bg-surface-well shadow-elev-2 sm:size-28'
                                : 'absolute -bottom-1 left-[2%] z-20 size-20 overflow-hidden rounded-full border-4 border-surface-page bg-surface-well shadow-elev-2 sm:size-24'}
                        >
                            <Image src={photo.src} alt="" fill sizes="7rem" className="object-cover" />
                        </span>
                    ))}

                    {insets.length === 0 && (
                        <span className="absolute right-0 top-[12%] z-20 inline-flex items-center gap-1.5 rounded-full bg-surface-card px-3 py-1.5 text-[0.6875rem] font-semibold uppercase text-ink-strong shadow-elev-2 ring-1 ring-inset ring-line-soft motion-safe:animate-[ef-nl-float_6s_ease-in-out_infinite] sm:text-[0.75rem]">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-sun ring-1 ring-olive" />
                            Pure desi dairy
                        </span>
                    )}
                </div>
            </div>
        </section>
    )
}

export default DairyHero
