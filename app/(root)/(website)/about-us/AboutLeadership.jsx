'use client'

import { useId, useState } from 'react'
import Image from 'next/image'
import Section from '@/components/Application/Website/storefront/Section'
import { paragraphs } from '@/lib/pageContent/shared'
import { cn, initialsOf } from '@/lib/utils'
import { AboutMetaRow, AboutTitle } from './AboutUi'

// A person's photo, or — with none on file — their monogram on pine. No
// stock portraits: a bought-in face on an "about the founders" block is a lie.
const Portrait = ({ person, sizes, className, children }) => {
    const photo = person.photo?.url ? person.photo : null
    return (
        <figure className={cn('ef-tile relative m-0 bg-pine text-cream shadow-elev-2 duration-500 animate-in fade-in motion-reduce:animate-none', className)}>
            {photo ? (
                <Image src={photo.url} alt={photo.alt || person.name} fill sizes={sizes} className="-z-10 object-cover" style={{ objectPosition: photo.position }} />
            ) : (
                <>
                    <span aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: 'var(--brand-panel-gradient)' }} />
                    <span aria-hidden="true" className="absolute inset-0 -z-10 grid place-items-center pb-[18%] font-header text-[clamp(5rem,14vw,10rem)] font-semibold leading-none text-cream/90">
                        {initialsOf(person.name)}
                    </span>
                </>
            )}
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-pine-deep/75 via-transparent to-transparent" />
            {children}
        </figure>
    )
}

const PortraitCaption = ({ person }) => (
    <figcaption className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5 rounded-card bg-pine-deep/55 p-3 backdrop-blur-md sm:inset-x-4 sm:bottom-4 md:gap-2 md:p-4">
        {person.quote && <span className="text-[0.8125rem] font-medium leading-snug md:text-[0.9375rem]">“{person.quote}”</span>}
        <span className="text-[0.6875rem] font-semibold uppercase text-cream/75 md:text-[0.75rem]">{person.name}</span>
    </figcaption>
)

/**
 * "Who runs it", after the wellness reference's treatment picker: the
 * chosen person as a large portrait (photo, or monogram) with their own
 * words over it, beside the headline and a list of the people — the chosen
 * one open with role and bio, the rest muted with a radio-style marker.
 * Phones drop the side portrait and show it inside the open entry instead.
 */
const AboutLeadership = ({ content, number, tone = 'sunken' }) => {
    const uid = useId()
    const [active, setActive] = useState(0)

    const people = content.people.filter((person) => person.name)
    if (!people.length) return null
    const current = people[Math.min(active, people.length - 1)]

    return (
        <Section tone={tone} aria-labelledby="leadership-title">
            <AboutMetaRow label={content.label} number={number} />

            <div className="grid gap-[clamp(1.5rem,4vw,3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="min-w-0 max-lg:hidden lg:sticky lg:top-28 lg:self-start" data-reveal>
                    <Portrait key={current.name} person={current} sizes="40vw" className="aspect-[4/5]">
                        <PortraitCaption person={current} />
                    </Portrait>
                </div>

                <div className="flex min-w-0 flex-col gap-[clamp(1.5rem,3vw,2.25rem)]">
                    <div className="flex flex-col gap-4" data-reveal>
                        <AboutTitle id="leadership-title" title={content.title} accent={content.titleAccent} />
                        {content.description && <p className="ef-lead max-w-2xl">{content.description}</p>}
                    </div>

                    <ul className="list-none border-t border-line-strong p-0" data-reveal>
                        {people.map((person, i) => {
                            const open = person === current
                            const panelId = `${uid}-person-${i}`
                            const buttonId = `${uid}-person-${i}-button`
                            const bio = paragraphs(person.bio)
                            return (
                                <li key={`${person.name}-${i}`} className="border-b border-line-strong">
                                    <h3>
                                        <button
                                            id={buttonId}
                                            type="button"
                                            aria-expanded={open}
                                            aria-controls={panelId}
                                            onClick={() => setActive(i)}
                                            className="ef-focus group flex w-full items-center gap-4 rounded-sm py-5 text-left"
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn(
                                                    'grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                                                    open ? 'border-brand-bright' : 'border-line-strong group-hover:border-ink-muted'
                                                )}
                                            >
                                                <span className={cn('size-2.5 rounded-full bg-brand-bright transition-transform duration-300', open ? 'scale-100' : 'scale-0')} />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={cn('block font-header text-[clamp(1.25rem,1rem+1vw,1.875rem)] font-medium leading-tight transition-colors', open ? 'text-ink-strong' : 'text-ink-muted group-hover:text-ink-strong')}>
                                                    {person.name}
                                                </span>
                                                {person.role && <span className="mt-1 block text-[0.8125rem] font-medium uppercase text-brand-bright">{person.role}</span>}
                                            </span>
                                        </button>
                                    </h3>
                                    <div
                                        id={panelId}
                                        role="region"
                                        aria-labelledby={buttonId}
                                        inert={!open || undefined}
                                        className="grid transition-[grid-template-rows,opacity] duration-500 ease-out motion-reduce:transition-none"
                                        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
                                    >
                                        <div className="min-h-0 overflow-hidden">
                                            <div className="flex flex-col gap-4 pb-6 pl-10">
                                                <Portrait person={person} sizes="(min-width: 480px) 20rem, 80vw" className="aspect-[4/5] w-full max-w-[20rem] lg:hidden">
                                                    <PortraitCaption person={person} />
                                                </Portrait>
                                                {bio.map((paragraph) => (
                                                    <p key={paragraph} className="max-w-2xl text-[0.9375rem] leading-[1.75] text-ink-body">{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </Section>
    )
}

export default AboutLeadership
