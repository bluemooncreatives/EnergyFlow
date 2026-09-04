'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

const InstagramIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true">
        <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
    </svg>
)

const FacebookIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor" aria-hidden="true">
        <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
    </svg>
)

const instagramMedia = [
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586807/VID-20260204-WA0385_bzffp6.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586807/VID-20260223-WA0435_unfxuc.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586807/VID-20260125-WA0610_nfqkfc.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586807/VID-20260217-WA0033_nufjor.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586808/VID-20260224-WA0146_iy2bkc.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586807/VID-20260216-WA0140_c7yy8m.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1773586809/VID-20260224-WA0147_tgwjvu.mp4" },
    { type: 'image', src: "https://res.cloudinary.com/darrsi9y2/image/upload/v1783145809/mom.stitched_1770484683_3827423237227958318_47423868805_yw1u6u.png" },
    { type: 'image', src: "https://res.cloudinary.com/darrsi9y2/image/upload/v1781949038/wshhp1zggdyifk5dr9cr.jpg" },
    { type: 'image', src: "https://res.cloudinary.com/darrsi9y2/image/upload/v1781947528/qcbfdwai0pmvv97khlcw.jpg" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1783150376/mom.stitched_1772633598_3843762905699627297_47423868805_ukgg1i.mp4" },
    { type: 'video', src: "https://res.cloudinary.com/darrsi9y2/video/upload/v1783150426/mom.stitched_1747282614_3632379012031112385_47423868805_b4cbag.mp4" },
]

const InstagramReelsMarquee = () => {
    const trackRef = useRef(null)
    const reels = [...instagramMedia, ...instagramMedia]

    useEffect(() => {
        if (!trackRef.current) return
        const videos = Array.from(trackRef.current.querySelectorAll('video'))

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.play().catch(() => {})
                    } else {
                        entry.target.pause()
                    }
                })
            },
            { rootMargin: '0px 200px 0px 200px', threshold: 0 }
        )

        videos.forEach((v) => observer.observe(v))
        return () => observer.disconnect()
    }, [])

    return (
        <section className="relative overflow-hidden bg-background pt-[clamp(1.25rem,2.5vw,2rem)] pb-[clamp(2rem,4vw,3.5rem)]">
            <div className="website-gutter relative z-20 mb-6 flex items-center justify-between gap-6">
                <h2 className="text-left text-[clamp(1.8rem,4.8vw,3.8rem)] font-medium uppercase text-[var(--dark-red-2)] z-50">
                    Gallery
                </h2>
                <div className="flex shrink-0 items-center gap-4 text-[var(--dark-red-2)]">
                    <Link
                        href="https://www.instagram.com/mom.stitched"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open Energyflow on Instagram"
                    >
                        <InstagramIcon className="size-8" />
                    </Link>
                    <Link
                        href="https://www.facebook.com/profile.php?id=100087738263074"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open Energyflow on Facebook"
                    >
                        <FacebookIcon className="size-8" />
                    </Link>
                </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background via-background/70 to-transparent sm:w-24" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background via-background/70 to-transparent sm:w-24" />

            <div className="instagram-marquee">
                <div className="instagram-track" ref={trackRef}>
                    {reels.map((item, index) => (
                        <div key={`${item.src}-${index}`} className="instagram-card">
                            {item.type === 'image' ? (
                                <img
                                    src={item.src}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <video
                                    src={item.src}
                                    muted
                                    playsInline
                                    loop
                                    preload="none"
                                    aria-hidden="true"
                                    className="h-full w-full object-cover"
                                >
                                    <track kind="captions" src="/assets/captions/empty.vtt" srcLang="en" label="No captions — decorative video" />
                                </video>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .instagram-marquee {
                    width: 100%;
                    overflow: hidden;
                }
                .instagram-track {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    width: max-content;
                    animation: insta-marquee 36s linear infinite;
                    will-change: transform;
                }
                .instagram-card {
                    width: 200px;
                    aspect-ratio: 9 / 16;
                    border-radius: var(--admin-shell-radius);
                    overflow: hidden;
                    background: var(--brand-warm-bg);
                    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
                }
                @media (min-width: 640px) {
                    .instagram-card {
                        width: 230px;
                    }
                }
                @media (min-width: 1024px) {
                    .instagram-card {
                        width: 260px;
                    }
                }
                @keyframes insta-marquee {
                    0% {
                        transform: translateX(0%);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </section>
    )
}

export default InstagramReelsMarquee
