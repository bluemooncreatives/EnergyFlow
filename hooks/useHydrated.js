'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

// false during SSR and the hydration render, true on every client render after.
//
// The cart lives in localStorage (redux-persist, no PersistGate). The server
// always renders an empty cart, and rehydration can land before OR after React
// hydrates — a race that made cart badges, "in cart" buttons and the cart page
// mismatch intermittently. Gate cart-derived UI on this so the first client
// render always matches the server, then updates with the persisted cart.
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false)

export default useHydrated
