// next/image loader that serves Cloudinary assets straight from Cloudinary's
// CDN instead of proxying through /_next/image. The proxy added a second
// origin hop to every product image, and Cloudinary's own f_auto/q_auto picks
// AVIF/WebP + per-image quality better than a fixed q=82 — Lighthouse measured
// ~150 KiB of savings on a product page from this alone.
const cloudinaryLoader = ({ src, width, quality }) => {
    const marker = '/image/upload/'
    const idx = src.indexOf(marker)
    if (idx === -1) {
        // Non-Cloudinary src (e.g. the local placeholder) — keep the default
        // Next.js optimizer URL so those still work through /_next/image.
        return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 82}`
    }
    // q_auto:eco rather than plain q_auto: on this account plain q_auto made
    // f_auto fall back to JPEG for small widths (thumbnails came back ~35 KB
    // instead of ~22 KB WebP), and eco trims 15–30% off every product photo
    // with no visible loss at display size.
    const transforms = `f_auto,q_auto:eco,c_limit,w_${width}`
    return `${src.slice(0, idx + marker.length)}${transforms}/${src.slice(idx + marker.length)}`
}

export default cloudinaryLoader
