'use client'

import { useState } from 'react'
import Image from 'next/image'

const sourceKey = (src) => typeof src === 'string' ? src : src?.src || ''

function ImageWithFallback({ src, fallbackSrc, alt = '', fallbackAlt = '', style, ...props }) {
    const [failed, setFailed] = useState(0)
    const fallback = fallbackSrc && sourceKey(fallbackSrc) !== sourceKey(src)
    if (failed > 1 || (failed && !fallback)) return null
    return <Image {...props} src={failed ? fallbackSrc : src} alt={failed ? fallbackAlt : alt}
        style={failed ? { ...style, objectPosition: 'center' } : style}
        onError={() => setFailed((count) => count + 1)} />
}

// Reset failed state when a newly saved cover arrives. After both sources fail,
// leave the card's existing branded background and readable link visible.
export default function CoverImage(props) {
    if (!props.src) return null
    return <ImageWithFallback key={`${sourceKey(props.src)}|${sourceKey(props.fallbackSrc)}`} {...props} />
}
