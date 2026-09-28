'use client'

import { useCallback, useState } from 'react'

/**
 * Local reordering for admin curation lists (testimonials, bestsellers,
 * freshly arrived).
 *
 *  • Drag and drop (native HTML5, mouse) and move up / down (buttons,
 *    keyboard, touch) share one code path.
 *  • The last saved order is kept, so "Discard" restores it exactly and
 *    `dirty` is true only when the order really differs.
 *
 * `load(list)` sets a fresh list from the server (and marks it saved).
 */
export const useReorderList = () => {
    const [items, setItems] = useState([])
    const [savedIds, setSavedIds] = useState([])
    const [dragIndex, setDragIndex] = useState(null)
    const [overIndex, setOverIndex] = useState(null)

    const load = useCallback((list) => {
        const next = Array.isArray(list) ? list : []
        setSavedIds(next.map((item) => item._id))
        setItems(next)
    }, [])

    const moveTo = useCallback((from, to) => {
        setItems((prev) => {
            if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
            const next = [...prev]
            const [moved] = next.splice(from, 1)
            next.splice(to, 0, moved)
            return next
        })
    }, [])

    const move = useCallback((index, dir) => moveTo(index, index + dir), [moveTo])

    const discard = useCallback(() => {
        setItems((prev) => {
            const byId = new Map(prev.map((item) => [item._id, item]))
            return savedIds.map((id) => byId.get(id)).filter(Boolean)
        })
    }, [savedIds])

    const markSaved = useCallback(() => {
        setSavedIds(items.map((item) => item._id))
    }, [items])

    const dirty = items.length === savedIds.length && items.some((item, i) => item._id !== savedIds[i])

    // Props for each draggable row.
    const dragProps = (index, enabled = true) => enabled ? {
        draggable: true,
        'data-dragging': dragIndex === index ? '' : undefined,
        'data-over': overIndex === index && dragIndex !== null && dragIndex !== index ? '' : undefined,
        onDragStart: (event) => {
            setDragIndex(index)
            event.dataTransfer.effectAllowed = 'move'
            // Firefox needs data set for a drag to start.
            event.dataTransfer.setData('text/plain', String(index))
        },
        onDragOver: (event) => {
            if (dragIndex === null) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            if (overIndex !== index) setOverIndex(index)
        },
        onDrop: (event) => {
            event.preventDefault()
            if (dragIndex !== null) moveTo(dragIndex, index)
            setDragIndex(null)
            setOverIndex(null)
        },
        onDragEnd: () => {
            setDragIndex(null)
            setOverIndex(null)
        },
    } : {}

    return { items, setItems, load, move, moveTo, discard, markSaved, dirty, dragProps, dragging: dragIndex !== null }
}

export default useReorderList
