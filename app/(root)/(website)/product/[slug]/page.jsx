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
        openGraph: {
            title: product?.name,
            description,
            images: image ? [{ url: image }] : [],
            type: 'website',
        },
    }
}

const ProductPage = async ({ params, searchParams }) => {
    const { slug } = await params
    const { color, size } = await searchParams

    const productData = await getProductDetailsBySlug(slug, size, color)

    if (!productData) notFound()

    // Fetch the cached pool, then randomly pick 4 so the rail varies each visit.
    const relatedPool = await getRelatedProducts(
        productData.product._id,
        productData.product.category?._id
    )
    const relatedProducts = pickRandom(relatedPool, 4)

    return (
        <ProductDetails
            product={productData.product}
            variant={productData.variant}
            colors={productData.colors}
            colorEntries={productData.colorEntries}
            sizes={productData.sizes}
            variantOptions={productData.variantOptions}
            reviewCount={productData.reviewCount}
            ratingAvg={productData.ratingAvg}
            relatedProducts={relatedProducts}
        />
    )
}

export default ProductPage
