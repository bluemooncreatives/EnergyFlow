import { Clock, CreditCard, RefreshCw, Truck } from 'lucide-react'

// Keep in step with the shipping / returns policy pages and the FAQ.
const POLICIES = [
    { icon: Clock, label: 'Delivery', title: '4–7 days', text: 'Dispatched within 1–2 business days and delivered in 4–7 days.' },
    { icon: Truck, label: 'Shipping', title: 'Free on prepaid', text: 'Free shipping on all prepaid orders, anywhere in India.' },
    { icon: RefreshCw, label: 'Returns', title: '7-day window', text: 'Damaged, incorrectly sealed or wrong items reported within 7 days are replaced or refunded. Opened food packs can only be returned for a genuine quality issue.' },
    { icon: CreditCard, label: 'Refunds', title: '5–7 business days', text: 'Refunds go back to the original payment method within 5–7 business days.' },
]

// Shipping & returns as a ruled four-up on the sage band: pine rules above
// and below, and the 1px grid gaps show the rule colour between cells, so
// the dividers hold at every column count.
const ProductAssurance = () => (
    <section aria-labelledby="assurance-title" className="ef-section ef-section--sunken">
        <div className="ef-container">
            <div data-reveal className="mb-[var(--section-gap)] flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col items-start gap-4">
                    <span className="ef-eyebrow">Good to know</span>
                    <h2 id="assurance-title" className="ef-title ef-title--md">
                        Shipping &amp; <span className="ef-title__accent">returns</span>
                    </h2>
                </div>
                <p className="ef-lead max-w-md text-[0.9375rem]">
                    Every order is packed fresh and tracked to your door. If anything arrives wrong, we make it right.
                </p>
            </div>

            <ul className="grid gap-px border-y border-line-rule bg-line-rule sm:grid-cols-2 lg:grid-cols-4">
                {POLICIES.map(({ icon: Icon, label, title, text }) => (
                    <li key={label} data-reveal className="group flex flex-col gap-4 bg-surface-sunken p-6 transition-colors duration-500 hover:bg-surface-card lg:p-7">
                        <span className="ef-seal ef-seal--sun size-14 transition-transform duration-700 ease-[var(--ease-spring)] group-hover:rotate-[20deg] motion-reduce:transition-none" aria-hidden="true">
                            <Icon />
                        </span>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-muted">{label}</p>
                            <p className="mt-1 font-header text-xl font-semibold uppercase leading-tight text-ink-strong">{title}</p>
                        </div>
                        <p className="text-[0.9375rem] leading-relaxed text-ink-body">{text}</p>
                    </li>
                ))}
            </ul>
        </div>
    </section>
)

export default ProductAssurance
