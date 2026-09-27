'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const Marquee = ({ text = 'freshly arrived', repeatCount = 12, speed = 1 }) => {
    const containerRef = useRef(null)
    const innerRef = useRef(null)
    const arrowsRef = useRef([])

    const directionRef = useRef(1) // 1 = right/down, -1 = left/up
    const xRef = useRef(0)
    const tickingRef = useRef(false)

    useEffect(() => {
        if (!containerRef.current || !innerRef.current) return

        // Defer all GSAP/ScrollTrigger setup until the browser is idle so the
        // marquee never competes with hydration for the main thread (same
        // pattern as LenisProvider). The static server-rendered strip is
        // visible in the meantime; only the movement starts late.
        const requestIdle = window.requestIdleCallback?.bind(window)
            || ((cb) => setTimeout(cb, 200))
        const cancelIdle = window.cancelIdleCallback?.bind(window)
            || ((id) => clearTimeout(id))

        let cleanup = null
        const idleId = requestIdle(() => {
            cleanup = init()
        })

        return () => {
            cancelIdle(idleId)
            if (cleanup) cleanup()
        }

        function init() {
            const inner = innerRef.current

            // Get the width of one complete marquee set
            const getBounds = () => {
                const allItems = inner.querySelectorAll('.marquee__part')
                let totalWidth = 0
                allItems.forEach((item) => {
                    totalWidth += item.offsetWidth
                })
                return totalWidth / 2 // Half because we duplicate
            }

            let itemWidth = getBounds()

            // Ticker: continuous movement in direction
            const tick = () => {
                const dt = gsap.ticker.deltaRatio()
                xRef.current += directionRef.current * speed * dt
                
                // Seamless wrap: when we exceed half-width, wrap back
                if (xRef.current > 0) {
                    xRef.current -= itemWidth
                } else if (xRef.current < -itemWidth) {
                    xRef.current += itemWidth
                }

                gsap.set(inner, { x: xRef.current })
            }

            const updateArrowDirection = (direction) => {
                arrowsRef.current.forEach((arrow) => {
                    if (!arrow) return
                    if (direction === 1) {
                        arrow.classList.remove('active')
                    } else {
                        arrow.classList.add('active')
                    }
                })
            }

            const startTicker = () => {
                if (tickingRef.current) return
                gsap.ticker.add(tick)
                tickingRef.current = true
            }

            const stopTicker = () => {
                if (!tickingRef.current) return
                gsap.ticker.remove(tick)
                tickingRef.current = false
            }

            const trigger = ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top bottom',
                end: 'bottom top',
                onEnter: startTicker,
                onEnterBack: startTicker,
                onLeave: stopTicker,
                onLeaveBack: stopTicker,
                onUpdate: (self) => {
                    const nextDirection = self.direction === 1 ? 1 : -1
                    if (nextDirection === directionRef.current) return
                    directionRef.current = nextDirection
                    updateArrowDirection(nextDirection)
                }
            })

            const handleRefresh = () => {
                itemWidth = getBounds()
            }
            ScrollTrigger.addEventListener('refreshInit', handleRefresh)
            
            // Defer refresh to avoid synchronous forced reflow during hydration
            const refreshTimeout = setTimeout(() => {
                ScrollTrigger.refresh()
            }, 100)
            
            if (trigger.isActive) {
                startTicker()
            }

            return () => {
                clearTimeout(refreshTimeout)
                stopTicker()
                ScrollTrigger.removeEventListener('refreshInit', handleRefresh)
                trigger.kill()
            }
        }
    }, [speed])

    return (
        <section
            ref={containerRef}
            className='marquee-shell relative overflow-hidden bg-[var(--brand-primary)] py-4 text-[var(--brand-cream)] sm:py-5'
            aria-label={text}
        >
            <div className='marquee__inner' ref={innerRef} aria-hidden='true'>
                {Array.from({ length: repeatCount }).map((_, index) => (
                    <div key={index} className='marquee__part flex items-center flex-shrink-0 px-1 whitespace-nowrap'>
                        <span className='marquee__label whitespace-nowrap'>
                            {text}
                        </span>
                        <div
                            ref={(el) => (arrowsRef.current[index] = el)}
                            className='arrow'
                        >
                            <ArrowRight className='w-full h-full' strokeWidth={1.5} />
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .marquee-shell {
                    isolation: isolate;
                    background-image: var(--brand-panel-gradient);
                }
                .marquee__inner {
                    display: flex;
                    width: fit-content;
                    flex: auto;
                    flex-direction: row;
                    will-change: transform;
                }
                .marquee__label {
                    font-size: 1.25rem;
                    font-weight: 500;
                    letter-spacing: -0.01em;
                    line-height: 1;
                    text-transform: capitalize;
                }
                .marquee__part {
                    display: flex;
                    align-items: center;
                    flex-shrink: 0;
                    padding: 0 2px;
                }
                .arrow {
                    width: 36px;
                    height: 36px;
                    margin: 0 1.25rem;
                    padding: 8px;
                    border-radius: 9999px;
                    background: var(--brand-amber);
                    color: var(--brand-primary-deep);
                    transform: rotate(45deg);
                    transition: transform 0.8s var(--ease-out-circ);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .arrow.active {
                    transform: rotate(-135deg);
                }
                @media (min-width: 640px) {
                    .marquee__label {
                        font-size: 1.75rem;
                        letter-spacing: -0.02em;
                    }
                    .arrow {
                        width: 44px;
                        height: 44px;
                        padding: 10px;
                        margin: 0 1.75rem;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .arrow { transition: none; }
                }
            `}</style>
        </section>
    )
}

export default Marquee
