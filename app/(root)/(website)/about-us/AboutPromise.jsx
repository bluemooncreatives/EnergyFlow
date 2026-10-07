import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, HandCoins, Leaf, PackageCheck, ShieldCheck, Sprout, Star, Truck } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { cn } from '@/lib/utils'
import { AboutMetaRow, upperNumber } from './AboutUi'

const PILLAR_ICONS = [Sprout, ShieldCheck, PackageCheck, HandCoins, Truck, Leaf]

/**
 * "Why shoppers stay", after the wellness reference's about block: a tall
 * portrait with a quote over it (and the live review rating under it, once
 * there are enough reviews to mean something), beside the brand's promise
 * as a large quote, its pillars as chips, and a row of a second photo, a
 * line of copy with the shop button, and a card that charts how long an
 * order takes to arrive.
 *
 * rating — { avg, count } when it should show, else null
 */
const AboutPromise = ({ content, number, rating }) => {
    const photo = content.photo?.url ? content.photo : null
    const second = content.secondaryPhoto?.url ? content.secondaryPhoto : null
    const pillars = content.pillars.filter(Boolean)
    const timeline = content.timeline.filter((row) => row.label && row.value)
    const longest = Math.max(0, ...timeline.map((row) => upperNumber(row.value) || 0))
    const [headline, ...rows] = timeline

    return (
        <Section tone="page" aria-labelledby="promise-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid gap-[clamp(1.25rem,3vw,3rem)] lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
                {/* ── Portrait ── */}
                <div className="flex min-w-0 flex-col gap-3" data-reveal>
                    <figure className="ef-tile relative m-0 aspect-[4/5] bg-pine shadow-elev-2 max-lg:max-h-[34rem] lg:aspect-auto lg:min-h-[32rem] lg:flex-1">
                        {photo ? (
                            <Image
                                src={photo.url}
                                alt={photo.alt}
                                fill
                                sizes="(max-width: 1024px) 92vw, 30vw"
                                className="-z-10 object-cover"
                                style={{ objectPosition: photo.position }}
                            />
                        ) : (
                            <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />
                        )}
                        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/70 via-transparent to-transparent" />
                        {content.photoQuote && (
                            <figcaption className="absolute inset-x-3 bottom-3 rounded-card bg-pine-deep/55 p-4 text-[0.9375rem] font-medium leading-snug text-cream backdrop-blur-md sm:inset-x-4 sm:bottom-4">
                                “{content.photoQuote}”
                            </figcaption>
                        )}
                    </figure>
                    {rating && (
                        <p className="flex items-center gap-2 text-[0.8125rem] text-ink-muted">
                            <Star className="size-4 fill-sun text-olive" aria-hidden="true" />
                            <span><strong className="font-semibold text-ink-strong">{rating.avg.toFixed(1)}</strong> average from {rating.count.toLocaleString('en-IN')} customer reviews</span>
                        </p>
                    )}
                </div>

                {/* ── The promise ── */}
                <div className="flex min-w-0 flex-col gap-[clamp(1.5rem,3vw,2.5rem)]">
                    <h2
                        id="promise-title"
                        className="m-0 font-header text-[clamp(1.5rem,1.05rem+2vw,3rem)] font-medium leading-[1.12] text-ink-strong [text-wrap:balance]"
                        data-reveal
                    >
                        <span aria-hidden="true" className="text-brand-bright">“</span>{content.statement}<span aria-hidden="true" className="text-brand-bright">”</span>
                    </h2>

                    {pillars.length > 0 && (
                        <ul className="flex flex-wrap gap-2" aria-label="Our promises" data-reveal>
                            {pillars.map((pillar, i) => {
                                const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length]
                                return (
                                    <li key={`${pillar}-${i}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-card py-1.5 pl-1.5 pr-4 text-[0.8125rem] font-medium text-ink-strong ring-1 ring-inset ring-line-soft">
                                        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-tint-pistachio text-brand-bright">
                                            <Icon className="size-3.5" />
                                        </span>
                                        {pillar}
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    <div className="mt-auto grid gap-[var(--grid-gap)] sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
                        {second && (
                            <div className="ef-tile relative aspect-[4/3] bg-surface-well shadow-elev-1 sm:aspect-auto sm:min-h-[14rem]" data-reveal>
                                <Image src={second.url} alt={second.alt} fill sizes="(max-width: 640px) 92vw, (max-width: 1280px) 40vw, 20vw" className="object-cover" style={{ objectPosition: second.position }} />
                            </div>
                        )}

                        {(content.secondaryText || content.ctaLabel) && (
                            <div className={cn('flex flex-col justify-between gap-5 py-1', !second && 'sm:col-span-2')} data-reveal>
                                {content.secondaryText && <p className="text-[0.9375rem] leading-relaxed text-ink-body">{content.secondaryText}</p>}
                                {content.ctaLabel && (
                                    <Link href={content.ctaHref} className="ef-cta self-start">
                                        <span>{content.ctaLabel}</span>
                                        <span className="ef-cta__box" aria-hidden="true"><ArrowRight /></span>
                                    </Link>
                                )}
                            </div>
                        )}

                        {headline && (
                            <div className="flex flex-col gap-4 rounded-tile bg-tint-pistachio p-5 ring-1 ring-inset ring-line-soft sm:col-span-2 xl:col-span-1" data-reveal>
                                <div className="flex items-start justify-between gap-3">
                                    <p className="text-[0.6875rem] font-semibold uppercase text-ink-muted">{content.timelineTitle}</p>
                                    <Truck className="size-4 text-brand-bright" aria-hidden="true" />
                                </div>
                                <p className="flex flex-col">
                                    <span className="font-header text-[clamp(1.875rem,1.5rem+1vw,2.5rem)] font-semibold leading-none text-ink-strong">{headline.value}</span>
                                    <span className="mt-1 text-[0.8125rem] text-ink-body">{headline.label}</span>
                                </p>
                                {rows.length > 0 && (
                                    <dl className="flex flex-col gap-2.5">
                                        {rows.map((row, i) => {
                                            const days = upperNumber(row.value)
                                            const share = longest && days ? Math.max(14, (days / longest) * 100) : 100
                                            return (
                                                <div key={`${row.label}-${i}`} className="flex flex-col gap-1.5">
                                                    <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
                                                        <dt className="text-ink-body">{row.label}</dt>
                                                        <dd className="font-semibold tabular-nums text-ink-strong">{row.value}</dd>
                                                    </div>
                                                    <span aria-hidden="true" className="block h-2 overflow-hidden rounded-full bg-surface-card">
                                                        <span className={cn('block h-full rounded-full', i % 2 ? 'bg-brand-bright' : 'bg-brand')} style={{ width: `${share}%` }} />
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </dl>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Section>
    )
}

export default AboutPromise
