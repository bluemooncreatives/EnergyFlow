'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { COMPANY } from '@/lib/company'
import { pad2 } from '@/lib/pageContent/shared'
import { cn } from '@/lib/utils'
import { ABOUT_STATEMENT, AboutMetaRow, DIRECTIONS_HREF, PhotoTag } from './AboutUi'

const DEFAULT_PHOTO = {
    image: { url: COMPANY.storePhoto.src, alt: COMPANY.storePhoto.alt, position: COMPANY.storePhoto.position },
    tag: 'Our store',
    caption: COMPANY.addressLines.join(', '),
}

/**
 * "Come and find us", after the "Summertime" reference's essentials block:
 * on the left the invitation set large and the directions
 * button, with the address and direct lines at the foot; a tall photo in
 * the middle (tag, caption, round ↗ into the map); on the right a ruled
 * list of the photos — tag and caption per row, like the reference's
 * collections — where hovering or picking a row brings its photo up.
 */
const AboutVisit = ({ content, number, tone = 'page' }) => {
    const [active, setActive] = useState(0)

    const listed = content.photos.filter((photo) => photo.image?.url)
    const photos = listed.length ? listed : [DEFAULT_PHOTO]
    const current = Math.min(active, photos.length - 1)
    const photo = photos[current]

    return (
        <Section tone={tone} aria-labelledby="visit-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] md:grid-cols-2 lg:grid-cols-[minmax(0,4.2fr)_minmax(0,4.6fr)_minmax(0,3.2fr)]">
                {/* Invitation and the way in */}
                <div className="flex min-w-0 flex-col justify-between gap-8 md:col-span-2 lg:col-span-1" data-reveal>
                    <div className="flex flex-col items-start gap-5">
                        <h2 id="visit-title" className={ABOUT_STATEMENT}>
                            {content.statement}
                        </h2>
                        <div className="flex flex-wrap gap-2.5">
                            <a href={DIRECTIONS_HREF} target="_blank" rel="noopener noreferrer" className="ef-btn ef-btn--primary">
                                {content.ctaLabel} <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                            </a>
                            <a href={COMPANY.phoneHref} className="ef-btn ef-btn--outline">Call the store</a>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
                        <p className="m-0 font-header text-[1.0625rem] font-medium leading-snug text-ink-strong">Visit the store</p>
                        <address className="flex flex-col gap-2 text-[0.875rem] not-italic leading-relaxed text-ink-body">
                            <span className="inline-flex items-start gap-2">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                                <span>
                                    {COMPANY.storeName}
                                    <br />
                                    {COMPANY.addressLines.join(', ')}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <Phone className="size-4 shrink-0 text-brand" aria-hidden="true" />
                                <a href={COMPANY.phoneHref} className="ef-focus rounded-sm text-ink-strong hover:text-brand-bright">{COMPANY.phone}</a>
                                <span aria-hidden="true" className="text-ink-muted">/</span>
                                <a href={COMPANY.altPhoneHref} className="ef-focus rounded-sm text-ink-strong hover:text-brand-bright">{COMPANY.altPhone}</a>
                            </span>
                            <a href={`mailto:${COMPANY.email}`} className="ef-focus inline-flex w-fit items-center gap-2 break-all rounded-sm text-ink-strong hover:text-brand-bright">
                                <Mail className="size-4 shrink-0 text-brand" aria-hidden="true" /> {COMPANY.email}
                            </a>
                        </address>
                        {content.note && <p className="text-[0.8125rem] leading-relaxed text-ink-muted">{content.note}</p>}
                    </div>
                </div>

                {/* The tall photo */}
                <figure className="ef-tile relative m-0 flex aspect-[4/5] flex-col justify-between bg-pine p-4 text-cream shadow-elev-2 sm:p-5 lg:aspect-auto lg:min-h-[36rem]" data-reveal>
                    {photos.map((entry, i) => (
                        <Image
                            key={`${entry.image.url}-${i}`}
                            src={entry.image.url}
                            alt={i === current ? entry.image.alt : ''}
                            fill
                            sizes="(max-width: 768px) 92vw, 36vw"
                            className={cn(
                                '-z-20 object-cover transition-opacity duration-700 ease-out motion-reduce:transition-none',
                                i === current ? 'opacity-100' : 'opacity-0'
                            )}
                            style={{ objectPosition: entry.image.position }}
                        />
                    ))}
                    <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/85 via-transparent to-pine-deep/15" />
                    {photo.tag ? <PhotoTag key={`tag-${current}`} className="self-start duration-500 animate-in fade-in">{photo.tag}</PhotoTag> : <span />}
                    <span className="flex items-end justify-between gap-4">
                        {photo.caption && (
                            <figcaption key={`cap-${current}`} className="max-w-[16rem] font-header text-[clamp(1.125rem,0.95rem+0.6vw,1.375rem)] font-medium leading-tight duration-500 animate-in fade-in slide-in-from-bottom-1 [text-wrap:balance] motion-reduce:animate-none">
                                {photo.caption}
                            </figcaption>
                        )}
                        <a
                            href={DIRECTIONS_HREF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ef-focus ml-auto grid size-11 shrink-0 place-items-center rounded-full bg-cream text-pine shadow-elev-2 transition-transform hover:rotate-45 motion-reduce:transition-none"
                            aria-label={`${content.ctaLabel} (opens Google Maps)`}
                        >
                            <ArrowUpRight className="size-[1.125rem]" aria-hidden="true" />
                        </a>
                    </span>
                </figure>

                {/* The ruled list */}
                <div className="flex min-w-0 flex-col justify-end gap-4" data-reveal>
                    <h3 className="m-0 font-header text-[clamp(1.25rem,1.05rem+0.6vw,1.625rem)] font-medium leading-tight text-ink-strong">Around the store</h3>
                    <ul className="m-0 list-none border-b border-line-soft p-0" aria-label="Photos">
                        {photos.map((entry, i) => {
                            const selected = i === current
                            return (
                                <li key={`${entry.image.url}-${i}`} className="border-t border-line-soft">
                                    <button
                                        type="button"
                                        onClick={() => setActive(i)}
                                        onMouseEnter={() => setActive(i)}
                                        onFocus={() => setActive(i)}
                                        aria-pressed={selected}
                                        className="ef-focus group flex w-full items-center justify-between gap-4 py-4 text-left"
                                    >
                                        <span className="flex min-w-0 items-baseline gap-3">
                                            <span className={cn('text-[0.6875rem] font-semibold tabular-nums transition-colors', selected ? 'text-brand-bright' : 'text-ink-muted')}>{pad2(i + 1)}</span>
                                            <span className={cn('truncate text-[0.9375rem] font-medium transition-colors', selected ? 'text-brand-bright' : 'text-ink-strong group-hover:text-brand-bright')}>
                                                {entry.tag || `Photo ${i + 1}`}
                                            </span>
                                        </span>
                                        <span className="flex min-w-0 shrink items-center gap-2">
                                            {entry.caption && <span className="truncate text-right text-[0.75rem] text-ink-muted max-sm:hidden lg:max-w-[9rem]">{entry.caption}</span>}
                                            <ArrowRight
                                                className={cn('size-4 shrink-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none', selected ? 'translate-x-0 text-brand-bright opacity-100' : '-translate-x-1 opacity-0')}
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </Section>
    )
}

export default AboutVisit
