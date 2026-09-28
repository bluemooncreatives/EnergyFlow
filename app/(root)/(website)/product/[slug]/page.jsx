import { notFound, permanentRedirect } from 'next/navigation'
import ProductDetails from './ProductDetails'
import { getProductDetailsBySlug, getRelatedProducts } from '@/lib/services/productService'
import { htmlToText, pickRandom } from '@/lib/utils'
import {
    JsonLd,
    RETURN_POLICY,
    SHIPPING_DETAILS,
    absoluteUrl,
    breadcrumbSchema,
    formatCategoryName,
    formatProductName,
    pageTitle,
    toMetaDescription,
} from '@/lib/seo'
import { WEBSITE_CATEGORY, WEBSITE_PRODUCT_DETAILS, WEBSITE_SHOP } from '@/routes/WebsiteRoute'

// Catalogue names are typed by hand ("CHIA  SEED", " Millets & Grains"), so
// every name that reaches the page, its head and its schema goes through the
// same clean-up.
const normalizeProduct = (product) => ({
    ...product,
    name: formatProductName(product?.name),
    category: product?.category
        ? { ...product.category, name: formatCategoryName(product.category.name) }
        : product?.category,
})

// "Buy Chia Seed Online (200g)" reads as the query shoppers type. The
// " | Energyflow" suffix comes from the root title template.
const buildTitle = (product, variant) => {
    const size = variant?.size ? ` (${variant.size})` : ''
    const title = `Buy ${product.name} Online${size}`
    const category = product.category?.name
    const withCategory = category ? `${title} – ${category}` : title
    return withCategory.length <= 60 ? withCategory : title
}

const buildDescription = (product, variant) => {
    const body = htmlToText(product?.description)
    const price = variant?.sellingPrice ? ` at ₹${variant.sellingPrice}` : ''
    const lead = `Buy ${product.name}${variant?.size ? ` ${variant.size}` : ''} online${price}.`
    return toMetaDescription(body ? `${lead} ${body}` : `${lead} Quality checked and delivered across India by Energyflow.`)
}

export async function generateMetadata({ params, searchParams }) {
    const { slug } = await params
    const { size } = await searchParams
    const productData = await getProductDetailsBySlug(slug, size)
    if (!productData) return { title: 'Product not found', robots: { index: false } }

    const product = normalizeProduct(productData.product)
    const title = buildTitle(product, productData.variant)
    const description = buildDescription(product, productData.variant)
    const images = (product?.media || [])
        .filter((item) => item?.secure_url)
        .slice(0, 4)
        .map((item) => ({ url: item.secure_url, alt: item.alt || product.name }))
    const path = WEBSITE_PRODUCT_DETAILS(product.slug || slug)

    return {
        title: pageTitle(title),
        description,
        // Pack-size URLs (?size=500g) are the same product, so they all
        // consolidate onto the clean product URL.
        alternates: { canonical: path },
        openGraph: {
            title: `${product.name} | Energyflow`,
            description,
            url: path,
            images,
        },
        twitter: {
            title: `${product.name} | Energyflow`,
            description,
            images: images.map((image) => image.url),
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
    const url = absoluteUrl(WEBSITE_PRODUCT_DETAILS(product?.slug))

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: variant?.size ? `${product.name} ${variant.size}` : product.name,
        description: htmlToText(product?.description).slice(0, 5000),
        sku: variant?.sku || product?.parentSku,
        image: images,
        url,
        brand: { '@type': 'Brand', name: 'Energyflow' },
        offers: {
            '@type': 'Offer',
            price: variant?.sellingPrice,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            url,
            seller: { '@type': 'Organization', name: 'Energyflow' },
            shippingDetails: SHIPPING_DETAILS,
            hasMerchantReturnPolicy: RETURN_POLICY,
        },
    }

    if (product?.category?.name) schema.category = product.category.name
    if (variant?.size) schema.size = variant.size

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

    // Slugs are stored lower-case; send mixed-case links to the real URL
    // instead of a 404.
    if (slug !== slug.toLowerCase()) {
        permanentRedirect(`${WEBSITE_PRODUCT_DETAILS(slug.toLowerCase())}${size ? `?size=${encodeURIComponent(size)}` : ''}`)
    }

    const productData = await getProductDetailsBySlug(slug, size)

    if (!productData) notFound()

    const product = normalizeProduct(productData.product)

    // Fetch the cached pool, then randomly pick 4 so the rail varies each visit.
    const relatedPool = await getRelatedProducts(
        product._id,
        product.category?._id
    )
    const relatedProducts = pickRandom(relatedPool, 4)

    const productSchema = buildProductSchema({
        product,
        variant: productData.variant,
        reviewCount: productData.reviewCount,
        ratingAvg: productData.ratingAvg,
    })

    const crumbs = [
        { name: 'Home', path: '/' },
        { name: 'Shop', path: WEBSITE_SHOP },
        ...(product.category?.slug ? [{ name: product.category.name, path: WEBSITE_CATEGORY(product.category.slug) }] : []),
        { name: product.name, path: WEBSITE_PRODUCT_DETAILS(product.slug) },
    ]

    return (
        <>
            <JsonLd data={productSchema} />
            <JsonLd data={breadcrumbSchema(crumbs)} />
            <ProductDetails
                product={product}
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
