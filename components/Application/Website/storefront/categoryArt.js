import dryFruits from '@/public/assets/images/category/dry-fruits.webp'
import fruitsBerries from '@/public/assets/images/category/fruits-berries.webp'
import beansSpices from '@/public/assets/images/category/beans-spices.webp'
import giftBox from '@/public/assets/images/banner/gift-box-deal.jpg'

// Art-directed photography for the main categories, keyed by slug. Any other
// category falls back to its first product photo from the catalogue.
export const CATEGORY_ART = {
    'dry-fruits-and-nuts': {
        src: dryFruits,
        alt: 'Bowls of almonds, cashews, pistachios, walnuts, hazelnuts and raisins',
    },
    'imported-fruits-and-berries': {
        src: fruitsBerries,
        alt: 'Fresh pomegranate and blackberries on a wooden board',
    },
    'seeds-and-superfoods': {
        src: beansSpices,
        alt: 'Beans, seeds and spices in small wooden bowls',
    },
}

// Stands in for any gifting / hamper category without its own art above.
export const GIFTING_ART = {
    src: giftBox,
    alt: 'A wooden gift box of raisins, cashews, almonds and pistachios beside a ribboned box',
}
