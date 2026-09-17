'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { ArrowUpRight } from 'lucide-react'
import ShopAllButton from '@/components/Application/Website/ShopAllButton'
import styles from './AboutUsSection.module.css'

gsap.registerPlugin(ScrollTrigger)

const CONTENT = {
    leftImage: {
        src: 'https://res.cloudinary.com/darrsi9y2/image/upload/v1783146225/DSCF5008_1_r7uftx.jpg',
        alt: 'Energyflow premium dry fruits and super foods',
    },
    smallImage: {
        src: 'https://res.cloudinary.com/darrsi9y2/image/upload/v1779221853/mtonkotfj50dwoswlr2j.jpg',
        alt: 'Nuts and seeds from the Energyflow range',
    },
    bottomImage: {
        src: 'https://res.cloudinary.com/darrsi9y2/image/upload/v1781947914/wbbpf3ivaxy7f8geenmb.jpg',
        alt: 'Inside the Energyflow dry fruits and super food store',
    },
    brandName: 'Energyflow',
    paragraphs: [
        'is a healthy food brand built on one simple belief: good nutrition should be easy to reach, easy to trust, and genuinely enjoyable. We bring together premium dry fruits, nuts, seeds, super foods, millets, cold pressed oils and A2 Gir cow bilona ghee under one roof, so a healthier kitchen never means shopping in five different places.',
        'Every product is selected for quality first. We source from growers and producers we can vouch for, check each lot for freshness and grade, and pack it to protect taste and nutrition on the way to you. From our first dry fruits and super food store to a growing retail and franchise network across India, the standard stays the same: honest products, fair prices, and nothing we would not serve at our own table.',
    ],
    caption: 'Dry Fruits, Super Foods & Wellness',
    date: 'Est. 2025',
}

const AboutUsSection = () => {
    const sectionRef  = useRef(null)
    const headerRef   = useRef(null)
    const leftImgRef  = useRef(null)
    const midColRef   = useRef(null)
    const rightColRef = useRef(null)

    useGSAP(() => {
        gsap.fromTo(
            headerRef.current,
            { autoAlpha: 0, y: 22 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
                ease: 'power3.out',
                scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
            }
        )

        gsap.fromTo(
            [leftImgRef.current, midColRef.current, rightColRef.current],
            { autoAlpha: 0, y: 38 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.95,
                ease: 'power3.out',
                stagger: 0.13,
                scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
            }
        )
    }, { scope: sectionRef })

    return (
        <section ref={sectionRef} className={styles.section}>

            {/* ── Section header ── */}
            <div ref={headerRef} className={styles.header}>
                <h2 className={styles.heading}>A Bit About Us</h2>
            </div>

            <div className={styles.rule} />

            {/* ── 3-column grid: Big | Small | Writeup & Image ── */}
            <div className={styles.grid}>

                {/* Col 1 — tall portrait image */}
                <div ref={leftImgRef} className={styles.leftImage}>
                    <Image
                        src={CONTENT.leftImage.src}
                        alt={CONTENT.leftImage.alt}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>

                {/* Col 2 — small portrait image + See More; blank space fills below */}
                <div ref={midColRef} className={styles.midCol}>
                    <div className={styles.smallImage}>
                        <Image
                            src={CONTENT.smallImage.src}
                            alt={CONTENT.smallImage.alt}
                            fill
                            className="object-cover object-top"
                            sizes="(max-width: 768px) 100vw, 14vw"
                        />
                    </div>
                    <ShopAllButton
                        label="See More"
                        href="/about-us"
                        colorScheme="dark-red"
                        radius="md"
                        className="mt-3 min-w-0 w-full h-10 px-4 rounded-sm text-[0.72rem]"
                    />
                </div>

                {/* Col 3 — writeup at top, image + caption pushed to bottom */}
                <div ref={rightColRef} className={styles.rightCol}>
                    <div className={styles.textBlock}>
                        <p className={styles.bodyText}>
                            <strong className={styles.brandName}>{CONTENT.brandName}</strong>
                            {' '}{CONTENT.paragraphs[0]}
                        </p>
                        <p className={styles.bodyText}>{CONTENT.paragraphs[1]}</p>
                    </div>

                    <div className={styles.rightBottom}>
                        <div className={styles.bottomImage}>
                            <Image
                                src={CONTENT.bottomImage.src}
                                alt={CONTENT.bottomImage.alt}
                                fill
                                className="object-cover object-center"
                                sizes="(max-width: 768px) 100vw, 36vw"
                            />
                        </div>
                        <div className={styles.captionRow}>
                            <p className={styles.captionTitle}>{CONTENT.caption}</p>
                            <p className={styles.captionDate}>{CONTENT.date}</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    )
}

export default AboutUsSection
