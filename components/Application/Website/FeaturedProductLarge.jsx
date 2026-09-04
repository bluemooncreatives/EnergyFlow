'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp';
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute';

const FeaturedProductLarge = ({ product }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const el = containerRef.current;
            if (!el) return;

            const img = el.querySelector('img');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            });

            // Start hidden and slide+fade into place for a minimal effect
            tl.set(el, { autoAlpha: 0 });
            tl.fromTo(
                el,
                { y: 18, x: -10, autoAlpha: 0 },
                { y: 0, x: 0, autoAlpha: 1, duration: 0.8, ease: 'power2.out' },
                0
            );

            if (img) {
                tl.fromTo(
                    img,
                    { scale: 1.06 },
                    { scale: 1, duration: 0.9, ease: 'power2.out' },
                    0
                );
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    if (!product) return null;

    return (
        <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)}>
            <div ref={containerRef} className="reveal relative w-full bg-gray-200 rounded-sm overflow-hidden" style={{ aspectRatio: '1 / 1.29' }}>
                {/* Image */}
                <Image
                    src={product?.media[0]?.secure_url || imgPlaceholder.src}
                    fill
                    alt={product?.name}
                    className="object-cover object-center w-full h-full"
                    priority
                />

                {/* Text Overlay - Bottom Left */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                    <h3 className="text-white font-light text-lg leading-tight mb-1 line-clamp-2">
                        {product?.name}
                    </h3>
                    <p className="text-white/90 font-light text-sm">
                        ₹{product?.sellingPrice?.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default FeaturedProductLarge;
