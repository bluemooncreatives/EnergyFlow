'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, ChevronLeft, ChevronRight, GripVertical, ImagePlus, Plus, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_PRODUCT_MEDIA } from '@/lib/productMedia'
import { cn } from '@/lib/utils'

/* ================================================================
   ORDERED IMAGES — the media field of the product and variant forms
   The list order is the storefront order: the first image is the main
   one. Reorder by dragging (mouse, touch, or keyboard: focus an image,
   Space to lift, arrow keys to move, Space to drop), or with each
   image's buttons: make main, move left / right, remove.

   value    — [{ _id, url, alt?, unavailable? }] in display order
   onChange — receives the reordered / trimmed list
   onBrowse — opens the media library to add images
   kind     — 'product' | 'variant' (only the explanation differs)
   ================================================================ */

const COPY = {
    product: {
        main: 'Shown on product cards, in the cart and first on the product page.',
        rest: 'The rest follow in this order in the product page gallery.',
    },
    variant: {
        main: 'Shown first on the product page when a shopper picks this pack.',
        rest: 'The rest follow in this order. With no images of its own, a pack shows the product’s.',
    },
}

// Buttons inside a tile must not start a keyboard drag (the tile itself
// listens for Space / Enter) or a pointer drag.
const stop = (event) => event.stopPropagation()

const TileButton = ({ label, onClick, disabled, className, children }) => (
    <button
        type="button"
        onClick={onClick}
        onKeyDown={stop}
        onPointerDown={stop}
        onMouseDown={stop}
        onTouchStart={stop}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn(
            'grid size-7 place-items-center rounded-md bg-background/95 text-foreground shadow-sm ring-1 ring-border transition hover:bg-background disabled:pointer-events-none disabled:opacity-40',
            className
        )}
    >
        {children}
    </button>
)

const TileImage = ({ media, priority }) => (
    <Image
        src={media.url}
        alt={media.alt || ''}
        fill
        sizes="(min-width: 1280px) 14vw, (min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
        className="pointer-events-none select-none object-cover"
        draggable={false}
        priority={priority}
    />
)

const SortableTile = ({ media, index, count, onMakeMain, onMove, onRemove, disabled }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: media._id, disabled })
    const isMain = index === 0
    const position = index + 1

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'group relative aspect-square list-none touch-manipulation overflow-hidden rounded-lg border bg-muted outline-none',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                disabled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                isMain && !media.unavailable && 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background',
                media.unavailable && 'border-destructive ring-2 ring-destructive/60',
                isDragging && 'z-10 opacity-40'
            )}
            {...attributes}
            {...listeners}
            aria-roledescription="sortable image"
            aria-label={`${isMain ? 'Main image' : `Image ${position}`} of ${count}${media.unavailable ? ', in the trash' : ''}. Press Space to move it.`}
        >
            <TileImage media={media} priority={isMain} />

            {media.unavailable && (
                <span className="absolute inset-0 grid place-items-center bg-destructive/55 p-2 text-center text-xs font-semibold text-white">
                    <span className="flex flex-col items-center gap-1">
                        <AlertTriangle className="size-4" aria-hidden="true" />
                        In the trash, remove it
                    </span>
                </span>
            )}

            {/* Position: the main image is labelled, the rest numbered */}
            <span
                aria-hidden="true"
                className={cn(
                    'absolute left-2 top-2 inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-semibold tabular-nums shadow-sm',
                    isMain ? 'bg-primary text-primary-foreground' : 'bg-background/95 text-foreground ring-1 ring-border'
                )}
            >
                {isMain ? <><Star className="size-3 fill-current" /> Main</> : position}
            </span>

            <TileButton label={`Remove image ${position}`} onClick={() => onRemove(index)} className="absolute right-2 top-2 hover:text-destructive" disabled={disabled}>
                <X className="size-3.5" />
            </TileButton>

            {/* Actions: always on touch screens, on hover / focus with a mouse */}
            <div
                className={cn(
                    'absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 transition-opacity',
                    'opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100'
                )}
            >
                <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-background/95 text-muted-foreground shadow-sm ring-1 ring-border">
                    <GripVertical className="size-3.5" />
                </span>
                <div className="flex items-center gap-1">
                    <TileButton label={`Move image ${position} left`} onClick={() => onMove(index, index - 1)} disabled={disabled || index === 0}>
                        <ChevronLeft className="size-3.5" />
                    </TileButton>
                    {!isMain && (
                        <TileButton label={`Make image ${position} the main image`} onClick={() => onMakeMain(index)} disabled={disabled || media.unavailable}>
                            <Star className="size-3.5" />
                        </TileButton>
                    )}
                    <TileButton label={`Move image ${position} right`} onClick={() => onMove(index, index + 1)} disabled={disabled || index === count - 1}>
                        <ChevronRight className="size-3.5" />
                    </TileButton>
                </div>
            </div>
        </li>
    )
}

const MediaOrderField = ({ value = [], onChange, onBrowse, kind = 'product', max = MAX_PRODUCT_MEDIA, disabled = false, label = 'Images' }) => {
    const [activeId, setActiveId] = useState(null)
    const copy = COPY[kind] || COPY.product
    const count = value.length
    const unavailable = value.filter((media) => media.unavailable).length
    const full = count >= max
    const activeMedia = activeId ? value.find((media) => media._id === activeId) : null

    const sensors = useSensors(
        // A short travel threshold keeps clicks on the tile's buttons as clicks.
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        // Press and hold on touch screens, so a swipe still scrolls the page.
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const indexOf = (id) => value.findIndex((media) => media._id === id)
    const move = (from, to) => {
        if (to < 0 || to >= count || from === to) return
        onChange(arrayMove(value, from, to))
    }
    const remove = (index) => onChange(value.filter((_, i) => i !== index))

    const announce = (id, overId) => {
        const to = indexOf(overId ?? id) + 1
        return to === 1 ? 'Now the main image.' : `Now image ${to} of ${count}.`
    }

    return (
        <section aria-label={label} className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-left sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-sm font-semibold">
                        {label} <span className="text-destructive">*</span>
                    </h3>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">The first image is the main image.</span> {copy.main} {copy.rest}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={cn('text-xs tabular-nums', full ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                        {count} / {max}
                    </span>
                    {count > 0 && (
                        <Button type="button" variant="outline" size="sm" onClick={onBrowse} disabled={disabled}>
                            <ImagePlus className="size-4" aria-hidden="true" /> {full ? 'Change images' : 'Add images'}
                        </Button>
                    )}
                </div>
            </div>

            {unavailable > 0 && (
                <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {unavailable === 1 ? 'One image is in the media trash.' : `${unavailable} images are in the media trash.`} Remove {unavailable === 1 ? 'it' : 'them'} (or restore {unavailable === 1 ? 'it' : 'them'} in the media library) before saving.
                </p>
            )}

            {count === 0 ? (
                <button
                    type="button"
                    onClick={onBrowse}
                    disabled={disabled}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition hover:border-primary/60 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                >
                    <ImagePlus className="size-8 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-semibold">Add images</span>
                    <span className="text-xs text-muted-foreground">Pick from the media library. The first one you pick becomes the main image; you can change that afterwards.</span>
                </button>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={({ active }) => setActiveId(active.id)}
                    onDragCancel={() => setActiveId(null)}
                    onDragEnd={({ active, over }) => {
                        setActiveId(null)
                        if (!over || active.id === over.id) return
                        move(indexOf(active.id), indexOf(over.id))
                    }}
                    accessibility={{
                        screenReaderInstructions: {
                            draggable: 'To move an image, press Space or Enter. Use the arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.',
                        },
                        announcements: {
                            onDragStart: ({ active }) => `Picked up image ${indexOf(active.id) + 1}.`,
                            onDragOver: ({ active, over }) => (over ? announce(active.id, over.id) : undefined),
                            onDragEnd: ({ active, over }) => (over ? `Dropped. ${announce(active.id, over.id)}` : 'Dropped.'),
                            onDragCancel: () => 'Move cancelled.',
                        },
                    }}
                >
                    <SortableContext items={value.map((media) => media._id)} strategy={rectSortingStrategy}>
                        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {value.map((media, index) => (
                                <SortableTile
                                    key={media._id}
                                    media={media}
                                    index={index}
                                    count={count}
                                    onMakeMain={(from) => move(from, 0)}
                                    onMove={move}
                                    onRemove={remove}
                                    disabled={disabled}
                                />
                            ))}
                            {!full && (
                                <li className="list-none">
                                    <button
                                        type="button"
                                        onClick={onBrowse}
                                        disabled={disabled}
                                        className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-muted-foreground transition hover:border-primary/60 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
                                    >
                                        <Plus className="size-5" aria-hidden="true" />
                                        <span className="text-xs font-medium">Add images</span>
                                    </button>
                                </li>
                            )}
                        </ol>
                    </SortableContext>

                    <DragOverlay>
                        {activeMedia ? (
                            <div className="relative aspect-square w-full cursor-grabbing overflow-hidden rounded-lg border bg-muted shadow-2xl ring-2 ring-primary">
                                <TileImage media={activeMedia} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {count > 1 && (
                <p className="text-xs text-muted-foreground">
                    Drag images to reorder (press and hold on touch screens), or use <Star className="inline size-3 align-[-1px]" aria-hidden="true" /> to make one the main image.
                    {full && ` That’s the most images one ${kind === 'variant' ? 'pack' : 'product'} can have.`}
                </p>
            )}
        </section>
    )
}

export default MediaOrderField
