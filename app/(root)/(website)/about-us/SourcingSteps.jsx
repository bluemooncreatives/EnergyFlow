'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './about-us.module.css'

// The sourcing list, with the step you are currently reading brought forward.
// Content arrives as props from the server component, so the four steps are in
// the HTML for crawlers and the only thing this bundle adds is the highlight.
//
// An IntersectionObserver with a tall negative margin leaves a thin band across
// the middle of the viewport; whichever row is in that band is the active one.
// This is far cheaper than a scroll handler and needs no rAF throttling.
const SourcingSteps = ({ steps }) => {
    const [active, setActive] = useState(0)
    const rowsRef = useRef([])

    useEffect(() => {
        const rows = rowsRef.current.filter(Boolean)
        if (!rows.length || typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return
                    const index = rows.indexOf(entry.target)
                    if (index !== -1) setActive(index)
                })
            },
            { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
        )

        rows.forEach((row) => observer.observe(row))
        return () => observer.disconnect()
    }, [steps.length])

    return (
        <ol className={styles.steps}>
            {steps.map((step, index) => (
                <li
                    key={step.title}
                    ref={(el) => { rowsRef.current[index] = el }}
                    className={styles.step}
                    data-active={index === active}
                    data-reveal
                >
                    <span className={styles.stepIndex} aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                        <h3 className={styles.stepTitle}>{step.title}</h3>
                        <p className={styles.stepBody}>{step.body}</p>
                    </div>
                </li>
            ))}
        </ol>
    )
}

export default SourcingSteps
