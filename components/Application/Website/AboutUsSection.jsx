'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { MapPin, Store, Truck } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import Section from './storefront/Section'
import StoreButton from './storefront/StoreButton'

const CONTENT = {
    leftImage: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/file_00000000d82c8211bcfd587359eeba52.png',
        alt: 'Energyflow premium dry fruits and super foods',
    },
    smallImage: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911945/270e856f021e3e06a3dd84d344bdc8d1.jpg.jpg',
        alt: 'Nuts and seeds from the Energyflow range',
    },
    bottomImage: {
        src: 'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/IMG_20260920_190814.jpg.jpg',
        alt: 'Inside the Energyflow dry fruits and super food store',
    },
    brandName: 'Energyflow',
    paragraphs: [
        'is a healthy food brand built on one simple belief: good nutrition should be easy to reach, easy to trust, and genuinely enjoyable. We bring together premium dry fruits, nuts, seeds, super foods, millets, cold pressed oils and A2 Gir cow bilona ghee under one roof, so a healthier kitchen never means shopping in five different places.',
        'Every product is selected for quality first. We source from growers and producers we can vouch for, check each lot for freshness and grade, and pack it to protect taste and nutrition on the way to you. From our first dry fruits and super food store to a growing retail and franchise network across India, the standard stays the same: honest products, fair prices, and nothing we would not serve at our own table.',
    ],
    caption: 'Dry Fruits, Super Foods & Wellness',
    date: 'Est. 2025',
    facts: [
        { Icon: MapPin, label: 'Pune, India', note: 'Est. 2025' },
        { Icon: Store, label: 'Retail & franchise', note: 'Growing network' },
        { Icon: Truck, label: 'Pan-India', note: 'Delivered to your door' },
    ],
}

const AboutUsSection = () => {
    const sectionRef = useRef(null)
    useReveal(sectionRef)

    return (
        <Section ref={sectionRef} tone="sunken" aria-labelledby="about-title">
            <div className="grid items-start gap-[clamp(2.5rem,5vw,5rem)] lg:grid-cols-[1fr_1.05fr]">

                {/* ── Collage ── */}
                <div data-reveal className="relative pb-10 pr-8 sm:pb-14 sm:pr-14 lg:sticky lg:top-28">
                    <div className="ef-tile relative aspect-[4/5] bg-surface-well">
                        <Image
                            src={CONTENT.leftImage.src}
                            alt={CONTENT.leftImage.alt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 90vw, 45vw"
                        />
                    </div>

                    <div
                        className="ef-tile absolute bottom-0 right-0 aspect-[4/5] w-[42%] bg-surface-well shadow-elev-3 ring-[6px] ring-surface-sunken sm:ring-8"
                        style={{ borderRadius: 'var(--radius-card)' }}
                    >
                        <Image
                            src={CONTENT.smallImage.src}
                            alt={CONTENT.smallImage.alt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 1024px) 38vw, 18vw"
                        />
                    </div>

                    <span className="ef-badge ef-badge--soft absolute left-4 top-4 h-8 px-3 text-[0.8125rem]">
                        {CONTENT.date}
                    </span>
                </div>

                {/* ── Story ── */}
                <div className="flex flex-col gap-8">
                    <div data-reveal className="flex flex-col items-start gap-4">
                        <span className="ef-eyebrow">A bit about us</span>
                        <h2 id="about-title" className="ef-title">
                            Good nutrition, <span className="ef-title__accent">easy to trust.</span>
                        </h2>
                    </div>

                    <div data-reveal className="flex flex-col gap-4 text-[1rem] leading-[1.7] text-ink-body">
                        <p>
                            <strong className="font-semibold text-ink-strong">{CONTENT.brandName}</strong>
                            {' '}{CONTENT.paragraphs[0]}
                        </p>
                        <p>{CONTENT.paragraphs[1]}</p>
                    </div>

                    <ul data-reveal className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
                        {CONTENT.facts.map(({ Icon, label, note }) => (
                            <li key={label} className="flex items-center gap-3 rounded-card bg-surface-card p-3.5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint-pistachio text-brand">
                                    <Icon className="size-[1.1rem]" aria-hidden="true" />
                                </span>
                                <span className="flex min-w-0 flex-col">
                                    <span className="text-[0.9375rem] font-medium text-ink-strong">{label}</span>
                                    <span className="text-[12px] text-ink-muted">{note}</span>
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div data-reveal>
                        <StoreButton href="/about-us" arrow>Read our story</StoreButton>
                    </div>

                    <figure data-reveal className="m-0 flex flex-col gap-3">
                        <div className="ef-tile relative aspect-[16/9] bg-surface-well" style={{ borderRadius: 'var(--radius-card)' }}>
                            <Image
                                src={CONTENT.bottomImage.src}
                                alt={CONTENT.bottomImage.alt}
                                fill
                                className="object-cover object-center"
                                sizes="(max-width: 1024px) 90vw, 45vw"
                            />
                        </div>
                        <figcaption className="flex items-center justify-between gap-4 text-[0.8125rem]">
                            <span className="font-medium text-ink-strong">{CONTENT.caption}</span>
                            <span className="text-ink-muted">Inside our store</span>
                        </figcaption>
                    </figure>
                </div>
            </div>
        </Section>
    )
}

export default AboutUsSection
