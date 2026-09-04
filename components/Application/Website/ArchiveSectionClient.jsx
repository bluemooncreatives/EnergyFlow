'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './CategoryArchiveSection.module.css'

gsap.registerPlugin(ScrollTrigger)

// Generic "archive" list used by both the homepage Categories section and the
// Shop-by-Colour section. The markup / CSS / GSAP behaviour is identical; only
// the heading copy, column labels and row data differ.
//
// Props:
//   title     — section heading
//   writeup   — intro paragraph
//   columns   — { name, meta, secondary } header labels
//   items     — [{ id, href, name, metaLabel, secondaryLabel, previewImage }]
const ArchiveSectionClient = ({ title, writeup, columns, items = [] }) => {
    const containerRef = useRef(null)
    const archiveItemsRef = useRef(null)
    const previewRef = useRef(null)

    // Latest items list kept in a ref so the long-lived pointer/scroll listeners
    // read fresh data without being torn down and rebuilt.
    const itemsRef = useRef(items)
    itemsRef.current = items

    const archiveRectRef = useRef(null)
    const mousePosRef = useRef({ x: 0, y: 0 })
    const mouseTimeoutRef = useRef(null)
    const pointerRafRef = useRef(null)
    const rectRafRef = useRef(null)
    const archiveVisibleRef = useRef(false)

    const clearMouseTimeout = () => {
        if (mouseTimeoutRef.current) {
            clearTimeout(mouseTimeoutRef.current)
            mouseTimeoutRef.current = null
        }
    }

    const updateArchiveRect = () => {
        if (!archiveItemsRef.current) return
        archiveRectRef.current = archiveItemsRef.current.getBoundingClientRect()
    }

    const isInsideArchive = (x, y) => {
        const rect = archiveRectRef.current
        if (!rect) return false

        return (
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom
        )
    }

    const removeImage = (img) => {
        if (img.dataset.removing === 'true') return

        img.dataset.removing = 'true'
        gsap.to(img, {
            scale: 0,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => img.remove()
        })
    }

    const removeAllImages = () => {
        if (!previewRef.current) return

        const previewImages = previewRef.current.querySelectorAll('img[data-preview="true"]')
        previewImages.forEach((img) => removeImage(img))
    }

    const cleanupOldImages = () => {
        if (!previewRef.current) return

        const images = previewRef.current.querySelectorAll('img[data-preview="true"]')
        if (images.length <= 1) return

        const lastImage = images[images.length - 1]
        images.forEach((img) => {
            if (img !== lastImage) removeImage(img)
        })
    }

    const createPreviewImage = (previewImage) => {
        if (!previewRef.current || !previewImage) return

        const { x, y } = mousePosRef.current
        if (!isInsideArchive(x, y)) return

        const img = document.createElement('img')
        img.src = previewImage
        img.alt = ''
        img.dataset.preview = 'true'
        img.className = styles.previewImage
        img.style.zIndex = String(Date.now())

        previewRef.current.appendChild(img)

        gsap.to(img, {
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        })
    }

    useEffect(() => {
        if (!containerRef.current) return

        updateArchiveRect()

        const context = gsap.context(() => {
            const headerRevealerP = containerRef.current.querySelectorAll(`.${styles.header} .${styles.revealer} p`)
            const rows = containerRef.current.querySelectorAll(`.${styles.item}`)

            // Set initial hidden state — all text pushed below clip
            gsap.set(headerRevealerP, { y: '100%' })
            rows.forEach((row) => {
                const pTags = row.querySelectorAll(`.${styles.revealer} p`)
                gsap.set(pTags, { y: '100%' })
            })

            // ScrollTrigger: only fire when section enters viewport
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top 75%',
                once: true,
                onEnter: () => {
                    // Phase 1: Header text reveals
                    const headerTl = gsap.timeline({
                        defaults: { ease: 'power3.out' },
                        delay: 0.15
                    })

                    headerTl.to(headerRevealerP, {
                        y: '0%',
                        duration: 0.75,
                    })

                    // Phase 2: Each row's text reveals in a staggered cascade
                    const rowTl = gsap.timeline({ delay: 0.25 })

                    rows.forEach((row, index) => {
                        const pTags = row.querySelectorAll(`.${styles.revealer} p`)
                        rowTl.to(
                            pTags,
                            { y: '0%', duration: 0.75, ease: 'power3.out' },
                            index * 0.05
                        )
                    })

                }
            })

            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top bottom',
                end: 'bottom 10%',
                onEnter: () => {
                    archiveVisibleRef.current = true
                },
                onEnterBack: () => {
                    archiveVisibleRef.current = true
                },
                onLeave: () => {
                    archiveVisibleRef.current = false
                    clearMouseTimeout()
                    removeAllImages()
                },
                onLeaveBack: () => {
                    archiveVisibleRef.current = false
                    clearMouseTimeout()
                    removeAllImages()
                }
            })

            // Scroll-triggered preview for touch / mobile — mirrors the desktop hover effect
            if (window.matchMedia('(hover: none), (pointer: coarse)').matches) {
                const showScrollPreview = (item) => {
                    cleanupOldImages()
                    if (!previewRef.current || !item?.previewImage) return
                    const img = document.createElement('img')
                    img.src = item.previewImage
                    img.alt = ''
                    img.dataset.preview = 'true'
                    img.className = styles.previewImage
                    img.style.zIndex = String(Date.now())
                    previewRef.current.appendChild(img)
                    gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out' })
                }

                const allRows = Array.from(rows)
                const lastIndex = allRows.length - 1
                const list = itemsRef.current

                allRows.forEach((row, index) => {
                    // One DOM row per item, in order.
                    const item = list[index] || null
                    ScrollTrigger.create({
                        trigger: row,
                        start: 'top 55%',
                        end: 'bottom 45%',
                        onEnter: () => showScrollPreview(item),
                        onEnterBack: () => showScrollPreview(item),
                        // Remove when last item exits downward (section ends)
                        onLeave: () => { if (index === lastIndex) removeAllImages() },
                        // Remove when first item exits upward (section starts)
                        onLeaveBack: () => { if (index === 0) removeAllImages() }
                    })
                })
            }
        }, containerRef)

        const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches

        const scheduleRectUpdate = () => {
            if (rectRafRef.current) return
            rectRafRef.current = requestAnimationFrame(() => {
                rectRafRef.current = null
                updateArchiveRect()

                // On touch devices mousePosRef is always {0,0} — skip the pointer check
                // or it would call removeAllImages() on every scroll event
                if (isTouchDevice) return

                const { x, y } = mousePosRef.current
                if (!isInsideArchive(x, y)) {
                    clearMouseTimeout()
                    removeAllImages()
                }
            })
        }

        const handleResize = () => scheduleRectUpdate()

        const handleScroll = () => {
            scheduleRectUpdate()
        }

        const handleMouseMove = (event) => {
            if (!archiveVisibleRef.current) return
            mousePosRef.current = { x: event.clientX, y: event.clientY }
            if (pointerRafRef.current) return
            pointerRafRef.current = requestAnimationFrame(() => {
                pointerRafRef.current = null
                const { x, y } = mousePosRef.current
                if (!isInsideArchive(x, y)) {
                    clearMouseTimeout()
                    removeAllImages()
                    return
                }

                clearMouseTimeout()
                mouseTimeoutRef.current = setTimeout(() => {
                    cleanupOldImages()
                }, 2000)
            })
        }

        document.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, { passive: true })

        return () => {
            clearMouseTimeout()
            removeAllImages()
            if (pointerRafRef.current) {
                cancelAnimationFrame(pointerRafRef.current)
                pointerRafRef.current = null
            }
            if (rectRafRef.current) {
                cancelAnimationFrame(rectRafRef.current)
                rectRafRef.current = null
            }
            document.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleScroll)
            context.revert()
        }
        // Rebuild the GSAP timelines / scroll triggers if the item set changes
        // (e.g. after an ISR revalidation swaps the server-fetched list).
    }, [items])

    return (
        <section className={styles.section} ref={containerRef}>
            <div className={styles.archivePage}>
                <div className={styles.archive}>
                    {(title || writeup) && (
                        <div className={styles.copyBlock}>
                            {title && <h2 className={styles.title}>{title}</h2>}
                            {writeup && <p className={styles.writeup}>{writeup}</p>}
                        </div>
                    )}

                    <div className={styles.header}>
                        <div className={styles.headerName}>
                            <div className={styles.revealer}>
                                <p className={styles.headerText}>{columns.name}</p>
                            </div>
                        </div>
                        <div className={styles.headerDesigner}>
                            <div className={styles.revealer}>
                                <p className={styles.headerText}>{columns.meta}</p>
                            </div>
                        </div>
                        <div className={styles.headerYear}>
                            <div className={styles.revealer}>
                                <p className={styles.headerText}>{columns.secondary}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.archiveItems} ref={archiveItemsRef}>
                        {items.map((item) => (
                            <Link
                                href={item.href}
                                className={styles.item}
                                key={item.id}
                                onMouseEnter={() => createPreviewImage(item.previewImage)}
                                onFocus={() => createPreviewImage(item.previewImage)}
                            >
                                <div className={styles.itemName}>
                                    <div className={styles.revealer}>
                                        <p className={styles.itemText}>{item.name}</p>
                                    </div>
                                </div>
                                <div className={styles.itemDesigner}>
                                    <div className={styles.revealer}>
                                        <p className={styles.metaText}>{item.metaLabel}</p>
                                    </div>
                                </div>
                                <div className={styles.itemYear}>
                                    <div className={styles.revealer}>
                                        <p className={styles.yearText}>{item.secondaryLabel}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>


                </div>
                <div className={styles.emptyCol}></div>
            </div>
            <div className={styles.preview} ref={previewRef} aria-hidden="true"></div>
        </section>
    )
}

export default ArchiveSectionClient
