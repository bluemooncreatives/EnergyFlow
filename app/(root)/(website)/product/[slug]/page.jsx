import { notFound } from 'next/navigation'
import ProductDetails from './ProductDetails'
import { getProductDetailsBySlug, getRelatedProducts } from '@/lib/services/productService'
import { htmlToText, pickRandom } from '@/lib/utils'

export async function generateMetadata({ params }) {
    const { slug } = await params
    const productData = await getProductDetailsBySlug(slug)
    if (!productData) return { title: 'Product not found' }

    const { product } = productData
    const description = htmlToText(product?.description).slice(0, 160)
    const image = product?.media?.[0]?.secure_url

    return {
        title: product?.name,
        description,
        alternates: { canonical: `/product/${slug}` },
        openGraph: {
            title: product?.name,
            description,
            images: image ? [{ url: image }] : [],
            type: 'website',
        },
    }
}

// Product structured data. This is what puts price, availability and the star
// rating into the search result itself, so it is built from the same variant
// the page renders rather than from the parent product's headline price.
const buildProductSchema = ({ product, variant, reviewCount, ratingAvg }) => {
    const images = (product?.media || [])
        .map((item) => item?.secure_url)
        .filter(Boolean)

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product?.name,
        description: htmlToText(product?.description).slice(0, 5000),
        sku: variant?.sku || product?.parentSku,
        image: images,
        brand: { '@type': 'Brand', name: 'Energyflow' },
        offers: {
            '@type': 'Offer',
            price: variant?.sellingPrice,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            url: `https://www.energyflow.com/product/${product?.slug}`,
        },
    }

    if (product?.category?.name) schema.category = product.category.name
    if (variant?.size) schema.weight = variant.size

    // Google rejects an aggregateRating with no ratings behind it, so only
    // emit it once at least one review exists.
    if (reviewCount > 0 && ratingAvg > 0) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: Number(ratingAvg).toFixed(1),
            reviewCount,
        }
    }

    return schema
}

const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const { size } = await searchParams

    const productData = await getProductDetailsBySlug(slug, size)

    if (!productData) notFound()

    // Fetch the cached pool, then randomly pick 4 so the rail varies each visit.
    const relatedPool = await getRelatedProducts(
        productData.product._id,
        productData.product.category?._id
    )
    const relatedProducts = pickRandom(relatedPool, 4)

    const productSchema = buildProductSchema({
        product: productData.product,
        variant: productData.variant,
        reviewCount: productData.reviewCount,
        ratingAvg: productData.ratingAvg,
    })

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <ProductDetails
                product={productData.product}
                variant={productData.variant}
                sizes={productData.sizes}
                reviewCount={productData.reviewCount}
                ratingAvg={productData.ratingAvg}
                relatedProducts={relatedProducts}
            />
        </>
    )
}

export default ProductPage
