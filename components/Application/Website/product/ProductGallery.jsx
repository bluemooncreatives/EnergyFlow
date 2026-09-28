'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ArrowLeft, ArrowRight, Expand, Sparkles } from 'lucide-react'
import cloudinaryLoader from '@/lib/cloudinaryLoader'
import { cn } from '@/lib/utils'
import ProductLightbox from './ProductLightbox'
import { prefersReducedMotion } from './productUtils'

gsap.registerPlugin(useGSAP)

const SWIPE_PX = 45
const ZOOM = 1.85

// Hover zoom and the cursor label only make sense with a real mouse.
const finePointer = () =>
    typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/**
 * Product photo stage.
 *
 *  • Photos change with a direction-aware wipe; the outgoing photo drifts
 *    the other way underneath (GSAP).
 *  • Mouse: the photo zooms and pans under the pointer, a cursor label
 *    offers the fullscreen view. Touch: swipe to change, tap to expand.
 *  • Keyboard: arrow keys on the stage, every control is a real button.
 *  • One photo: no arrows, dots or thumbnails, just the stage.
 *
 * The forwarded ref points at the stage, the fly-to-cart animation's origin.
 */
const ProductGallery = forwardRef(function ProductGallery({ images, name, badges, discount, tint }, stageRef) {
    const count = images.length
    const multi = count > 1
    const [active, setActive] = useState(0)
    const [previous, setPrevious] = useState(null)
    const [lightbox, setLightbox] = useState(false)
    const direction = useRef(1)
    const busy = useRef(false)
    const gesture = useRef(null)
    const cursorRef = useRef(null)
    const scopeRef = useRef(null)
    const quick = useRef(null)
    const first = useRef(true)

    // A different photo set (another pack size) starts from its first photo.
    const setKey = images.map((img) => img.id).join('|')
    useEffect(() => {
        setActive(0)
        setPrevious(null)
    }, [setKey])

    const show = (next, dir) => {
        if (!multi) return
        const target = ((next % count) + count) % count
        if (target === active) return
        direction.current = dir ?? (target > active ? 1 : -1)
        setPrevious(active)
        setActive(target)
    }
    const step = (dir) => show(active + dir, dir)

    // ── Wipe between photos ──
    useGSAP(() => {
        if (first.current) { first.current = false; return }
        const scope = scopeRef.current
        const incoming = scope?.querySelector(`[data-slide="${active}"]`)
        const outgoing = previous !== null ? scope?.querySelector(`[data-slide="${previous}"]`) : null
        if (!incoming) return

        if (prefersReducedMotion() || !outgoing) {
            gsap.set(incoming, { clipPath: 'inset(0% 0% 0% 0%)' })
            setPrevious(null)
            return
        }

        const dir = direction.current
        busy.current = true
        gsap.timeline({
            defaults: { duration: 0.95, ease: 'expo.inOut' },
            onComplete: () => {
                busy.current = false
                gsap.set(outgoing.firstElementChild, { clearProps: 'xPercent' })
                setPrevious(null)
            },
        })
            .fromTo(incoming,
                { clipPath: dir > 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' },
                { clipPath: 'inset(0% 0% 0% 0%)' })
            .fromTo(incoming.firstElementChild, { scale: 1.18, xPercent: dir * 10 }, { scale: 1, xPercent: 0 }, 0)
            .to(outgoing.firstElementChild, { xPercent: dir * -18 }, 0)
    }, { scope: scopeRef, dependencies: [active] })

    // ── Hover zoom + cursor label (mouse only) ──
    const zoomLayer = () => scopeRef.current?.querySelector(`[data-slide="${active}"] [data-zoom]`)

    const onPointerEnter = (e) => {
        if (e.pointerType !== 'mouse' || !finePointer()) return
        const stage = stageRef.current
        const cursor = cursorRef.current
        stage?.setAttribute('data-hover', '')
        if (cursor && !quick.current) {
            quick.current = {
                x: gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' }),
                y: gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' }),
            }
        }
        const layer = zoomLayer()
        if (layer && !images[active]?.placeholder && !prefersReducedMotion()) {
            gsap.to(layer, { scale: ZOOM, duration: 0.8, ease: 'power3.out', overwrite: 'auto' })
        }
        onPointerMove(e)
    }

    const onPointerMove = (e) => {
        if (e.pointerType !== 'mouse') return
        const stage = stageRef.current
        if (!stage) return
        const rect = stage.getBoundingClientRect()
        const px = (e.clientX - rect.left) / rect.width
        const py = (e.clientY - rect.top) / rect.height
        quick.current?.x(e.clientX - rect.left + 16)
        quick.current?.y(e.clientY - rect.top + 16)

        const layer = zoomLayer()
        if (!layer || busy.current || images[active]?.placeholder || prefersReducedMotion()) return
        // Pan so the point under the pointer stays under the pointer. Scale is
        // set here too, so a photo that arrives under a hovering mouse zooms.
        gsap.to(layer, {
            scale: stage.hasAttribute('data-hover') ? ZOOM : 1,
            x: (0.5 - px) * (ZOOM - 1) * rect.width,
            y: (0.5 - py) * (ZOOM - 1) * rect.height,
            duration: 0.6,
            ease: 'power3.out',
            overwrite: 'auto',
        })
    }

    const onPointerLeave = (e) => {
        if (e.pointerType !== 'mouse') return
        stageRef.current?.removeAttribute('data-hover')
        const layer = zoomLayer()
        if (layer) gsap.to(layer, { scale: 1, x: 0, y: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' })
    }

    // Reset any zoom left on a photo that is no longer shown.
    useEffect(() => {
        const scope = scopeRef.current
        if (!scope) return
        scope.querySelectorAll('[data-zoom]').forEach((layer) => {
            if (!layer.closest(`[data-slide="${active}"]`)) gsap.set(layer, { scale: 1, x: 0, y: 0 })
        })
    }, [active])

    // ── Touch: swipe to change, tap to expand ──
    const onPointerDown = (e) => {
        gesture.current = { x: e.clientX, y: e.clientY, type: e.pointerType }
    }
    const onPointerUp = (e) => {
        const start = gesture.current
        gesture.current = null
        if (!start) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (start.type !== 'mouse' && multi && Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
            step(dx < 0 ? 1 : -1)
            return
        }
        if (Math.hypot(dx, dy) < 10) setLightbox(true)
    }

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightbox(true) }
    }

    return (
        <div ref={scopeRef} className="flex flex-col gap-3 xl:flex-row-reverse xl:gap-4">
            <div className="relative min-w-0 flex-1">
                <div
                    ref={stageRef}
                    role="group"
                    aria-roledescription="carousel"
                    aria-label={`${name} photos`}
                    tabIndex={0}
                    onKeyDown={onKeyDown}
                    onPointerEnter={onPointerEnter}
                    onPointerMove={onPointerMove}
                    onPointerLeave={onPointerLeave}
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onPointerCancel={() => { gesture.current = null }}
                    className="ef-pd-stage ef-focus aspect-[4/5] w-full cursor-zoom-in select-none focus-visible:outline-offset-[-4px] sm:aspect-square md:cursor-none"
                    style={{ '--pd-tint': tint }}
                >
                    <div className="ef-pd-stage__settle absolute inset-0">
                        {images.map((img, i) => {
                            const isActive = i === active
                            const isPrev = i === previous
                            return (
                                <div
                                    key={img.id}
                                    data-slide={i}
                                    aria-hidden={!isActive}
                                    className="absolute inset-0 overflow-hidden"
                                    style={{
                                        zIndex: isActive ? 2 : isPrev ? 1 : 0,
                                        visibility: isActive || isPrev ? 'visible' : 'hidden',
                                    }}
                                >
                                    <div className="absolute inset-0 will-change-transform">
                                        <div data-zoom className="absolute inset-0 will-change-transform">
                                            {/* fetchPriority is explicit: in Next 15 `priority`
                                                alone preloads but does not mark the LCP request
                                                high priority. */}
                                            <Image
                                                src={img.src}
                                                alt={img.alt}
                                                fill
                                                priority={i === 0}
                                                fetchPriority={i === 0 ? 'high' : 'low'}
                                                loader={img.placeholder ? undefined : cloudinaryLoader}
                                                sizes="(max-width: 1024px) 100vw, 52vw"
                                                draggable={false}
                                                className="object-cover object-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Badges */}
                    {(badges.length > 0) && (
                        <div className="pointer-events-none absolute left-3 top-3 z-[4] flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
                            {badges.map((badge) => (
                                <span key={badge} className="ef-badge ef-badge--inverse shadow-elev-1">
                                    <Sparkles className="size-3" aria-hidden="true" />
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="ef-pd-seal pointer-events-none absolute right-3 top-3 z-[4] sm:right-4 sm:top-4">
                            <span className="ef-seal ef-seal--sun size-[4.5rem] flex-col gap-0 text-center leading-none sm:size-[5.25rem]">
                                <span className="font-header text-[1.25rem] font-bold sm:text-[1.5rem]">{discount}%</span>
                                <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em]">off</span>
                            </span>
                        </div>
                    )}

                    {/* Cursor label (mouse) */}
                    <span ref={cursorRef} className="ef-pd-cursor" aria-hidden="true">
                        <Expand aria-hidden="true" /> View
                    </span>

                    {/* Expand (touch + keyboard users) */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightbox(true) }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onPointerUp={(e) => e.stopPropagation()}
                        aria-label="View photos fullscreen"
                        className="ef-focus absolute bottom-3 right-3 z-[4] flex size-10 items-center justify-center rounded-full bg-surface-card/90 text-brand shadow-elev-1 backdrop-blur-sm transition hover:bg-brand hover:text-on-brand md:hidden"
                    >
                        <Expand className="size-4" aria-hidden="true" />
                    </button>

                    {multi && (
                        <div className="absolute bottom-3 left-3 z-[4] rounded-full bg-surface-card/90 px-3 py-1.5 text-xs font-semibold tabular-nums text-ink-strong shadow-elev-1 backdrop-blur-sm sm:bottom-4 sm:left-4" aria-live="polite">
                            {String(active + 1).padStart(2, '0')}
                            <span className="text-ink-muted"> / {String(count).padStart(2, '0')}</span>
                        </div>
                    )}
                </div>

                {multi && (
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex flex-1 gap-1.5" aria-hidden="true">
                            {images.map((img, i) => (
                                <span key={img.id} className="ef-pd-seg" data-active={i <= active ? '' : undefined} />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" className="ef-icon-btn size-10" onClick={() => step(-1)} aria-label="Previous photo">
                                <ArrowLeft aria-hidden="true" />
                            </button>
                            <button type="button" className="ef-icon-btn size-10" onClick={() => step(1)} aria-label="Next photo">
                                <ArrowRight aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {multi && (
                <div className="no-scrollbar flex gap-2.5 overflow-x-auto xl:max-h-[40rem] xl:w-[5.5rem] xl:shrink-0 xl:flex-col xl:overflow-y-auto" role="tablist" aria-label="Choose a photo">
                    {images.map((img, i) => (
                        <button
                            key={img.id}
                            type="button"
                            role="tab"
                            aria-selected={i === active}
                            aria-label={`Show photo ${i + 1}`}
                            onClick={() => show(i)}
                            className={cn(
                                'ef-focus group/thumb relative aspect-square w-[4.5rem] shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-surface-well transition duration-300 xl:w-full',
                                i === active
                                    ? 'shadow-[0_0_0_2px_var(--brand-primary)]'
                                    : 'opacity-60 shadow-[inset_0_0_0_1px_var(--line-soft)] hover:opacity-100'
                            )}
                        >
                            <Image
                                src={img.src}
                                alt=""
                                fill
                                sizes="88px"
                                loader={img.placeholder ? undefined : cloudinaryLoader}
                                className="object-cover transition-transform duration-500 group-hover/thumb:scale-110 motion-reduce:transition-none"
                            />
                        </button>
                    ))}
                </div>
            )}

            <ProductLightbox
                open={lightbox}
                onOpenChange={setLightbox}
                images={images}
                index={active}
                onIndexChange={(i) => show(i)}
                name={name}
            />
        </div>
    )
})

export default ProductGallery
