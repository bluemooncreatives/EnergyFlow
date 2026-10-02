'use client'

import { useRef } from 'react'
import { BadgePercent, Layers, Stamp, Truck } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import styles from './gifting.module.css'

const PROMISES = [
    {
        Icon: Stamp,
        tone: 'ef-seal--sun',
        title: 'Your brand on every box',
        copy: 'Logo sleeves, printed message cards and personalised notes, so the gift is unmistakably from you.',
    },
    {
        Icon: Layers,
        tone: 'ef-seal--pine',
        title: 'Curated to your budget',
        copy: 'Choose a signature box or have us build a custom mix of dry fruits, chocolates and treats.',
    },
    {
        Icon: BadgePercent,
        tone: 'ef-seal--forest',
        title: 'Volume pricing',
        copy: 'Better rates as quantities grow, with one clear quote covering boxes, branding and delivery.',
    },
    {
        Icon: Truck,
        tone: 'ef-seal--olive',
        title: 'Delivered across India',
        copy: 'Packed fresh and shipped free to offices and homes nationwide, timed for your date.',
    },
]

const GiftingPromise = () => {
    const rootRef = useRef(null)
    useReveal(rootRef)

    return (
        <section ref={rootRef} className="ef-section ef-section--sunken" aria-labelledby="promise-title">
            <div className="ef-container">
                <div className="mb-[clamp(2rem,4vw,3.5rem)] flex max-w-3xl flex-col items-start gap-3">
                    <span className="ef-eyebrow" data-reveal>Why teams choose us</span>
                    <h2 id="promise-title" className="ef-title" data-reveal>
                        Gifting that feels <span className="ef-title__accent">personal</span>, at any scale
                    </h2>
                </div>

                <div className={styles.promise}>
                    {PROMISES.map(({ Icon, tone, title, copy }) => (
                        <div key={title} className="flex flex-col gap-4" data-reveal>
                            <span className={`ef-seal ${tone} !size-16`}>
                                <Icon aria-hidden="true" />
                            </span>
                            <h3 className="text-[1.1875rem] font-semibold leading-snug text-ink-strong">{title}</h3>
                            <p className="text-[0.9375rem] leading-relaxed text-ink-body">{copy}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default GiftingPromise
