// Copy for the dairy aisle (/category/dairy-products). Like catalogSeo, keep
// it to general, checkable facts about dairy and how it is made, stored and
// used. No lab results, certifications or health outcomes the catalogue
// cannot prove, and nothing that implies a product we do not stock.

import { COMPANY } from '@/lib/company'

export const DAIRY_CATEGORY_SLUG = 'dairy-products'

// In-page targets for the hero's two buttons.
export const RANGE_ANCHOR = 'dairy-range'
export const GUIDE_ANCHOR = 'dairy-guide'

export const DAIRY_WHATSAPP_HREF = `https://wa.me/${COMPANY.phoneHref.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Energyflow, I would like to know more about your dairy products.')}`

export const DAIRY_TICKER = [
    'Pure desi dairy',
    'A2 Gir cow ghee',
    'Traditional bilona method',
    'Small batches',
    'Checked before packing',
    'Delivered across India',
]

// "Know your dairy": one tab per topic. Each renders its paragraphs, then
// `points` (a numbered list) or `table` (rows of [label, a, b] under
// `columns`), with `fact` as the large figure on the side card.
export const DAIRY_TOPICS = [
    {
        id: 'bilona',
        label: 'Bilona ghee',
        icon: 'churn',
        title: 'What is',
        accent: 'bilona ghee?',
        body: [
            'Bilona is the traditional way Indian homes made ghee. Instead of separating cream from milk by machine, whole milk is first set into curd and then churned by hand with a wooden churner, the bilona.',
        ],
        points: [
            { title: 'Milk is set into curd', copy: 'Whole milk is boiled, cooled and set overnight into dahi.' },
            { title: 'Curd is churned', copy: 'A wooden bilona churns it in both directions until makkhan rises.' },
            { title: 'Makkhan is lifted out', copy: 'The white butter is gathered by hand; the chaas stays behind.' },
            { title: 'Slow-cooked into ghee', copy: 'The butter simmers on a low flame until it turns clear and golden.' },
        ],
        fact: { value: '25-30 L', label: 'of milk typically goes into one litre of bilona ghee' },
    },
    {
        id: 'compare',
        label: 'Bilona vs regular',
        icon: 'scale',
        title: 'Bilona vs',
        accent: 'regular ghee.',
        body: ['Both are pure ghee. What differs is the starting point and the pace, and you can taste it.'],
        columns: ['Bilona ghee', 'Regular ghee'],
        table: [
            ['Made from', 'Curd (dahi)', 'Cream (malai)'],
            ['Churning', 'Wooden bilona', 'Machine separators'],
            ['Cooking', 'Low flame, small batches', 'High heat, large runs'],
            ['Texture', 'Grainy (danedar)', 'Usually smooth'],
            ['Aroma', 'Rich, nutty, a gentle tang', 'Mild and buttery'],
        ],
        fact: { value: 'Curd', label: 'not cream, is where bilona ghee begins' },
    },
    {
        id: 'a2',
        label: 'A2 milk',
        icon: 'milk',
        title: 'What does',
        accent: 'A2 mean?',
        body: [
            'Milk protein includes beta-casein, which comes in two common forms: A1 and A2. The label tells you which type the milk carries.',
            'Native Indian breeds such as Gir, Sahiwal and Red Sindhi naturally give milk with the A2 type. Many crossbred and exotic dairy breeds give milk with a mix of A1 and A2.',
        ],
        points: [
            { title: 'Gir', copy: 'A hardy native breed from the forests of Gujarat.' },
            { title: 'Sahiwal', copy: 'Native to Punjab, known for its reddish-brown coat.' },
            { title: 'Red Sindhi', copy: 'A heat-tolerant breed from the Sindh region.' },
        ],
        fact: { value: 'A2', label: 'the beta-casein type in milk from native Indian breeds' },
    },
    {
        id: 'forms',
        label: 'Ghee, butter & makkhan',
        icon: 'butter',
        title: 'Ghee, butter',
        accent: '& makkhan.',
        body: ['Three staples from the same milk fat, each made differently and each with its own place in the kitchen.'],
        points: [
            { title: 'Butter', copy: 'Churned from cream, often salted, and keeps its water and milk solids. Lives in the fridge.' },
            { title: 'White makkhan', copy: 'Unsalted, soft butter churned at home from curd or cream. Best eaten fresh.' },
            { title: 'Ghee', copy: 'Butter slowly cooked until the water and milk solids are gone. Keeps for months on the shelf.' },
        ],
        fact: { value: '3 in 1', label: 'staples from the same milk fat' },
    },
    {
        id: 'cow-buffalo',
        label: 'Cow vs buffalo ghee',
        icon: 'sprout',
        title: 'Cow or',
        accent: 'buffalo ghee?',
        body: ['Both are common in Indian kitchens. They look, set and taste a little differently.'],
        columns: ['Cow ghee', 'Buffalo ghee'],
        table: [
            ['Colour', 'Golden yellow', 'White to creamy'],
            ['Texture', 'Lighter, grainy', 'Thicker, denser'],
            ['Milk', 'Lower in fat', 'Higher in fat'],
            ['Taste', 'Light and aromatic', 'Rich and heavy'],
        ],
        fact: { value: 'Gold', label: 'cow ghee’s natural colour comes from beta-carotene in the milk' },
    },
    {
        id: 'storage',
        label: 'Storing dairy',
        icon: 'jar',
        title: 'Keep it',
        accent: 'fresh.',
        body: ['A few habits keep every dairy staple at its best until the last spoon.'],
        points: [
            { title: 'Ghee: shelf, not fridge', copy: 'Airtight jar, cool dry shelf, always a dry spoon. It melts in summer and sets in winter, both normal.' },
            { title: 'Butter & makkhan: chilled', copy: 'Keep them covered in the fridge, away from strong smells.' },
            { title: 'Check the pack', copy: 'Packed and best before dates are printed on every pack.' },
        ],
        fact: { value: 'Dry spoon', label: 'the simplest way to keep ghee fresh for months' },
    },
]

// "Dairy in the kitchen": the bento grid. `tone` picks the tile colour.
export const DAIRY_USES = [
    { icon: 'pot', title: 'Tadka & tempering', copy: 'Jeera, hing and curry leaves bloom in hot ghee, which suits Indian frying and tempering.', tone: 'sun' },
    { icon: 'wheat', title: 'Rotis & parathas', copy: 'Ghee on a hot phulka, butter in a layered paratha.', tone: 'card' },
    { icon: 'soup', title: 'Dal, khichdi & rice', copy: 'Finish a bowl with a drizzle of ghee for aroma.', tone: 'card' },
    { icon: 'sweet', title: 'Halwa, ladoo & mithai', copy: 'The base of every festive sweet, from sooji halwa to besan ladoo.', tone: 'pine' },
    { icon: 'diya', title: 'Puja & diya', copy: 'Pure desi ghee for the evening diya and havan.', tone: 'card' },
    { icon: 'coffee', title: 'Breakfast', copy: 'Makkhan on toast, ghee over idli, dosa or a warm glass of milk.', tone: 'card' },
]
