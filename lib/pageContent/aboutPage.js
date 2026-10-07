import { EMPTY_IMAGE, image, mergeContent } from './shared.js'

/* ================================================================
   ABOUT US PAGE — defaults and reader
   Every claim is one the business can stand behind: sourcing and
   checking, not certifications it doesn't hold or health outcomes it
   can't promise. Contact details are not here: they come from
   lib/company.js, which the footer and contact page share.
   ================================================================ */

export const ABOUT_PAGE_KEY = 'about-us'

export const ABOUT_PAGE_LIMITS = {
    stats: 4,
    pillars: 6,
    timeline: 4,
    steps: 6,
    people: 6,
    tabs: 5,
    photos: 6,
}

const PHOTOS = {
    gift: image(
        'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789913710/Elegant_Dry_Fruit_Box.jpg',
        'An Energyflow dry fruit gift box, opened to show almonds, cashews and raisins'
    ),
    store: image(
        'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789913475/WhatsApp_Image_2026-09-20_at_7.39.30_PM.jpg',
        'The Energyflow store front in Rangpuri, Mahipalpur, New Delhi'
    ),
    seeds: image(
        'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911945/270e856f021e3e06a3dd84d344bdc8d1.jpg.jpg',
        'Hampers of nuts and seeds'
    ),
    pantry: image(
        'https://res.cloudinary.com/g5wdpcrr/image/upload/v1789911947/file_00000000d82c8211bcfd587359eeba52.png',
        'Energyflow premium dry fruits and super foods'
    ),
}

export const DEFAULT_ABOUT_PAGE = {
    hero: {
        eyebrow: 'About Energyflow',
        title: 'One honest pantry.',
        titleAccent: 'Dry fruits, nuts & superfoods.',
        lead: 'Energyflow is a New Delhi dry fruits and superfood brand by Energy Flow Supply Hub Pvt. Ltd. We source at origin, check every lot, and pack it so it reaches you the way it left us.',
        primaryLabel: 'Shop the range',
        secondaryLabel: 'Bulk & gifting',
        secondaryHref: '/contact',
        // The three photos the hero mosaic slices into tiles.
        mosaic: {
            left: { ...PHOTOS.gift },
            centre: { ...PHOTOS.store },
            right: { ...PHOTOS.seeds },
        },
        // {categories} and {products} are filled in from the live catalogue.
        stats: [
            { value: '{categories}', label: 'Categories in the range' },
            { value: '{products}+', label: 'Products on the shelf' },
            { value: '1-2 days', label: 'Packed and dispatched' },
            { value: 'Pan-India', label: 'Delivered with free shipping' },
        ],
    },
    statement: {
        enabled: true,
    },
    promise: {
        enabled: true,
        label: 'Why shoppers stay',
        statement: 'From the people we buy from to the pack on your doorstep, the details make the difference.',
        photo: { ...PHOTOS.gift },
        photoQuote: 'Every lot is opened and graded before it earns shelf space.',
        pillars: ['Sourced at origin', 'Every lot checked', 'Sealed for the journey', 'Priced without the chain'],
        secondaryPhoto: { ...PHOTOS.seeds },
        secondaryText: 'A short supply chain means the saving reaches your kitchen, not a middleman.',
        ctaLabel: 'Explore our range',
        ctaHref: '/shop',
        timelineTitle: 'Order to doorstep',
        timeline: [
            { label: 'Packed & dispatched', value: '1-2 days' },
            { label: 'Metro cities', value: '2-4 days' },
            { label: 'Rest of India', value: '4-7 days' },
        ],
    },
    range: {
        enabled: true,
        eyebrow: 'Our range',
        title: 'Explore the pantry',
        searchPlaceholder: 'Search the range…',
        note: 'Dry fruits and nuts, dried berries, seeds and superfoods, Ayurvedic herbs, flavoured nuts and healthy candies, with more joining the shelf as we stock them.',
    },
    sourcing: {
        enabled: true,
        eyebrow: 'How we work',
        indexLabel: 'The journey / four stages',
        title: 'From the grower',
        titleAccent: 'to your kitchen.',
        lead: 'Four steps, and none of them are a shortcut. This is the part of the business customers never see, and the part that decides what the pack tastes like.',
        image: { ...PHOTOS.pantry },
        photoEyebrow: 'The path behind every pack',
        photoTitle: 'Care travels with every pack.',
        steps: [
            { phase: 'Origin', title: 'We buy where it grows', body: 'Almonds, cashews, raisins, seeds and millets come from the growers, mills and importers behind them, so quality is settled at origin instead of inspected at the end.' },
            { phase: 'The standard', title: 'Every lot is checked', body: 'Each batch is opened and graded for size, colour, moisture and cleanliness. What does not meet the mark does not get packed, however good the price was.' },
            { phase: 'The pack', title: 'Packed in small batches', body: 'We pack in small runs and seal each pouch, because dry fruits and roasted snacks lose their crunch to air and humidity long before they lose their date.' },
            { phase: 'The journey', title: 'Delivered across India', body: 'Orders are packed within 1-2 working days and reach metros in 2-4 working days and the rest of India in 4-7, with free shipping.' },
        ],
    },
    leadership: {
        enabled: true,
        label: 'Who runs it',
        title: 'Built by people who care',
        titleAccent: 'where it comes from',
        description: 'Energy Flow Supply Hub Pvt. Ltd. was registered on 19 November 2025 and opened its first Energyflow dry fruits and super food store. Two directors run it between them.',
        // No stock portraits: a person without a photo on file gets a monogram.
        people: [
            {
                name: 'Mr. Parveen Singla',
                role: 'Director · Sourcing & operations',
                bio: 'Mr. Parveen Singla decides what earns a place on our shelf. He builds direct, lasting relationships with growers, mills and producers so quality is controlled at origin rather than inspected at the end.\n\nIt takes longer to set up and it is far more reliable once it runs - and the same discipline shapes how we price: buy well, keep the chain short, pass the difference on.',
                quote: 'Quality is settled at origin, not inspected at the end.',
                photo: { ...EMPTY_IMAGE },
            },
            {
                name: 'Mr. Ayush Singla',
                role: 'Director · Retail, brand & expansion',
                bio: 'Mr. Ayush Singla turns a single store into a network that can grow without losing what makes it work: a range people genuinely want, and a shopping experience that is easy online and in store.\n\nThe goal is a professionally managed brand rather than a chain of lookalike outlets - one where every Energyflow store means the same thing to the person walking in.',
                quote: 'Every Energyflow store should mean the same thing to the person walking in.',
                photo: { ...EMPTY_IMAGE },
            },
        ],
    },
    testimonials: {
        enabled: true,
        label: 'In their words',
        title: 'What shoppers tell us',
        image: { ...PHOTOS.store },
    },
    work: {
        enabled: true,
        label: 'Work with us',
        title: 'Bulk orders, gifting',
        titleAccent: 'and franchise',
        description: 'We put together dry fruit and chocolate hampers for Diwali, weddings and corporate gifting, and we are building a retail and franchise network across India. Tell us what you need.',
        tabs: [
            {
                label: 'Bulk orders',
                title: 'Your pantry, by the kilo',
                body: 'Offices, cafés, caterers and families who buy in volume get the same checked lots, packed to order, at pricing that reflects the quantity.',
                ctaLabel: 'Ask for a quote',
                ctaHref: '/contact',
                image: { ...PHOTOS.seeds },
            },
            {
                label: 'Gifting',
                title: 'Hampers for every occasion',
                body: 'Dry fruit and chocolate gift boxes for Diwali, weddings and client thank-yous, with your branding on every box for corporate orders.',
                ctaLabel: 'See gift boxes',
                ctaHref: '/category/gift-boxes',
                image: { ...PHOTOS.gift },
            },
            {
                label: 'Franchise',
                title: 'Open an Energyflow store',
                body: 'We are building a professionally managed retail network across India. If you would like to run an Energyflow store in your city, start the conversation with us.',
                ctaLabel: 'Talk to us',
                ctaHref: '/contact',
                image: { ...PHOTOS.store },
            },
        ],
    },
    visit: {
        enabled: true,
        label: 'Come and find us',
        statement: 'Our first Energyflow store is in Rangpuri, Mahipalpur, New Delhi. Drop in to see the range, or call ahead for bulk and gifting orders.',
        ctaLabel: 'Get directions',
        note: 'The whole range is online too, delivered free across India.',
        photos: [
            { image: { ...PHOTOS.store }, tag: 'Our store', caption: 'Rangpuri, Mahipalpur, New Delhi' },
            { image: { ...PHOTOS.gift }, tag: 'Gift boxes', caption: 'Hampers packed to order' },
            { image: { ...PHOTOS.seeds }, tag: 'The range', caption: 'Nuts, seeds and superfoods' },
        ],
    },
    related: {
        enabled: true,
        eyebrow: 'Curated for you',
        title: 'You may',
        titleAccent: 'also like',
    },
}

export const ABOUT_PAGE_TEMPLATES = {
    'hero.stats': { value: '', label: '' },
    'promise.timeline': { label: '', value: '' },
    'sourcing.steps': { phase: '', title: '', body: '' },
    'leadership.people': { name: '', role: '', bio: '', quote: '', photo: { ...EMPTY_IMAGE } },
    'work.tabs': { label: '', title: '', body: '', ctaLabel: '', ctaHref: '', image: { ...EMPTY_IMAGE } },
    'visit.photos': { image: { ...EMPTY_IMAGE }, tag: '', caption: '' },
}

export const mergeAboutPage = (stored) => mergeContent(DEFAULT_ABOUT_PAGE, stored || {}, ABOUT_PAGE_TEMPLATES)
