'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import LazyHydrate from '@/components/Application/LazyHydrate'
import PromiseTicker from '@/components/Application/Website/PromiseTicker'
import { tintAt } from '@/components/Application/Website/storefront/format'
import ProductGallery from '@/components/Application/Website/product/ProductGallery'
import ProductBuyBox from '@/components/Application/Website/product/ProductBuyBox'
import ProductStory from '@/components/Application/Website/product/ProductStory'
import ProductAssurance from '@/components/Application/Website/product/ProductAssurance'
import ProductCompany from '@/components/Application/Website/product/ProductCompany'
import FAQSection from '@/components/Application/Website/FAQSection'
import RelatedProducts from '@/components/Application/Website/product/RelatedProducts'
import StickyBuyBar from '@/components/Application/Website/product/StickyBuyBar'
import { useProductCart } from '@/components/Application/Website/product/useProductCart'
import { flyToCart, galleryFor, savingOf } from '@/components/Application/Website/product/productUtils'
import { useReveal } from '@/hooks/useReveal'
import { WEBSITE_CATEGORY, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Split the heavy client-only island out of the page's hydration chunk.
// ProductReveiw drags in react-hook-form, zod, tanstack-query and axios but
// renders nothing until its own client fetches resolve, so there is no SSR
// markup to lose.
const ProductReveiw = dynamic(() => import('@/components/Application/Website/ProductReveiw'), { ssr: false })

// A stable tint per product, so the same product always sits on the same
// colour and neighbouring products differ.
const tintFor = (seed = '') => tintAt([...String(seed)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0))

/**
 * Product details page.
 *
 *   Hero      gallery (sticky on desktop) + buy box
 *   Band      the sunflower promise ticker
 *   Details   spec sheet + full description
 *   Policies  shipping & returns
 *   Company   who's behind the pack: store, promises, contact
 *   FAQ       product + category questions (lib/productFaq.js)
 *   Reviews   summary + list + composer
 *   Related   "You may also like" rail
 *   Sticky    compact buy bar once the main buttons scroll away
 *
 * Every pack size arrives with the page, so switching size is instant: the
 * price counts to its new value, the gallery swaps photos, and the URL's
 * ?size= is updated in place (shareable, no new history entry, no refetch).
 */
const ProductDetails = ({
    product,
    variants,
    initialVariantId,
    reviewCount,
    ratingAvg,
    relatedProducts = [],
    faqs = [],
    descriptionHtml,
    summary,
}) => {
    const scopeRef = useRef(null)
    const stageRef = useRef(null)
    const ctaRef = useRef(null)
    const [selectedId, setSelectedId] = useState(initialVariantId)

    // Back / forward to another ?size= renders this page with new props.
    useEffect(() => { setSelectedId(initialVariantId) }, [initialVariantId])

    const variant = variants.find((v) => v._id === selectedId) || variants[0] || null
    const name = product.name || 'Product'

    const images = useMemo(
        () => galleryFor(variant, product, imgPlaceholder.src, name),
        [variant, product, name]
    )
    const cart = useProductCart(product, variant, images[0]?.src)

    const selectVariant = useCallback((next) => {
        if (!next?._id) return
        setSelectedId(next._id)
        const url = new URL(window.location.href)
        url.searchParams.set('size', next.size)
        window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }, [])

    // `source` is where the fly-to-cart photo starts: the gallery by default,
    // the sticky bar's thumbnail when adding from there.
    const addToCart = useCallback((qty, source) => {
        const added = cart.add(qty)
        if (added) flyToCart(source || stageRef.current, images[0]?.src)
        return added
    }, [cart, images])

    useReveal(scopeRef)

    const badges = [
        product.isBestseller && 'Bestseller',
        product.isFreshlyArrived && 'Fresh arrival',
    ].filter(Boolean)

    return (
        <div ref={scopeRef}>
            <section className="pb-[var(--section-space)] pt-[clamp(6.25rem,10vw,8rem)]">
                <div className="ef-container">
                    <Breadcrumb className="ef-pd-in mb-6 lg:mb-8">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={WEBSITE_SHOP}>Shop</BreadcrumbLink>
                            </BreadcrumbItem>
                            {product.category?.slug && (
                                <>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink href={WEBSITE_CATEGORY(product.category.slug)}>
                                            {product.category.name}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            )}
                            <BreadcrumbSeparator className="max-sm:hidden" />
                            <BreadcrumbItem className="max-sm:hidden">
                                <BreadcrumbPage className="max-w-[16rem] truncate">{name}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 xl:gap-20">
                        <div className="min-w-0 lg:sticky lg:top-28">
                            <ProductGallery
                                ref={stageRef}
                                images={images}
                                name={name}
                                badges={badges}
                                discount={savingOf(variant).percent}
                                tint={tintFor(product.slug)}
                            />
                        </div>

                        <ProductBuyBox
                            ref={ctaRef}
                            product={product}
                            variant={variant}
                            variants={variants}
                            onSelectVariant={selectVariant}
                            cart={cart}
                            onAdd={addToCart}
                            reviewCount={reviewCount}
                            ratingAvg={ratingAvg}
                            summary={summary}
                            hasDetails={Boolean(descriptionHtml)}
                        />
                    </div>
                </div>
            </section>

            <PromiseTicker />

            <ProductStory product={product} variant={variant} variants={variants} html={descriptionHtml} />

            <ProductAssurance />

            <ProductCompany productName={name} />

            <FAQSection
                tone="sunken"
                faqs={faqs}
                eyebrow={product.category?.name ? `${product.category.name} · FAQ` : 'FAQ'}
                title="Questions about"
                accent="this product"
                lead={`Pack sizes, storage, delivery and returns for ${name}${product.category?.name ? `, plus what people ask about ${product.category.name.toLowerCase()}` : ''}.`}
            />

            <div id="reviews" className="scroll-mt-28 py-[var(--section-space)]">
                <LazyHydrate>
                    <ProductReveiw productId={product._id} productName={name} />
                </LazyHydrate>
            </div>

            {relatedProducts.length > 0 && (
                <div className="border-t border-line-soft">
                    <LazyHydrate>
                        <RelatedProducts products={relatedProducts} category={product.category} />
                    </LazyHydrate>
                </div>
            )}

            <StickyBuyBar
                watchRef={ctaRef}
                product={product}
                variant={variant}
                image={images[0]}
                cart={cart}
                onAdd={addToCart}
            />
        </div>
    )
}

export default ProductDetails
