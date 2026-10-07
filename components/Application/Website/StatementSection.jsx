'use client'

import { Fragment, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Leaf, Star } from 'lucide-react'
import StoreButton from '@/components/Application/Website/storefront/StoreButton'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import { cn } from '@/lib/utils'
import styles from './StatementSection.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Segments of the statement in natural reading order.
// Splitting into structured segments guarantees exact semantic rendering
// while granting micro-control over the scroll-driven illumination sequence.
const PHRASE_PARTS = [
    { type: 'word', text: 'Hi!' },
    { type: 'word', text: "We're" },
    { type: 'word', text: 'Energyflow,' },
    { type: 'chip', text: 'a dry fruits & superfood store' },
    { type: 'word', text: 'from' },
    { type: 'word', text: 'New' },
    { type: 'word', text: 'Delhi.' },
    { type: 'word', text: 'We' },
    { type: 'word', text: 'want' },
    { type: 'word', text: 'the' },
    { type: 'word', text: 'food' },
    { type: 'word', text: 'your' },
    { type: 'word', text: 'family' },
    { type: 'word', text: 'eats' },
    { type: 'word', text: 'every' },
    { type: 'word', text: 'day' },
    { type: 'word', text: 'to' },
    { type: 'word', text: 'be' },
    { type: 'word', text: 'the' },
    { type: 'word', text: 'part' },
    { type: 'word', text: 'of' },
    { type: 'word', text: 'the' },
    { type: 'word', text: 'shop' },
    { type: 'word', text: 'you' },
    { type: 'word', text: 'never' },
    { type: 'word', text: 'have' },
    { type: 'word', text: 'to' },
    { type: 'token' },
    { type: 'word', text: 'second-guess.' },
]

const StatementSection = ({ className, eyebrow = 'The promise' }) => {
    const containerRef = useRef(null)
    const statementRef = useRef(null)
    const watermarkLeftRef = useRef(null)
    const watermarkRightRef = useRef(null)
    const progressBarRef = useRef(null)
    const leafIconRef = useRef(null)
    const shimmerRef = useRef(null)
    const starTokenRef = useRef(null)
    const ctaRef = useRef(null)

    useGSAP(() => {
        const root = containerRef.current
        if (!root) return

        const media = gsap.matchMedia()
        media.add({
            desktop: '(min-width: 768px) and (pointer: fine)',
            reduceMotion: '(prefers-reduced-motion: reduce)',
            motion: '(prefers-reduced-motion: no-preference)',
        }, ({ conditions }) => {
            // CSS is fully visible by default, including before hydration.
            if (conditions.reduceMotion) return
            const { desktop } = conditions
            const items = gsap.utils.toArray(root.querySelectorAll('[data-scrub-item]'))
            const readingDuration = 0.82
            const wordDuration = 0.12
            const wordStep = (readingDuration - wordDuration) / (items.length - 1)

            // Lenis already smooths wheel input. Direct scrubbing avoids adding
            // another catch-up delay and also tracks native touch scrolling.
            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: {
                    trigger: statementRef.current,
                    start: 'top 82%',
                    end: 'bottom 48%',
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            })

            // Set every word together; a staggered fromTo can defer the
            // starting state of later words when matchMedia rebuilds on resize.
            gsap.set(items, { opacity: desktop ? 0.22 : 0.32, y: desktop ? 5 : 0 })
            tl.to(items, { opacity: 1, y: 0, duration: wordDuration, stagger: wordStep }, 0)
            tl.fromTo(progressBarRef.current, { scaleX: 0 },
                { scaleX: 1, duration: readingDuration }, 0)
            tl.fromTo(leafIconRef.current, { rotation: -25, scale: 0.9 },
                { rotation: 0, scale: 1, duration: 0.2, ease: 'power2.out' }, 3 * wordStep)
            // Transform the shimmer instead of changing layout on every frame.
            tl.fromTo(shimmerRef.current, { x: 0, xPercent: -110 },
                { xPercent: 210, duration: 0.26 }, 3 * wordStep)
            tl.fromTo(starTokenRef.current, { rotation: 0 },
                { rotation: 360, duration: readingDuration }, 0)
            tl.fromTo(ctaRef.current, { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, readingDuration)

            // Small decorative layers only; touch devices keep the backdrop still.
            if (desktop) {
                tl.fromTo(watermarkLeftRef.current, { y: 18, rotation: 0 },
                    { y: -18, rotation: -4, duration: 1 }, 0)
                tl.fromTo(watermarkRightRef.current, { y: -18, rotation: 0 },
                    { y: 18, rotation: 4, duration: 1 }, 0)
            }
        })
        return () => media.revert()
    }, { scope: containerRef })

    return (
        <section
            ref={containerRef}
            className={cn('ef-section ef-section--sunken', styles.sectionWrap, className)}
            aria-label="Energyflow statement and philosophy"
        >
            {/* Background Ambience */}
            <div className={styles.ambientGlow1} aria-hidden="true" />
            <div className={styles.ambientGlow2} aria-hidden="true" />

            {/* Botanical Watermark Motifs */}
            <svg
                ref={watermarkLeftRef}
                className={styles.watermarkLeft}
                viewBox="0 0 160 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path
                    d="M10 250 C 40 180 80 120 150 70 C 130 140 90 200 10 250 Z"
                    fill="currentColor"
                />
                <path
                    d="M150 70 C 90 40 40 10 10 10 C 30 70 80 110 150 70 Z"
                    fill="currentColor"
                />
            </svg>
            <svg
                ref={watermarkRightRef}
                className={styles.watermarkRight}
                viewBox="0 0 160 260"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <path
                    d="M150 10 C 120 80 80 140 10 190 C 30 120 70 60 150 10 Z"
                    fill="currentColor"
                />
                <path
                    d="M10 190 C 70 220 120 250 150 250 C 130 190 80 150 10 190 Z"
                    fill="currentColor"
                />
            </svg>

            {/* Inner Content - Full Width Container */}
            <div className={styles.content}>
                {/* Editorial Eyebrow with Pulsing Live Beacon */}
                <div className={styles.eyebrowPill}>
                    <span className={styles.beaconDot} aria-hidden="true">
                        <span className={styles.beaconPing} />
                        <span className={styles.beaconStatic} />
                    </span>
                    <span className={styles.eyebrowText}>{eyebrow}</span>
                </div>

                {/* The Full-Width Statement Typography */}
                <h2 ref={statementRef} className={styles.statement}>
                    {PHRASE_PARTS.map((part, index) => {
                        if (part.type === 'word') {
                            return (
                                <Fragment key={index}>
                                    <span data-scrub-item className={styles.word}>{part.text}</span>{' '}
                                </Fragment>
                            )
                        }

                        if (part.type === 'chip') {
                            return (
                                <Fragment key={index}>
                                    <span data-scrub-item className={styles.chipWrap}>
                                        <span className={styles.chip}>
                                            <span ref={shimmerRef} className={styles.chipShimmer} aria-hidden="true" />
                                            <Leaf ref={leafIconRef} className={styles.chipLeaf} aria-hidden="true" />
                                            <span>{part.text}</span>
                                        </span>
                                    </span>{' '}
                                </Fragment>
                            )
                        }

                        if (part.type === 'token') {
                            return (
                                <Fragment key={index}>
                                    <span data-scrub-item className={styles.tokenWrap}>
                                        <span ref={starTokenRef} className={styles.token} aria-hidden="true">
                                            <Star />
                                        </span>
                                    </span>{' '}
                                </Fragment>
                            )
                        }

                        return null
                    })}
                </h2>

                {/* Progress Hairline Tracker */}
                <div className={styles.progressTrack} aria-hidden="true">
                    <div ref={progressBarRef} className={styles.progressBar} />
                </div>

                {/* Call to Action */}
                <div ref={ctaRef} className={styles.ctaContainer}>
                    <StoreButton href={WEBSITE_SHOP} arrow>
                        Browse everything
                    </StoreButton>
                </div>
            </div>
        </section>
    )
}

export default StatementSection
