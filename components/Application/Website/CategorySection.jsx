'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Category data - using existing images from assets
const CATEGORIES = [
    { 
        label: 'mens', 
        name: 'MENS',
        image: '/assets/images/hero/01.webp',
        href: `${WEBSITE_SHOP}?category=mens`
    },
    { 
        label: 'womens', 
        name: 'WOMENS',
        image: '/assets/images/hero/02.jpg',
        href: `${WEBSITE_SHOP}?category=womens`
    },
    { 
        label: 'kids', 
        name: 'KIDS',
        image: '/assets/images/hero/03.jpg',
        href: `${WEBSITE_SHOP}?category=kids`
    },
    { 
        label: 'outwear', 
        name: 'OUTWEAR',
        image: '/assets/images/slider-1.png',
        href: `${WEBSITE_SHOP}?category=outwear`
    },
    { 
        label: 'hoodies', 
        name: 'HOODIES & SWEATSHIRTS',
        image: '/assets/images/slider-2.png',
        href: `${WEBSITE_SHOP}?category=hoodies`
    },
    { 
        label: 'dresses', 
        name: 'DRESSES & SKIRTS',
        image: '/assets/images/slider-3.png',
        href: `${WEBSITE_SHOP}?category=dresses`
    },
    { 
        label: 'tshirts', 
        name: 'T-SHIRTS',
        image: '/assets/images/slider-4.png',
        href: `${WEBSITE_SHOP}?category=t-shirts`
    },
    { 
        label: 'trousers', 
        name: 'TROUSERS & SHORTS',
        image: '/assets/images/banner1.png',
        href: `${WEBSITE_SHOP}?category=trousers`
    }
]

const CategorySection = () => {
    const wrapperRef = useRef(null)
    const categoriesRef = useRef([])

    useEffect(() => {
        if (!wrapperRef.current) return

        const wrapper = wrapperRef.current
        const ctx = gsap.context(() => {
            // Set initial state for all images
            gsap.set('.category-image', {
                opacity: 0,
                scale: 0.9,
                zIndex: -1
            })

            // Mouse move handler - images follow cursor
            const handleMouseMove = (e) => {
                const rect = wrapper.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top

                gsap.to('.category-image', {
                    x: x,
                    y: y,
                    xPercent: -50,
                    yPercent: -50,
                    stagger: 0.05,
                    duration: 0.4,
                    ease: 'power2.out'
                })
            }

            wrapper.addEventListener('mousemove', handleMouseMove)

            // Category hover handlers
            categoriesRef.current.forEach((category) => {
                if (!category) return
                const label = category.dataset.label

                const handleMouseEnter = () => {
                    gsap.to(`[data-image="${label}"]`, {
                        opacity: 1,
                        scale: 1,
                        zIndex: 10,
                        duration: 0.3,
                        ease: 'power2.out'
                    })
                }

                const handleMouseLeave = () => {
                    gsap.to(`[data-image="${label}"]`, {
                        opacity: 0,
                        scale: 0.9,
                        zIndex: -1,
                        duration: 0.3,
                        ease: 'power2.in'
                    })
                }

                category.addEventListener('mouseenter', handleMouseEnter)
                category.addEventListener('mouseleave', handleMouseLeave)

                category._cleanup = () => {
                    category.removeEventListener('mouseenter', handleMouseEnter)
                    category.removeEventListener('mouseleave', handleMouseLeave)
                }
            })

            return () => {
                wrapper.removeEventListener('mousemove', handleMouseMove)
                categoriesRef.current.forEach((cat) => cat?._cleanup?.())
            }
        }, wrapper)

        return () => ctx.revert()
    }, [])

    return (
        <section 
            ref={wrapperRef}
            className="relative w-full py-16 lg:py-24 px-4 sm:px-8 lg:px-10 overflow-hidden bg-[var(--brand-cream)]"
        >
            {/* Images container */}
            <div className="images-container absolute inset-0 pointer-events-none z-50">
                {CATEGORIES.map((category) => (
                    <div
                        key={category.label}
                        data-image={category.label}
                        className="category-image absolute w-[280px] h-[350px] sm:w-[320px] sm:h-[400px] lg:w-[360px] lg:h-[450px] opacity-0 rounded-lg overflow-hidden shadow-2xl"
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <Image
                            src={category.image}
                            alt={category.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 360px"
                        />
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w mx-auto">
                {/* Title */}
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-normal mb-12 lg:mb-16 tracking-wide text-foreground/85">
                    CATEGORIES
                </h2>

                {/* Categories List */}
                <div className="space-y-0">
                    {CATEGORIES.map((category, index) => (
                        <div key={category.label}>
                            {/* Divider */}
                            <div className="w-full h-[1px] bg-foreground/20" />
                            
                            {/* Category Row */}
                            <Link
                                href={category.href}
                                ref={(el) => (categoriesRef.current[index] = el)}
                                data-label={category.label}
                                className="category-row group flex items-center justify-between py-6 lg:py-8 transition-all duration-300 hover:bg-white/40"
                            >
                                {/* Left: Number */}
                                <div className="w-16 sm:w-20 lg:w-24 flex-shrink-0">
                                    <span className="text-xl sm:text-2xl lg:text-3xl font-light text-foreground/45 group-hover:text-foreground/85 transition-colors">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Middle: Category Name */}
                                <div className="flex-1">
                                    <h3 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-light tracking-wide text-foreground/85 group-hover:text-foreground transition-colors">
                                        {category.name}
                                    </h3>
                                </div>

                                {/* Right: Arrow */}
                                <div className="w-12 sm:w-16 lg:w-20 flex justify-end flex-shrink-0">
                                    <div className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                                        <ArrowUpRight
                                            className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-foreground/45 group-hover:text-foreground/85"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                    
                    {/* Final Bottom Divider */}
                    <div className="w-full h-[1px] bg-foreground/20" />
                </div>
            </div>
        </section>
    )
}

export default CategorySection
