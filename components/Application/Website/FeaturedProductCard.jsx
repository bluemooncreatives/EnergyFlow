'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute';
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FeaturedProductCard = ({ product, size = 'medium' }) => {
    const [isWishlisted, setIsWishlisted] = useState(false);
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

            // Use same subtle lift + image scale reset as large card
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

    const sizeClasses = {
        large: 'col-span-2 row-span-2',
        medium: 'col-span-1 row-span-1',
        small: 'col-span-1 row-span-1'
    };

    const imageHeightClasses = {
        large: 'h-[400px]',
        medium: 'h-[300px]',
        small: 'h-[250px]'
    };

    const discountPercentage = product?.discountPercentage || 0;

    return (
        <div ref={ref} className={`group relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 ${sizeClasses[size]} h-full`}>
            {/* Full-card link sits behind everything */}
            <Link
                href={WEBSITE_PRODUCT_DETAILS(product.slug)}
                className="absolute inset-0 z-10"
                aria-label={product?.name}
            />

            {/* Image Container */}
            <div className={`relative w-full ${imageHeightClasses[size]} bg-gray-100 overflow-hidden`}>
                <Image
                    src={product?.media[0]?.secure_url || imgPlaceholder.src}
                    fill
                    alt={product?.name}
                    sizes={
                        size === 'large'
                            ? '(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw'
                            : '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
                    }
                    className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
                    priority={size === 'large'}
                />

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end justify-center pb-4 pointer-events-none">
                    <button
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className="pointer-events-auto relative z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background rounded-full p-2 hover:bg-muted"
                    >
                        <Heart
                            size={20}
                            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'}
                        />
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4 border-t bg-background">
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 line-clamp-2 group-hover:text-gray-900 transition-colors">
                    {product?.name}
                </h3>

                {/* Pricing */}
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        ₹{product?.sellingPrice?.toLocaleString('en-IN')}
                    </span>
                    {product?.mrp > product?.sellingPrice && (
                        <span className="text-sm text-stone-500 line-through">
                            ₹{product?.mrp?.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeaturedProductCard;
