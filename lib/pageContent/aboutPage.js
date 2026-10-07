import { EMPTY_IMAGE, STOCK_PHOTOS, image, mergeContent } from './shared.js'

const CDN = 'https://res.cloudinary.com/g5wdpcrr/image/upload/'

// One photo per slot, so no picture repeats down the page. None of them is
// a category cover either: "Explore the pantry" already shows those.
const PHOTOS = {
    shelves: image(`${CDN}v1789911947/IMG_20260920_190814.jpg.jpg`, 'Shelves of dry fruits, nuts and superfoods inside the Energyflow store'),
    festive: image(`${CDN}v1791396583/Richly_Infused_Festive_Nut_Gift_Collection_ktldmj.webp`, 'Festive dry fruit gift collection in keepsake boxes'),
    konch: image(`${CDN}v1790609119/ChatGPT_Image_Sep_28_2026_08_54_06_PM_tngaxs.png`, 'Black konch beej in an Energyflow kraft pouch'),
    cashews: image(`${CDN}v1789750666/WhatsApp_Image_2026-09-18_at_7.13.25_PM_q9ntra.jpg`, 'Jumbo cashews in an Energyflow pouch'),
    seeds: { ...STOCK_PHOTOS.seeds },
    giftBox: { ...STOCK_PHOTOS.gift },
    kishmish: image(`${CDN}v1789652213/WhatsApp_Image_2026-09-17_at_7.00.56_PM_clq4bd.jpg`, 'Golden kishmish packed in an Energyflow tub'),
    shagun: image(`${CDN}v1791397257/ChatGPT_Image_Oct_7_2026_11_48_46_PM_nxnaeq.webp`, 'Dry fruit shagun gift boxes'),
    pantry: { ...STOCK_PHOTOS.pantry },
    store: { ...STOCK_PHOTOS.store },
    hamper: image(`${CDN}v1791396859/Richly_Infused_Luxury_Gift_Hamper_i6dlqa.webp`, 'Luxury dry fruit gift hamper'),
    mango: image(`${CDN}v1790525623/ChatGPT_Image_Sep_27_2026_09_43_20_PM_tshk4z.png`, 'Dried mango slices in an Energyflow jar'),
    nutGiftSet: image(`${CDN}v1791397522/Richly_Infused_Luxury_Nut_Gift_Set_1_klhvyi.webp`, 'An open Richly Infused nut gift set with jars and loose nuts'),
    chocolates: image(`${CDN}v1790599433/ChatGPT_Image_Sep_28_2026_06_12_59_PM_teqpom.png`, 'Swiss Delight chocolates packed in a clear gift box'),
    boxesForTeams: image(`${CDN}v1791393589/9bed8380-3bfc-42fa-9238-886e8cfed053_dytnon.webp`, 'Energyflow dry fruit gift boxes ready to go out'),
    giftCollection: image(`${CDN}v1791397310/ChatGPT_Image_Oct_7_2026_11_49_51_PM_hwgyjy.webp`, 'Richly Infused gift boxes and jars of nuts'),
    almonds: image(`${CDN}v1790599436/ChatGPT_Image_Sep_28_2026_06_12_37_PM_ynvxw9.png`, 'Kesar mango almonds in an Energyflow pouch'),
}

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
            left: { ...PHOTOS.festive },
            centre: { ...PHOTOS.shelves },
            right: { ...PHOTOS.konch },
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
        photo: { ...PHOTOS.cashews },
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
        // Shows for any step without a photo of its own.
        image: { ...PHOTOS.giftCollection },
        photoEyebrow: 'The path behind every pack',
        photoTitle: 'Care travels with every pack.',
        steps: [
            { phase: 'Origin', title: 'We buy where it grows', body: 'Almonds, cashews, raisins, seeds and millets come from the growers, mills and importers behind them, so quality is settled at origin instead of inspected at the end.', image: { ...PHOTOS.mango } },
            { phase: 'The standard', title: 'Every lot is checked', body: 'Each batch is opened and graded for size, colour, moisture and cleanliness. What does not meet the mark does not get packed, however good the price was.', image: { ...PHOTOS.nutGiftSet } },
            { phase: 'The pack', title: 'Packed in small batches', body: 'We pack in small runs and seal each pouch, because dry fruits and roasted snacks lose their crunch to air and humidity long before they lose their date.', image: { ...PHOTOS.chocolates } },
            { phase: 'The journey', title: 'Delivered across India', body: 'Orders are packed within 1-2 working days and reach metros in 2-4 working days and the rest of India in 4-7, with free shipping.', image: { ...PHOTOS.boxesForTeams } },
        ],
    },
    leadership: {
        enabled: true,
        label: 'Who runs it',
        title: 'Built by people who care',
        titleAccent: 'where it comes from',
        description: 'Energy Flow Supply Hub Pvt. Ltd. was registered on 19 November 2025 and opened its first Energyflow dry fruits and super food store. Two directors run it between them.',
        // Real portraits only: a person without a photo on file gets a monogram.
        people: [
            {
                name: 'Mr. Parveen Singla',
                role: 'Director · Sourcing & operations',
                bio: 'Mr. Parveen Singla decides what earns a place on our shelf. He builds direct, lasting relationships with growers, mills and producers so quality is controlled at origin rather than inspected at the end.\n\nIt takes longer to set up and it is far more reliable once it runs - and the same discipline shapes how we price: buy well, keep the chain short, pass the difference on.',
                quote: 'Quality is settled at origin, not inspected at the end.',
                photo: image(`${CDN}v1791403458/WhatsApp_Image_2026-10-07_at_11.58.57_PM_ofdype.jpg`, 'Mr. Parveen Singla, Director, Energyflow', 'top'),
            },
            {
                name: 'Mr. Ayush Singla',
                role: 'Director · Retail, brand & expansion',
                bio: 'Mr. Ayush Singla turns a single store into a network that can grow without losing what makes it work: a range people genuinely want, and a shopping experience that is easy online and in store.\n\nThe goal is a professionally managed brand rather than a chain of lookalike outlets - one where every Energyflow store means the same thing to the person walking in.',
                quote: 'Every Energyflow store should mean the same thing to the person walking in.',
                photo: image(`${CDN}v1791403458/WhatsApp_Image_2026-10-06_at_4.18.41_PM_mqs4uf.jpg`, 'Mr. Ayush Singla, Director, Energyflow', 'top'),
            },
        ],
    },
    testimonials: {
        enabled: true,
        label: 'In their words',
        title: 'What shoppers tell us',
        image: { ...PHOTOS.giftBox },
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
                image: { ...PHOTOS.kishmish },
            },
            {
                label: 'Gifting',
                title: 'Hampers for every occasion',
                body: 'Dry fruit and chocolate gift boxes for Diwali, weddings and client thank-yous, with your branding on every box for corporate orders.',
                ctaLabel: 'See gift boxes',
                ctaHref: '/category/gift-boxes',
                image: { ...PHOTOS.shagun },
            },
            {
                label: 'Franchise',
                title: 'Open an Energyflow store',
                body: 'We are building a professionally managed retail network across India. If you would like to run an Energyflow store in your city, start the conversation with us.',
                ctaLabel: 'Talk to us',
                ctaHref: '/contact',
                image: { ...PHOTOS.pantry },
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
            { image: { ...PHOTOS.hamper }, tag: 'Gift boxes', caption: 'Hampers packed to order' },
            { image: { ...PHOTOS.almonds }, tag: 'The range', caption: 'Nuts, seeds and superfoods' },
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
    'sourcing.steps': { phase: '', title: '', body: '', image: { ...EMPTY_IMAGE } },
    'leadership.people': { name: '', role: '', bio: '', quote: '', photo: { ...EMPTY_IMAGE } },
    'work.tabs': { label: '', title: '', body: '', ctaLabel: '', ctaHref: '', image: { ...EMPTY_IMAGE } },
    'visit.photos': { image: { ...EMPTY_IMAGE }, tag: '', caption: '' },
}

export const mergeAboutPage = (stored) => mergeContent(DEFAULT_ABOUT_PAGE, stored || {}, ABOUT_PAGE_TEMPLATES)
