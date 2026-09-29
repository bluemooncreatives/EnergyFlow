import Link from 'next/link'
import { ArrowRight, Clock, CreditCard, Headset, RefreshCw, Truck } from 'lucide-react'
import SectionHeader from '../storefront/SectionHeader'
import StoreButton from '../storefront/StoreButton'

// Keep in step with the shipping / returns policy pages and the FAQ.
const POLICIES = [
    { icon: Clock, label: 'Delivery', value: '4–7', unit: 'days', text: 'Dispatched within 1–2 business days and delivered in 4–7 days.' },
    { icon: Truck, label: 'Shipping', value: '₹0', unit: 'on prepaid', text: 'Free shipping on all prepaid orders, anywhere in India.' },
    { icon: RefreshCw, label: 'Returns', value: '7', unit: 'day window', text: 'Damaged, incorrectly sealed or wrong items reported within 7 days are replaced or refunded. Opened food packs can only be returned for a genuine quality issue.' },
    { icon: CreditCard, label: 'Refunds', value: '5–7', unit: 'business days', text: 'Refunds go back to the original payment method within 5–7 business days.' },
]

// Shipping & returns as one card on the sage band: four stat cells led by a
// big display figure, then a support strip. The 1px grid gaps show the card's
// line colour through, so the dividers hold at every column count. Hovering a
// cell draws a sunflower rule across its top and turns the seal.
const ProductAssurance = () => (
    <section aria-labelledby="assurance-title" className="ef-section ef-section--sunken">
        <div className="ef-container">
            <SectionHeader
                id="assurance-title"
                eyebrow="Good to know"
                title="Shipping &"
                accent="returns"
                description="Every order is packed fresh and tracked to your door. If anything arrives wrong, we make it right."
                action={<StoreButton href="/terms-and-conditions" variant="outline" size="sm" arrow>Full policy</StoreButton>}
            />

            <div data-reveal className="overflow-hidden rounded-[var(--radius-tile)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft),var(--elev-1)]">
                <ul className="grid grid-cols-1 list-none gap-px bg-line-soft p-0 sm:grid-cols-2 lg:grid-cols-4">
                    {POLICIES.map(({ icon: Icon, label, value, unit, text }, i) => (
                        <li key={label} className="group relative flex flex-col bg-surface-card p-6 sm:p-7 lg:p-8">
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-[var(--brand-sun)] transition-transform duration-500 ease-[var(--ease-spring)] group-hover:scale-x-100 motion-reduce:transition-none"
                            />

                            <div className="flex items-center justify-between">
                                <span className="ef-seal ef-seal--sun size-12 transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-[20deg] motion-reduce:transition-none" aria-hidden="true">
                                    <Icon strokeWidth={2} />
                                </span>
                                <span className="text-xs font-semibold tabular-nums tracking-[0.1em] text-ink-muted" aria-hidden="true">
                                    {String(i + 1).padStart(2, '0')}
                                </span>
                            </div>

                            <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</h3>
                            <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-ink-strong">
                                <span className="font-header text-[clamp(2.25rem,1.8rem+1.4vw,3rem)] font-semibold leading-none tabular-nums">{value}</span>
                                <span className="font-header text-base font-semibold uppercase leading-tight">{unit}</span>
                            </p>

                            <p className="mt-4 border-t border-dashed border-line-strong pt-4 text-[0.9375rem] leading-relaxed text-ink-body">{text}</p>
                        </li>
                    ))}
                </ul>

                <div className="flex flex-col gap-4 border-t border-line-soft bg-surface-well px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-8">
                    <div className="flex items-center gap-4">
                        <span className="ef-seal ef-seal--pine size-10" aria-hidden="true">
                            <Headset strokeWidth={2} />
                        </span>
                        <p className="text-[0.9375rem] leading-snug text-ink-body">
                            <span className="font-semibold text-ink-strong">Something not right?</span>{' '}
                            Tell us within 7 days of delivery and we&apos;ll replace it or refund you.
                        </p>
                    </div>
                    <Link href="/contact" className="ef-link ef-focus self-start sm:self-auto">
                        Contact support
                        <ArrowRight aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    </section>
)

export default ProductAssurance
