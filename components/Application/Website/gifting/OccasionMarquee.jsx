import styles from './gifting.module.css'

const OCCASIONS = [
    'Diwali hampers',
    'Employee onboarding',
    'Client thank-yous',
    'Weddings & shagun',
    'Conferences & offsites',
    'Festive greetings',
    'Rewards & recognition',
]

const Spark = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0Z" />
    </svg>
)

// Sunflower ticker of the occasions the gifting team packs for. The list is
// rendered twice so the CSS loop (translate −50%) is seamless; the copy is
// hidden from assistive tech, which gets the plain list once.
const OccasionMarquee = () => (
    <section className={styles.marquee} aria-label="Occasions we gift for">
        <ul className="sr-only">
            {OCCASIONS.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className={styles.marqueeTrack} aria-hidden="true">
            {[0, 1].map((copy) => (
                <div key={copy} className={styles.marqueeGroup}>
                    {OCCASIONS.map((item) => (
                        <span key={item} className={styles.marqueeItem}>
                            {item} <Spark />
                        </span>
                    ))}
                </div>
            ))}
        </div>
    </section>
)

export default OccasionMarquee
