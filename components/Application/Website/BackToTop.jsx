'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { scrollToTop } from '@/lib/scroll'

// Appear once there is a real distance to travel — about a screen and a half,
// the point where the header is long gone and the way back stops being
// obvious. Earlier than that and it interrupts a page someone has barely
// started reading.
const SHOW_AFTER_SCREENS = 1.5

/**
 * The way back up, bottom-right on desktop.
 *
 * Hidden below 1024px by CSS: phones and tablets already have a bottom bar
 * there (the cart bar, or the product page's buy bar, which carries its own
 * back-to-top on its thumbnail), so a floating circle would just land on it.
 *
 * The scroll itself goes through lib/scroll, so it is a real smooth scroll on
 * the storefront (where Lenis owns the scroll and would otherwise swallow a
 * native `behavior: 'smooth'`) and honours reduced motion.
 */
const BackToTop = () => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        let frame = 0
        const check = () => {
            frame = 0
            setVisible(window.scrollY > window.innerHeight * SHOW_AFTER_SCREENS)
        }
        const schedule = () => { if (!frame) frame = requestAnimationFrame(check) }
        check()
        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('scroll', schedule)
            window.removeEventListener('resize', schedule)
        }
    }, [])

    return (
        <button
            type="button"
            onClick={() => scrollToTop()}
            className="ef-icon-btn ef-to-top ef-focus"
            data-visible={visible ? '' : undefined}
            aria-hidden={!visible}
            inert={!visible || undefined}
            aria-label="Back to top"
            title="Back to top"
        >
            <ArrowUp aria-hidden="true" />
        </button>
    )
}

export default BackToTop
