import { MIN_GIFT_QUANTITY } from '../giftEnquiry.js'
import { EMPTY_IMAGE, image, mergeContent } from './shared.js'

/* ================================================================
   GIFT BOXES PAGE — defaults and reader
   /category/gift-boxes (and /shop?category=gift-boxes). The boxes
   themselves come from the catalogue; this is everything around them.
   An empty image means "automatic": a gift box photo, then artwork.
   Copy only makes claims the business stands behind.
   ================================================================ */

export const GIFT_PAGE_KEY = 'gift-boxes'

export const GIFT_PAGE_LIMITS = {
    tickerItems: 10,
    occasions: 8,
    occasionIncludes: 4,
    promises: 6,
    testimonials: 12,
    faqs: 15,
    perks: 4,
    tags: 4,
}

export const DEFAULT_GIFT_PAGE = {
    hero: {
        wordmark: 'Gift Boxes',
        tagline: 'Dry fruit gift boxes, made to be given',
        scrollLabel: 'Scroll for the boxes',
        badge: 'Gifting season is open',
        caption: 'Premium dry fruits in keepsake boxes. Send one to someone special, or a few hundred to your whole team with your brand on every box.',
        image: image(
            'https://res.cloudinary.com/g5wdpcrr/image/upload/v1791393589/9bed8380-3bfc-42fa-9238-886e8cfed053_dytnon.webp',
            'Energyflow dry fruit gift boxes'
        ),
    },
    ticker: {
        enabled: true,
        items: [
            'Festive gifting',
            'Free delivery across India',
            `Bulk pricing from ${MIN_GIFT_QUANTITY} boxes`,
            'Your logo on every box',
            'Packed fresh to order',
        ],
    },
    collection: {
        eyebrow: 'Ready to gift',
        title: 'Gifts that are easy to give',
        titleAccent: 'and a joy to open',
        noteTitle: 'Packed fresh, delivered free.',
        note: `Every box ships free across India. Gifting ${MIN_GIFT_QUANTITY} or more? Each box can carry your branding at volume pricing.`,
        listTitle: 'Our boxes',
    },
    occasions: {
        enabled: true,
        eyebrow: 'Gift your way',
        label: 'Pick an occasion and your brief opens with it filled in.',
        title: 'Choose the occasion,',
        titleAccent: 'we’ll build the box',
        // The large photo for an occasion without its own.
        image: image(
            'https://res.cloudinary.com/g5wdpcrr/image/upload/v1791396583/Richly_Infused_Festive_Nut_Gift_Collection_ktldmj.webp',
            'Richly Infused festive nut gift collection in keepsake boxes'
        ),
        // `image` fills the large frame when the occasion is picked; `thumb`
        // previews it on the small "up next" card (empty: its box's photo).
        items: [
            {
                occasion: 'diwali', title: 'Diwali & festive', note: 'Hampers for family, friends and every visit of the season.',
                audience: 'Family, friends & neighbours', includes: ['Festive hampers', 'Message cards', 'Multiple addresses'], product: 'gift-box-red',
                image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791396583/Richly_Infused_Festive_Nut_Gift_Collection_ktldmj.webp', 'Festive dry fruit gift collection in glass jars'),
                thumb: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791397522/Richly_Infused_Luxury_Nut_Gift_Set_1_klhvyi.webp', 'Luxury nut gift set'),
            },
            {
                occasion: 'employees', title: 'Employee gifting', note: 'Onboarding kits, milestones and festive thank-yous.',
                audience: 'New joiners, milestones & festivals', includes: ['Logo sleeves', 'Personalised notes', 'Every desk, pan-India'], product: 'gift-box-green',
                image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791393589/9bed8380-3bfc-42fa-9238-886e8cfed053_dytnon.webp', 'Energyflow dry fruit gift boxes for teams'),
                thumb: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791393589/9bed8380-3bfc-42fa-9238-886e8cfed053_dytnon.webp', 'Energyflow dry fruit gift boxes'),
            },
            {
                occasion: 'wedding', title: 'Weddings & shagun', note: 'Favours and shagun boxes for every guest.',
                audience: 'Guests, family & shagun', includes: ['Shagun boxes', 'Personalised notes', 'Guest favours'], product: 'gift-box-red',
                image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791397257/ChatGPT_Image_Oct_7_2026_11_48_46_PM_nxnaeq.webp', 'Dry fruit shagun gift boxes for wedding guests'),
                thumb: { ...EMPTY_IMAGE },
            },
            {
                occasion: 'events', title: 'Events & conferences', note: 'Speaker gifts and delegate kits, on time.',
                audience: 'Speakers, delegates & guests', includes: ['Delegate kits', 'Logo sleeves', 'Timed for your date'], product: 'gift-box-black',
                image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791397310/ChatGPT_Image_Oct_7_2026_11_49_51_PM_hwgyjy.webp', 'Dry fruit gift boxes for event delegates'),
                thumb: { ...EMPTY_IMAGE },
            },
        ],
    },
    promise: {
        enabled: true,
        eyebrow: 'For teams & brands',
        title: 'Gifting that carries',
        titleAccent: 'your name',
        note: 'Pick a signature box or brief us on your own. We handle the branding, the packing and the delivery to every address.',
        items: [
            { title: 'Your brand on every box', copy: 'Logo sleeves, printed message cards and personalised notes, so the gift is unmistakably from you.', tags: ['Logo sleeves', 'Message cards'], image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791398056/ChatGPT_Image_Oct_8_2026_12_01_53_AM_zqvknv.webp', 'Branded Energyflow dry fruit gift box') },
            { title: 'Curated to your budget', copy: 'Choose a signature box or have us build a custom mix of dry fruits, chocolates and treats.', tags: ['Signature boxes', 'Custom mixes'], image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791397522/Richly_Infused_Luxury_Nut_Gift_Set_1_klhvyi.webp', 'Luxury nut gift set in a keepsake box') },
            { title: 'Volume pricing', copy: 'Better rates as quantities grow, with one clear quote covering boxes, branding and delivery.', tags: [`From ${MIN_GIFT_QUANTITY} boxes`], image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791397257/ChatGPT_Image_Oct_7_2026_11_48_46_PM_nxnaeq.webp', 'Dry fruit gift boxes ordered in bulk') },
            { title: 'Delivered across India', copy: 'Packed fresh and shipped free to offices and homes nationwide, timed for your date.', tags: ['Pan-India', 'Multiple addresses'], image: image('https://res.cloudinary.com/g5wdpcrr/image/upload/v1791396859/Richly_Infused_Luxury_Gift_Hamper_i6dlqa.webp', 'Luxury dry fruit gift hamper packed for delivery') },
        ],
    },
    // Starts empty on purpose: quotes are only ever real ones the team adds.
    testimonials: {
        enabled: true,
        eyebrow: 'Kind words',
        title: 'Gifted by teams',
        titleAccent: 'across India',
        image: { ...EMPTY_IMAGE },
        items: [],
    },
    enquiry: {
        eyebrow: 'Corporate & bulk orders',
        title: 'Tell us what you’re',
        titleAccent: 'gifting',
        description: 'Three short steps, about two minutes. Our gifting team comes back with box options, a quote at volume pricing and delivery timelines.',
        perks: [`Bulk orders from ${MIN_GIFT_QUANTITY} boxes`, 'Logo sleeves & notes', 'Reply in 1 working day'],
    },
    // No questions of its own: the category's FAQs (lib/catalogSeo) show
    // until the admin writes some here.
    faq: {
        enabled: true,
        eyebrow: 'Good to know',
        title: 'Everything you',
        titleAccent: 'need to know',
        description: 'Can’t find your answer? Our gifting team is a call or a message away.',
        items: [],
    },
    cta: {
        enabled: true,
        eyebrow: 'Gifting at scale',
        title: 'Planning gifts for',
        titleAccent: 'a whole team?',
        description: 'Share a two-minute brief and get box options, branding and one quote within a working day.',
        buttonLabel: 'Plan a bulk order',
        image: { ...EMPTY_IMAGE },
    },
}

// Item shapes, so an older stored item picks up fields added later.
export const GIFT_PAGE_TEMPLATES = {
    'occasions.items': { occasion: 'other', title: '', note: '', audience: '', includes: [], product: '', image: { ...EMPTY_IMAGE }, thumb: { ...EMPTY_IMAGE } },
    'promise.items': { title: '', copy: '', tags: [], image: { ...EMPTY_IMAGE } },
    'testimonials.items': { quote: '', name: '', role: '', company: '', rating: 0, photo: { ...EMPTY_IMAGE } },
    'faq.items': { question: '', answer: '' },
}

export const mergeGiftPage = (stored) => mergeContent(DEFAULT_GIFT_PAGE, stored || {}, GIFT_PAGE_TEMPLATES)
