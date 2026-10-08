import Marquee from './storefront/Marquee'
import mixedNuts from '@/public/assets/images/marquee/mixed-nuts.webp'
import cashews from '@/public/assets/images/marquee/cashews.webp'
import chocolates from '@/public/assets/images/marquee/chocolates.webp'
import fruitJellies from '@/public/assets/images/marquee/fruit-jellies.webp'
import bilonaGhee from '@/public/assets/images/marquee/bilona-ghee.webp'

// Short, checkable claims for the band under the hero, each followed by a
// product cut-out. Keep them in step with the promise band (BenefitsSection)
// and the FAQ answers.
const PROMISES = [
    { label: 'Freshly sourced', image: mixedNuts },
    { label: 'Every lot quality checked', image: cashews },
    { label: 'Delivered across India', image: chocolates },
    { label: 'Tracked to your door', image: fruitJellies },
    { label: 'Bulk & gifting orders', image: bilonaGhee },
]

// The sunflower band from the brand reference: pine type on sunflower, ruled
// top and bottom in pine. Pinned to the fixed palette, so it reads the same
// in light and dark mode.
const PromiseTicker = () => (
    <section
        aria-label="The Energyflow promise"
        className="relative overflow-hidden border-y border-[var(--palette-pine)] bg-[var(--surface-sun)] py-3 text-[var(--palette-pine)] sm:py-4"
    >
        <Marquee items={PROMISES} label="Our promises" />
    </section>
)

export default PromiseTicker
