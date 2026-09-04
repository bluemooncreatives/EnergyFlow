'use client'

import { useEffect, useRef, useState } from 'react'

// Defers React hydration of below-fold sections until they approach the
// viewport. The server-rendered HTML stays visible (and indexable) the whole
// time — during hydration React sees a `dangerouslySetInnerHTML` node and
// skips reconciling its children, leaving the server markup untouched. When
// the observer fires, the real children render and their client islands mount.
// This breaks the single multi-second hydration task (the main TBT/TTI cost)
// into small per-section tasks that run only when needed.
const LazyHydrate = ({ children, rootMargin = '400px' }) => {
    const ref = useRef(null)
    // Server render: hydrated=true so children are in the HTML payload.
    // Client render: hydrated=false until the section is near the viewport.
    const [hydrated, setHydrated] = useState(typeof window === 'undefined')

    useEffect(() => {
        if (hydrated) return
        const el = ref.current
        if (!el || typeof IntersectionObserver === 'undefined') {
            setHydrated(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    setHydrated(true)
                }
            },
            { rootMargin }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [hydrated, rootMargin])

    if (hydrated) {
        return <div ref={ref}>{children}</div>
    }

    return (
        <div
            ref={ref}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: '' }}
        />
    )
}

export default LazyHydrate
