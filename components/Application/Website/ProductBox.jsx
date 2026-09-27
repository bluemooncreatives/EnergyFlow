'use client'

import { memo } from 'react'
import ProductCard from '@/components/Application/Website/storefront/ProductCard'

// Shop / related-products card. A thin wrapper over the storefront ProductCard
// so every product on the site shares one design: image gallery, quick view,
// and the Add to cart + Buy now pair.
const ProductBox = ({ product, priority = false }) => (
    <ProductCard
        product={product}
        priority={priority}
        gallery
        actions="full"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
    />
)

export default memo(ProductBox)
