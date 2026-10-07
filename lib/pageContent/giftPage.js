import { MIN_GIFT_QUANTITY } from '../giftEnquiry.js'
import { EMPTY_IMAGE, STOCK_PHOTOS, image, mergeContent } from './shared.js'

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
    promises: 6,
    steps: 6,
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
        items: [
            { occasion: 'diwali', title: 'Diwali & festive', note: 'Hampers for family, friends and every visit of the season.', image: { ...EMPTY_IMAGE } },
            { occasion: 'employees', title: 'Employee gifting', note: 'Onboarding kits, milestones and festive thank-yous.', image: { ...EMPTY_IMAGE } },
            { occasion: 'clients', title: 'Client thank-you', note: 'A gift that keeps your name on their desk.', image: { ...EMPTY_IMAGE } },
            { occasion: 'wedding', title: 'Weddings & shagun', note: 'Favours and shagun boxes for every guest.', image: { ...EMPTY_IMAGE } },
            { occasion: 'events', title: 'Events & conferences', note: 'Speaker gifts and delegate kits, on time.', image: { ...EMPTY_IMAGE } },
        ],
    },
    promise: {
        enabled: true,
        eyebrow: 'For teams & brands',
        title: 'Gifting that carries',
        titleAccent: 'your name',
        note: 'Pick a signature box or brief us on your own. We handle the branding, the packing and the delivery to every address.',
        items: [
            { title: 'Your brand on every box', copy: 'Logo sleeves, printed message cards and personalised notes, so the gift is unmistakably from you.', tags: ['Logo sleeves', 'Message cards'], image: { ...EMPTY_IMAGE } },
            { title: 'Curated to your budget', copy: 'Choose a signature box or have us build a custom mix of dry fruits, chocolates and treats.', tags: ['Signature boxes', 'Custom mixes'], image: { ...EMPTY_IMAGE } },
            { title: 'Volume pricing', copy: 'Better rates as quantities grow, with one clear quote covering boxes, branding and delivery.', tags: [`From ${MIN_GIFT_QUANTITY} boxes`], image: { ...EMPTY_IMAGE } },
            { title: 'Delivered across India', copy: 'Packed fresh and shipped free to offices and homes nationwide, timed for your date.', tags: ['Pan-India', 'Multiple addresses'], image: { ...EMPTY_IMAGE } },
        ],
    },
    process: {
        enabled: true,
        eyebrow: 'How bulk orders work',
        kicker: 'Brief to doorstep:',
        title: 'four simple steps',
        description: 'One team plans, brands, packs and ships your order, and you approve everything before we start.',
        // Brand photos, not box photos: the collection above shows those.
        image: { ...STOCK_PHOTOS.pantry },
        ctaLabel: 'Start your brief',
        items: [
            { title: 'Share your brief', copy: 'Tell us the occasion, how many boxes, a budget per box and when they need to arrive. It takes about two minutes.', tags: ['Occasion', `${MIN_GIFT_QUANTITY}+ boxes`, 'Budget', 'Date'], image: { ...STOCK_PHOTOS.seeds } },
            { title: 'Get options & one quote', copy: 'Our gifting team replies within one working day with box options and a single quote covering boxes, branding and delivery.', tags: ['Reply in 1 working day', 'Volume pricing'], image: { ...STOCK_PHOTOS.store } },
            { title: 'Brand & pack', copy: 'Once you approve, we add your logo sleeves, message cards or personalised notes and pack every box fresh.', tags: ['Logo sleeves', 'Message cards', 'Packed fresh'], image: { ...STOCK_PHOTOS.gift } },
            { title: 'Delivered, on your date', copy: 'Boxes ship free across India, to one office or to every address on your list, timed for the day you need them.', tags: ['Pan-India', 'Multiple addresses'], image: { ...EMPTY_IMAGE } },
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
    'occasions.items': { occasion: 'other', title: '', note: '', image: { ...EMPTY_IMAGE } },
    'promise.items': { title: '', copy: '', tags: [], image: { ...EMPTY_IMAGE } },
    'process.items': { title: '', copy: '', tags: [], image: { ...EMPTY_IMAGE } },
    'testimonials.items': { quote: '', name: '', role: '', company: '', rating: 0, photo: { ...EMPTY_IMAGE } },
    'faq.items': { question: '', answer: '' },
}

export const mergeGiftPage = (stored) => mergeContent(DEFAULT_GIFT_PAGE, stored || {}, GIFT_PAGE_TEMPLATES)
