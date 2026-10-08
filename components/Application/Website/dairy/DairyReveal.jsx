'use client'

import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'

// One scroll-reveal scope for the whole dairy page, so the server-rendered
// sections fade up too (every `data-reveal` inside it).
const DairyReveal = ({ children }) => {
    const rootRef = useRef(null)
    useReveal(rootRef, [])
    return <div ref={rootRef}>{children}</div>
}

export default DairyReveal
