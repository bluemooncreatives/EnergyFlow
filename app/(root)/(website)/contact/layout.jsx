// The contact page itself is a client component (GSAP animations + a stateful
// form), so it can't export metadata. This layout carries it instead.
const DESCRIPTION =
    'Get in touch with Energyflow for product questions, bulk orders, corporate and festive gifting, or franchise enquiries. Send us a message and our team will get back to you with a reference number.'

export const metadata = {
    title: 'Contact Us | Bulk Orders, Gifting & Franchise Enquiries',
    description: DESCRIPTION,
    alternates: { canonical: '/contact' },
    openGraph: {
        title: 'Contact Energyflow | Bulk Orders, Gifting & Franchise Enquiries',
        description: DESCRIPTION,
        url: '/contact',
    },
}

const ContactLayout = ({ children }) => children

export default ContactLayout
