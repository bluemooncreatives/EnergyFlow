'use client'

import { useEffect, useId, useSyncExternalStore } from 'react'

// The bottom edge of the screen holds one bar at a time. A bar with a more
// specific job (the product page's buy bar) claims the slot while it is shown;
// the site-wide mobile cart bar steps aside whenever the slot is taken and
// comes back when it is released. A module store, so any component can take
// part without sharing a provider.
const claims = new Set()
const listeners = new Set()

const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
const isTaken = () => claims.size > 0

// Holds the slot while `active` is true; released on unmount.
export const useClaimBottomSlot = (active) => {
    const id = useId()
    useEffect(() => {
        if (!active) return
        claims.add(id)
        emit()
        return () => {
            claims.delete(id)
            emit()
        }
    }, [active, id])
}

// True while some other bar holds the slot. Always false on the server.
export const useBottomSlotTaken = () => useSyncExternalStore(subscribe, isTaken, () => false)
