'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

export default function LenisProvider({ children }) {
  const lenisRef = useRef(null)
  const rafRef = useRef(null)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isWebsiteRoute = !pathname?.startsWith('/admin') && !pathname?.startsWith('/auth')
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
    const isLowEndConnection = connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const shouldEnable = isWebsiteRoute && !isLowEndConnection && !prefersReducedMotion

    if (!shouldEnable) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
      return
    }

    // Defer Lenis init until the browser is idle so it doesn't run
    // in the same task as React hydration, keeping TBT low.
    const requestIdle = window.requestIdleCallback?.bind(window)
      || ((cb) => setTimeout(cb, 200))
    const cancelIdle = window.cancelIdleCallback?.bind(window)
      || ((id) => clearTimeout(id))

    const idleId = requestIdle(() => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
      })

      lenisRef.current = lenis

      const onRaf = (time) => {
        lenis.raf(time)
        rafRef.current = requestAnimationFrame(onRaf)
      }
      rafRef.current = requestAnimationFrame(onRaf)
    })

    return () => {
      cancelIdle(idleId)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (lenisRef.current) {
        lenisRef.current.destroy()
        lenisRef.current = null
      }
    }
  }, [pathname])

  return <div>{children}</div>
}
