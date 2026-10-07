'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail, Phone } from 'lucide-react'
import Section from '@/components/Application/Website/storefront/Section'
import { COMPANY } from '@/lib/company'
import { AboutMetaRow } from './AboutUi'

export const DIRECTIONS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([COMPANY.brand, ...COMPANY.addressLines].join(', '))}`

const DEFAULT_PHOTO = {
    image: { url: COMPANY.storePhoto.src, alt: COMPANY.storePhoto.alt, position: 'center' },
    tag: 'Our store',
    caption: COMPANY.addressLines.join(', '),
}

const PhotoCard = ({ photo, className, sizes, children }) => (
    <figure className={`ef-tile relative m-0 bg-pine text-cream shadow-elev-2 ${className || ''}`}>
        <Image
            key={photo.image.url}
            src={photo.image.url}
            alt={photo.image.alt}
            fill
            sizes={sizes}
            className="-z-10 object-cover duration-500 animate-in fade-in motion-reduce:animate-none"
            style={{ objectPosition: photo.image.position }}
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/80 via-pine-deep/5 to-pine-deep/20" />
        {photo.tag && (
            <span className="absolute left-3 top-3 inline-flex h-7 max-w-[calc(100%-1.5rem)] items-center truncate rounded-full bg-pine-deep/25 px-3 text-[0.6875rem] font-semibold ring-1 ring-inset ring-cream/55 backdrop-blur sm:left-4 sm:top-4">
                {photo.tag}
            </span>
        )}
        {photo.caption && (
            <figcaption className="absolute bottom-3 left-3 right-16 text-[0.9375rem] font-medium leading-snug [text-wrap:balance] sm:bottom-4 sm:left-4">
                {photo.caption}
            </figcaption>
        )}
        {children}
    </figure>
)

/**
 * "Come and find us", after the sports-centre reference's intro row: the
 * section pill, the store's invitation set large, the address and direct
 * lines with "Get directions"; beside it the store photo (tagged, captioned,
 * a round ↗ into the map), and a smaller card that steps through the other
 * photos with a note and arrows.
 */
const AboutVisit = ({ content, number }) => {
    const [index, setIndex] = useState(0)

    const photos = content.photos.filter((photo) => photo.image?.url)
    const [main = DEFAULT_PHOTO, ...rest] = photos
    const side = rest.length ? rest[index % rest.length] : null

    return (
        <Section tone="page" aria-labelledby="visit-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid gap-[var(--grid-gap)] md:grid-cols-2 lg:grid-cols-[minmax(0,5fr)_minmax(0,4.2fr)_minmax(0,2.8fr)] lg:gap-[clamp(1rem,2vw,1.75rem)]">
                <div className="flex min-w-0 flex-col items-start gap-5 md:col-span-2 lg:col-span-1 lg:pr-4" data-reveal>
                    <span className="ef-eyebrow">{COMPANY.city} store</span>
                    <h2 id="visit-title" className="m-0 font-header text-[clamp(1.375rem,1.05rem+1.3vw,2.125rem)] font-medium leading-[1.2] text-ink-strong [text-wrap:pretty]">
                        {content.statement}
                    </h2>
                    <address className="flex flex-col gap-2 text-[0.9375rem] not-italic text-ink-body">
                        <span>{COMPANY.legalName}, {COMPANY.addressLines.join(', ')}</span>
                        <a href={COMPANY.phoneHref} className="ef-focus inline-flex w-fit items-center gap-2 rounded-sm text-ink-strong hover:text-brand-bright">
                            <Phone className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.phone}
                        </a>
                        <a href={`mailto:${COMPANY.email}`} className="ef-focus inline-flex w-fit items-center gap-2 break-all rounded-sm text-ink-strong hover:text-brand-bright">
                            <Mail className="size-4 shrink-0" aria-hidden="true" /> {COMPANY.email}
                        </a>
                    </address>
                    <div className="flex flex-wrap gap-2.5">
                        <a href={DIRECTIONS_HREF} target="_blank" rel="noopener noreferrer" className="ef-btn ef-btn--primary rounded-full">
                            {content.ctaLabel} <ArrowUpRight className="ef-btn__arrow" aria-hidden="true" />
                        </a>
                        <a href={COMPANY.phoneHref} className="ef-btn ef-btn--outline rounded-full">Call the store</a>
                    </div>
                </div>

                <div data-reveal className={side ? '' : 'md:col-span-2 lg:col-span-2'}>
                    <PhotoCard photo={main} className="h-full min-h-[19rem] sm:min-h-[22rem]" sizes="(max-width: 768px) 92vw, 34vw">
                        <a
                            href={DIRECTIONS_HREF}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ef-focus absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-cream text-pine shadow-elev-2 transition-transform hover:rotate-45 motion-reduce:transition-none sm:bottom-4 sm:right-4"
                            aria-label={`${content.ctaLabel} (opens Google Maps)`}
                        >
                            <ArrowUpRight className="size-[1.125rem]" aria-hidden="true" />
                        </a>
                    </PhotoCard>
                </div>

                {side && (
                    <div className="flex min-w-0 flex-col gap-4" data-reveal>
                        <PhotoCard photo={side} className="aspect-[4/3] md:aspect-auto md:min-h-[14rem] md:flex-1" sizes="(max-width: 768px) 92vw, 24vw" />
                        {content.note && <p className="text-[0.8125rem] leading-relaxed text-ink-muted">{content.note}</p>}
                        {rest.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button type="button" className="ef-icon-btn" onClick={() => setIndex((i) => (i - 1 + rest.length) % rest.length)} aria-label="Previous photo">
                                    <ArrowLeft aria-hidden="true" />
                                </button>
                                <button type="button" className="ef-icon-btn" onClick={() => setIndex((i) => (i + 1) % rest.length)} aria-label="Next photo">
                                    <ArrowRight aria-hidden="true" />
                                </button>
                                <span className="ml-1 text-[0.8125rem] tabular-nums text-ink-muted" aria-live="polite">
                                    {(index % rest.length) + 1} / {rest.length}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Section>
    )
}

export default AboutVisit
