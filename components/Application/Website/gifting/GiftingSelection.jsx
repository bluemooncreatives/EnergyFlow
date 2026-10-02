'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { scrollToElement } from '@/lib/scroll'

// In-page anchors (also the URL hashes: /category/gift-boxes#enquire).
export const ENQUIRY_ANCHOR = 'enquire'
export const COLLECTION_ANCHOR = 'collection'

const GiftingSelectionContext = createContext(null)

// Which gift boxes the enquiry form has ticked. Lives above the page so an
// "Enquire for bulk" button on a box can pre-select it in the form further
// down and bring the form into view.
export const GiftingSelectionProvider = ({ children }) => {
    const [selected, setSelected] = useState([])

    const toggle = useCallback((id) => {
        setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
    }, [])

    const enquireAbout = useCallback((id) => {
        if (id) setSelected((list) => (list.includes(id) ? list : [...list, id]))
        const form = document.getElementById(ENQUIRY_ANCHOR)
        if (!form) return
        scrollToElement(form)
        // Move focus into the form for keyboard / screen-reader users, after
        // the smooth scroll has had a moment to start.
        window.setTimeout(() => {
            form.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea')?.focus({ preventScroll: true })
        }, 600)
    }, [])

    const value = useMemo(() => ({ selected, setSelected, toggle, enquireAbout }), [selected, toggle, enquireAbout])

    return <GiftingSelectionContext.Provider value={value}>{children}</GiftingSelectionContext.Provider>
}

export const useGiftingSelection = () => {
    const context = useContext(GiftingSelectionContext)
    if (!context) throw new Error('useGiftingSelection must be used inside <GiftingSelectionProvider>.')
    return context
}

// A button that jumps to the enquiry form, optionally pre-selecting a box.
// Usable from server components.
export const EnquireButton = ({ productId, className, children, ...props }) => {
    const { enquireAbout } = useGiftingSelection()
    return (
        <button type="button" className={className} onClick={() => enquireAbout(productId)} {...props}>
            {children}
        </button>
    )
}
