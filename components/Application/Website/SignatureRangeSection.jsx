import dynamic from 'next/dynamic'
import { getSignatureShowcase } from '@/lib/services/categoryService'
import { CATEGORY_ART, GIFTING_ART } from './storefront/categoryArt'

// GSAP-driven client logic is split into its own chunk so it does not block
// parsing/hydration of the critical path.
const SignatureRangeClient = dynamic(() => import('./SignatureRangeClient'))

const countLabel = (count) => `${count} ${count === 1 ? 'product' : 'products'}`

// With nothing to pick from the catalogue (empty, or the lookup failed) the
// fourth tile still holds the grid: hampers are quoted, so it's an enquiry.
const HAMPER_TILE = {
    key: 'hampers',
    eyebrow: 'Festive & corporate',
    title: 'Gift Hampers',
    href: '/contact',
    label: 'Plan a hamper',
    price: null,
    badge: 'Made to order',
    tint: 'var(--tint-sage)',
    media: { kind: 'cover', ...GIFTING_ART },
}

// The catalogue's pick for the fourth tile. Always a live category with
// products and a photo (see getSignatureShowcase); art-directed photography
// wins over its product photo when there is some.
const toPickTile = (pick) => {
    if (!pick) return HAMPER_TILE
    const art = CATEGORY_ART[pick.slug] ?? (pick.gifting ? GIFTING_ART : null)

    return {
        key: `category-${pick.slug}`,
        eyebrow: pick.gifting ? 'Boxed & ready to gift' : 'Customer favourite',
        title: pick.name,
        href: pick.href,
        label: `Shop ${pick.name}`,
        price: pick.priceFrom,
        badge: pick.productCount ? countLabel(pick.productCount) : null,
        tint: 'var(--tint-sage)',
        media: { kind: 'cover', src: art?.src ?? pick.image, alt: art?.alt ?? pick.alt },
    }
}

// "Made the slow way, worth gifting": the three signature lines plus one
// category from the catalogue, as a bento grid. Live counts and "from" prices
// come from the database; if that lookup fails the tiles fall back to the
// page-level availability check and render without numbers.
const SignatureRangeSection = async ({ availability = null, tone = 'page' }) => {
    const showcase = await getSignatureShowcase().catch(() => null)

    return (
        <SignatureRangeClient
            tone={tone}
            stats={showcase?.terms ?? null}
            availability={availability}
            pick={toPickTile(showcase?.pick)}
        />
    )
}

export default SignatureRangeSection
