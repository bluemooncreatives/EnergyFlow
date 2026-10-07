'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import styles from './about-us.module.css'

// The copy and photograph render in the initial HTML. The observer only moves
// the visual chapter marker as the reader travels through the four steps.
const SourcingSteps = ({ steps, figure, photoEyebrow, photoTitle }) => {
    const [active, setActive] = useState(0)
    const rowsRef = useRef([])
    const total = String(steps.length).padStart(2, '0')

    useEffect(() => {
        const rows = rowsRef.current.filter(Boolean)
        if (!rows.length || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return

                const viewportMiddle = window.innerHeight / 2
                const nearest = rows
                    .map((row, index) => {
                        const bounds = row.getBoundingClientRect()
                        return { index, distance: Math.abs((bounds.top + bounds.bottom) / 2 - viewportMiddle) }
                    })
                    .sort((a, b) => a.distance - b.distance)[0]

                if (nearest) setActive(nearest.index)
            },
            { rootMargin: '-32% 0px -32% 0px', threshold: 0 }
        )

        rows.forEach((row) => observer.observe(row))
        return () => observer.disconnect()
    }, [steps.length])

    return (
        <div className={styles.sourcingGrid}>
            <div className={styles.sourcingVisual}>
                <figure className={styles.sourcingFigure} data-reveal>
                    {figure?.src && (
                        <Image
                            src={figure.src}
                            alt={figure.alt}
                            fill
                            sizes="(max-width: 1023px) 100vw, 44vw"
                            className={styles.sourcingImage}
                            style={{ objectPosition: figure.position || 'center 52%' }}
                        />
                    )}
                    <div className={styles.sourcingPhotoTop} aria-hidden="true">
                        <span className={styles.sourcingPhotoTag}>
                            <span className={styles.sourcingPhotoDot} /> Source to home
                        </span>
                        <span className={styles.sourcingPhotoCounter}>
                            {String(active + 1).padStart(2, '0')}
                            <small>/{total}</small>
                        </span>
                    </div>
                    <figcaption className={styles.sourcingPhotoCaption}>
                        {photoEyebrow && <span className={styles.sourcingPhotoEyebrow}>{photoEyebrow}</span>}
                        {photoTitle && <span className={styles.sourcingPhotoTitle}>{photoTitle}</span>}
                        <span className={styles.sourcingProgress} aria-hidden="true">
                            <span style={{ width: `${((active + 1) / steps.length) * 100}%` }} />
                        </span>
                        <span className={styles.sourcingProgressLabels} aria-hidden="true">
                            <span>{steps[0]?.phase || 'Origin'}</span>
                            <span>Your kitchen</span>
                        </span>
                    </figcaption>
                </figure>
            </div>

            <ol className={styles.steps} aria-label="How our products reach you">
                {steps.map((step, index) => (
                    <li
                        key={`${step.title}-${index}`}
                        ref={(el) => { rowsRef.current[index] = el }}
                        className={styles.step}
                        data-active={index === active}
                        data-reveal
                    >
                        <span className={styles.stepIndex} aria-hidden="true">
                            {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className={styles.stepCopy}>
                            {step.phase && <span className={styles.stepPhase}>{step.phase}</span>}
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepBody}>{step.body}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    )
}

export default SourcingSteps
