'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { scrollToElement } from '@/lib/scroll'

// In-page anchors (also the URL hashes: /category/gift-boxes#enquire).
export const ENQUIRY_ANCHOR = 'enquire'
export const COLLECTION_ANCHOR = 'collection'

const GiftingSelectionContext = createContext(null)

// What the enquiry form should start from. Lives above the page so an
// "Enquire for bulk" button on a box can pre-select it, and an occasion tile
// can pre-pick the occasion, in the form further down — then bring the form
// into view.
//
// `enquiryRequest` counts every jump to the form (with the occasion picked, if
// any), so the form can return to its first step each time — and picking the
// same occasion twice still reaches it.
export const GiftingSelectionProvider = ({ children }) => {
    const [selected, setSelected] = useState([])
    const [enquiryRequest, setEnquiryRequest] = useState(null)

    const toggle = useCallback((id) => {
        setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))
    }, [])

    const enquireAbout = useCallback((id, { occasion } = {}) => {
        if (id) setSelected((list) => (list.includes(id) ? list : [...list, id]))
        setEnquiryRequest((prev) => ({ occasion: occasion || null, n: (prev?.n || 0) + 1 }))
        const form = document.getElementById(ENQUIRY_ANCHOR)
        if (!form) return
        scrollToElement(form)
        // Move focus into the form for keyboard / screen-reader users, after
        // the smooth scroll has had a moment to start. With the occasion
        // already picked, start them at the quantity instead.
        window.setTimeout(() => {
            const first = occasion
                ? form.querySelector('#gift-quantity')
                : form.querySelector('input:not([type="hidden"]):not([tabindex="-1"]), textarea')
            first?.focus({ preventScroll: true })
        }, 600)
    }, [])

    const value = useMemo(
        () => ({ selected, setSelected, toggle, enquireAbout, enquiryRequest }),
        [selected, toggle, enquireAbout, enquiryRequest]
    )

    return <GiftingSelectionContext.Provider value={value}>{children}</GiftingSelectionContext.Provider>
}

export const useGiftingSelection = () => {
    const context = useContext(GiftingSelectionContext)
    if (!context) throw new Error('useGiftingSelection must be used inside <GiftingSelectionProvider>.')
    return context
}

// A button that jumps to the enquiry form, optionally pre-selecting a box or
// an occasion. Usable from server components.
export const EnquireButton = ({ productId, occasion, className, children, ...props }) => {
    const { enquireAbout } = useGiftingSelection()
    return (
        <button type="button" className={className} onClick={() => enquireAbout(productId, { occasion })} {...props}>
            {children}
        </button>
    )
}

// Smooth in-page jump that still works as a plain link without JS.
export const jumpTo = (event, id) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    scrollToElement(target)
}
