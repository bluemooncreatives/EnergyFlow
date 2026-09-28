import { notFound, permanentRedirect } from 'next/navigation'
import ProductDetails from './ProductDetails'
import { getProductDetailsBySlug, getRelatedProducts } from '@/lib/services/productService'
import { decodeHTMLDeep, htmlToText, pickRandom } from '@/lib/utils'
import {
    CloudinaryPreconnect,
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

// Old slug → new slug for products renamed for search. Consulted only when
// the old slug no longer matches a product, so an entry can be added before
// or after the rename in the admin without breaking either URL.
const RENAMED_PRODUCT_SLUGS = {
    cheery: 'candied-cherries',
}

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

// Descriptions are admin-authored CKEditor HTML (sometimes double-encoded,
// sometimes pasted from other sites). Before it is injected into the page:
// drop active content (scripts, frames, forms, inline handlers, javascript:
// URLs), drop empty paragraphs, and mark off-site links nofollow + new tab.
const sanitizeDescription = (raw) => {
    let html = decodeHTMLDeep(raw)
    if (!html.trim()) return ''

    html = html
        .replace(/<(script|style|iframe|object|embed|form|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, '')
        .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*\/?>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s(href|src|xlink:href)\s*=\s*("|')\s*(javascript|vbscript|data):[^"']*\2/gi, ' $1="#"')
        .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')

    html = html.replace(/<a\b([^>]*)>/gi, (tag, attrs) => {
        const href = attrs.match(/\shref\s*=\s*("([^"]*)"|'([^']*)')/i)
        const url = href ? (href[2] ?? href[3] ?? '') : ''
        const cleaned = attrs.replace(/\s(target|rel)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        const external = /^https?:\/\//i.test(url) && !url.startsWith(absoluteUrl('/'))
        return external
            ? `<a${cleaned} target="_blank" rel="nofollow noopener noreferrer">`
            : `<a${cleaned}>`
    })

    return htmlToText(html) ? html.trim() : ''
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

    if (!productData) {
        // A renamed product keeps its old links and rankings: once the old
        // slug stops resolving, send it permanently to the new one.
        const renamedTo = RENAMED_PRODUCT_SLUGS[slug]
        if (renamedTo) permanentRedirect(`${WEBSITE_PRODUCT_DETAILS(renamedTo)}${size ? `?size=${encodeURIComponent(size)}` : ''}`)
        notFound()
    }

    const product = normalizeProduct(productData.product)

    // Fetch the cached pool, then randomly pick 8 so the rail varies each visit.
    const relatedPool = await getRelatedProducts(
        product._id,
        product.category?._id
    )
    const relatedProducts = pickRandom(relatedPool, 8)

    // Every live pack size, for the instant size switcher. Older cache
    // entries or a lone variant still give the switcher one option.
    const variants = productData.variants?.length ? productData.variants : [productData.variant]

    // The raw description ships as sanitized HTML and a plain-text summary;
    // the client does not need the original as well.
    const { description, ...productForClient } = product

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
            <CloudinaryPreconnect />
            <JsonLd data={productSchema} />
            <JsonLd data={breadcrumbSchema(crumbs)} />
            <ProductDetails
                // A new product is a fresh page (gallery, quantity, animations);
                // a new ?size= of the same product is not.
                key={product._id}
                product={productForClient}
                variants={variants}
                initialVariantId={productData.variant._id}
                reviewCount={productData.reviewCount}
                ratingAvg={productData.ratingAvg}
                relatedProducts={relatedProducts}
                descriptionHtml={sanitizeDescription(description)}
                summary={htmlToText(description)}
            />
        </>
    )
}

export default ProductPage
