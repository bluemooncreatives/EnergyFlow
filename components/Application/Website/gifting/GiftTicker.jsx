import Marquee from '../storefront/Marquee'

/**
 * The pine strip under the hero photo (the "Summertime" reference's sale
 * ticker): short gifting promises in display caps, separated by sunflower
 * asterisks. Pinned to the fixed palette, so it reads the same in both
 * themes.
 */
const GiftTicker = ({ items = [] }) => {
    const phrases = items.map((label) => String(label).trim()).filter(Boolean)
    if (phrases.length < 2) return null

    return (
        <section aria-label="Gifting highlights" className="relative overflow-hidden bg-pine py-4 text-cream sm:py-5">
            <Marquee items={phrases.map((label) => ({ label }))} label="Gifting highlights" separator="asterisk" />
        </section>
    )
}

export default GiftTicker
