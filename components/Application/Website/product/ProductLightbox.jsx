'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import cloudinaryLoader from '@/lib/cloudinaryLoader'
import { cn } from '@/lib/utils'

const SWIPE_PX = 50

// Fullscreen photo viewer. Radix handles focus trap, Esc and scroll lock;
// this adds arrow keys, swipe and a thumbnail strip. The index is owned by
// the gallery, so closing leaves the stage on the photo last viewed.
const ProductLightbox = ({ open, onOpenChange, images, index, onIndexChange, name }) => {
    const count = images.length
    const swipe = useRef(null)
    const stripRef = useRef(null)

    const go = (dir) => onIndexChange((index + dir + count) % count)

    // Keep the active thumbnail in view in the strip.
    useEffect(() => {
        if (!open) return
        const thumb = stripRef.current?.querySelector(`[data-thumb="${index}"]`)
        thumb?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }, [index, open])

    const onKeyDown = (e) => {
        if (count < 2) return
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1) }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }

    const onPointerDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY } }
    const onPointerUp = (e) => {
        const start = swipe.current
        swipe.current = null
        if (!start || count < 2) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
    }

    const current = images[Math.min(index, count - 1)]

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="ef-pd-lb fixed inset-0 z-[400] bg-[rgb(4_28_21/0.94)] backdrop-blur-md" />
                <DialogPrimitive.Content
                    onKeyDown={onKeyDown}
                    data-lenis-prevent
                    className="ef-pd-lb fixed inset-0 z-[401] flex flex-col text-[var(--palette-cream)] outline-none"
                    style={{ '--focus-color': 'var(--palette-sunflower)' }}
                >
                    <DialogPrimitive.Title className="sr-only">{name} photos</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">
                        Use the arrow keys or swipe to move between photos. Press Escape to close.
                    </DialogPrimitive.Description>

                    <div className="flex items-center justify-between gap-4 px-[var(--website-gutter)] pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
                        <p className="min-w-0 truncate font-header text-sm font-semibold uppercase tracking-[0.04em] sm:text-base">
                            {name}
                        </p>
                        <div className="flex shrink-0 items-center gap-4">
                            {count > 1 && (
                                <span className="text-sm tabular-nums text-[rgb(247_243_232/0.7)]" aria-live="polite">
                                    {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                                </span>
                            )}
                            <DialogPrimitive.Close
                                aria-label="Close photos"
                                className="ef-focus flex size-11 items-center justify-center rounded-full bg-[rgb(247_243_232/0.1)] transition hover:rotate-90 hover:bg-[rgb(247_243_232/0.2)] motion-reduce:hover:rotate-0"
                            >
                                <X className="size-5" aria-hidden="true" />
                            </DialogPrimitive.Close>
                        </div>
                    </div>

                    <div
                        className="relative min-h-0 flex-1 touch-pan-y select-none"
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUp}
                        onPointerCancel={() => { swipe.current = null }}
                    >
                        {current && (
                            <div key={current.id} className="ef-pd-lb__img absolute inset-[4%_var(--website-gutter)]">
                                <Image
                                    src={current.src}
                                    alt={current.alt}
                                    fill
                                    sizes="100vw"
                                    loader={current.placeholder ? undefined : cloudinaryLoader}
                                    draggable={false}
                                    className="object-contain"
                                />
                            </div>
                        )}

                        {count > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => go(-1)}
                                    aria-label="Previous photo"
                                    className="ef-focus absolute left-[var(--website-gutter)] top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(247_243_232/0.1)] transition hover:bg-[var(--palette-sunflower)] hover:text-[var(--palette-pine)] sm:flex"
                                >
                                    <ChevronLeft className="size-5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => go(1)}
                                    aria-label="Next photo"
                                    className="ef-focus absolute right-[var(--website-gutter)] top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-[rgb(247_243_232/0.1)] transition hover:bg-[var(--palette-sunflower)] hover:text-[var(--palette-pine)] sm:flex"
                                >
                                    <ChevronRight className="size-5" aria-hidden="true" />
                                </button>
                            </>
                        )}
                    </div>

                    {count > 1 && (
                        <div
                            ref={stripRef}
                            className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-[var(--website-gutter)] pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:justify-center"
                        >
                            {images.map((img, i) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    data-thumb={i}
                                    onClick={() => onIndexChange(i)}
                                    aria-label={`Show photo ${i + 1}`}
                                    aria-current={i === index || undefined}
                                    className={cn(
                                        'ef-focus relative size-16 shrink-0 overflow-hidden rounded-[var(--radius-control)] transition duration-300',
                                        i === index ? 'opacity-100 ring-2 ring-[var(--palette-sunflower)] ring-offset-2 ring-offset-[rgb(4_28_21)]' : 'opacity-45 hover:opacity-80'
                                    )}
                                >
                                    <Image
                                        src={img.src}
                                        alt=""
                                        fill
                                        sizes="64px"
                                        loader={img.placeholder ? undefined : cloudinaryLoader}
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    )
}

export default ProductLightbox
