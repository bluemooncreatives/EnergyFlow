import { notFound, permanentRedirect } from 'next/navigation'
import { getProductDetailsBySlug } from '@/lib/services/productService'
import { WEBSITE_PRODUCT_DETAILS } from '@/routes/WebsiteRoute'

// Old slug → new slug for products renamed for search. Consulted only when
// the old slug no longer matches a product, so an entry can be added before
// or after the rename without breaking either URL.
const RENAMED_PRODUCT_SLUGS = {
    cheery: 'candied-cherries',
}

// URL checks live here, not in page.jsx: this segment's loading.jsx wraps the
// page in a Suspense boundary, so by the time the page runs the response has
// already streamed with HTTP 200. notFound() or a redirect thrown there
// becomes a soft 404 or a client-side refresh. A layout renders outside its
// own segment's loading boundary, so these still send a real 404 / 308.
const ProductSlugLayout = async ({ children, params }) => {
    const { slug } = await params

    // Slugs are stored lower-case; send mixed-case links to the real URL.
    if (slug !== slug.toLowerCase()) permanentRedirect(WEBSITE_PRODUCT_DETAILS(slug.toLowerCase()))

    const productData = await getProductDetailsBySlug(slug)
    if (!productData) {
        const renamedTo = RENAMED_PRODUCT_SLUGS[slug]
        if (renamedTo) permanentRedirect(WEBSITE_PRODUCT_DETAILS(renamedTo))
        notFound()
    }

    return children
}

export default ProductSlugLayout
