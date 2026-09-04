'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp';
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute';

const FeaturedProductSmall = ({ product }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const el = ref.current;
            if (!el) return;

            const img = el.querySelector('img');

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse',
                },
            });

            tl.set(el, { autoAlpha: 1 });

            // Match large card animation: subtle lift and image scale reset
            tl.fromTo(
                el,
                { y: 18 },
                { y: 0, duration: 0.8, ease: 'power2.out' },
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
        }, ref);

        return () => ctx.revert();
    }, []);

    if (!product) return null;

    return (
        <Link href={WEBSITE_PRODUCT_DETAILS(product.slug)}>
            <div ref={ref} className="w-full bg-gray-200 rounded-sm overflow-hidden" style={{ aspectRatio: '1 / 1.15' }}>
                {/* Image */}
                <div className="relative w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    <Image
                        src={product?.media[0]?.secure_url || imgPlaceholder.src}
                        fill
                        alt={product?.name}
                        className="object-cover object-center w-full h-full"
                    />
                </div>
            </div>

            {/* Text Below Image */}
            <div className="mt-3 px-1">
                <h3 className="text-gray-900 font-light text-sm leading-snug line-clamp-2">
                    {product?.name}
                </h3>
                <p className="text-gray-700 font-light text-xs mt-1">
                    ₹{product?.sellingPrice?.toLocaleString('en-IN')}
                </p>
            </div>
        </Link>
    );
};

export default FeaturedProductSmall;
