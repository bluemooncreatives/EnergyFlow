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
    { label: 'Free shipping', image: chocolates },
    { label: 'Delivered across India', image: fruitJellies },
    { label: 'Bulk & gifting orders', image: bilonaGhee },
]

const PromiseTicker = () => (
    <section
        aria-label="The Energyflow promise"
        className="relative overflow-hidden bg-[var(--brand-primary)] py-3 text-[var(--brand-cream)] sm:py-4"
        style={{ backgroundImage: 'var(--brand-panel-gradient)' }}
    >
        <Marquee items={PROMISES} label="Our promises" />
    </section>
)

export default PromiseTicker
