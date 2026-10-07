'use client'

import GiftSchedule, { PillArrow, SCHEDULE_PILL } from './GiftSchedule'
import { EnquireButton } from './GiftingSelection'

/**
 * "How bulk orders work" in the schedule layout (GiftSchedule): accent line
 * and headline with a photo on the left, the steps as indexed rows on the
 * right — the open step with its detail, what it covers and its photo.
 *
 * Photos are the admin's only (the defaults are brand photos): this section
 * never borrows gift box photos, so it can't repeat the collection above.
 */
const GiftProcessSchedule = ({ content, number }) => {
    const steps = content.items.filter((item) => item.title)
    if (!steps.length) return null

    const items = steps.map((step, i) => ({
        key: `${step.title}-${i}`,
        title: step.title,
        body: step.copy ? <p>{step.copy}</p> : null,
        action: step.tags?.length > 0 ? (
            <ul className="flex list-none flex-wrap gap-1.5 p-0" aria-label="Covers">
                {step.tags.map((tag) => (
                    <li key={tag} className="inline-flex h-8 items-center rounded-full bg-surface-card px-3.5 text-[0.75rem] font-medium text-ink-strong ring-1 ring-inset ring-line-strong">
                        {tag}
                    </li>
                ))}
            </ul>
        ) : null,
        thumb: step.image?.url ? { src: step.image.url, alt: '', position: step.image.position } : null,
    }))

    const lead = content.image?.url ? { src: content.image.url, alt: content.image.alt, position: content.image.position } : null

    return (
        <GiftSchedule
            tone="sunken"
            number={number}
            eyebrow={content.eyebrow}
            kicker={content.kicker}
            title={content.title}
            lead={content.description}
            photo={() => lead}
            items={items}
            cta={
                <EnquireButton className={SCHEDULE_PILL}>
                    {content.ctaLabel} <PillArrow />
                </EnquireButton>
            }
        />
    )
}

export default GiftProcessSchedule
