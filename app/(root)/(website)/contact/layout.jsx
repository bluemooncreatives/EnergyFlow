// The contact page itself is a client component (GSAP animations + a stateful
// form), so it can't export metadata. This layout carries it instead.
const DESCRIPTION =
    'Contact Energyflow for bulk dry fruit orders, corporate Diwali gifting, custom gift hampers and franchise enquiries. Call +91 92896 57742 or send us a message.'

export const metadata = {
    title: { absolute: 'Contact Energyflow | Bulk Orders & Corporate Gifting' },
    description: DESCRIPTION,
    alternates: { canonical: '/contact' },
    openGraph: {
        title: 'Contact Energyflow | Bulk Orders & Corporate Gifting',
        description: DESCRIPTION,
        url: '/contact',
    },
}

const ContactLayout = ({ children }) => children

export default ContactLayout
