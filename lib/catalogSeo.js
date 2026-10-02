// Search copy for every category landing page (/category/[slug]).
//
// Each entry is written around the phrases Indian shoppers actually type for
// that aisle: a primary "buy … online" query in the <title> and <h1>, the
// Hindi names people search by (badam, kaju, kishmish, makhana), and the
// long-tail questions answered in the FAQ. Keep claims factual: nothing here
// may promise organic certification, lab results or health outcomes the
// catalogue cannot back up.
//
// Fields
//   title        <title> before the " | Energyflow" suffix, ≤ 60 characters
//   description  meta description, ≤ 155 characters
//   h1           the page heading
//   eyebrow      short label above the heading
//   intro        paragraphs under the heading
//   sections     buying-guide blocks: { heading, body: [paragraphs] }
//   faqs         { q, a } — rendered on the page and as FAQPage schema
//   related      sibling category slugs to cross-link

const SHIPPING_LINE =
    'Orders are packed within 1–2 working days and delivered in 2–4 working days to metros and 4–7 working days elsewhere in India, with free shipping.'

export const CATEGORY_SEO = {
    'dry-fruits-and-nuts': {
        title: 'Buy Dry Fruits & Nuts Online | Badam, Kaju, Pista',
        description:
            'Buy premium dry fruits and nuts online: almonds (badam), cashews (kaju), pistachios, kishmish, macadamia and Brazil nuts. Quality checked, delivered across India.',
        h1: 'Premium Dry Fruits & Nuts',
        eyebrow: 'Badam · Kaju · Pista · Kishmish',
        intro: [
            'Shop premium dry fruits and nuts online at Energyflow: California and Sanora almonds, jumbo W240 cashews, roasted pistachios, golden and green kishmish, macadamia, Brazil nuts and ready-mixed assorted nuts.',
            'Every lot is checked for grade, crunch and freshness before it is packed, so the 200g pouch in your kitchen cupboard tastes the same as the kilo we taste-test at the store.',
        ],
        sections: [
            {
                heading: 'How to choose good dry fruits',
                body: [
                    'Look for even size and colour, a clean snap on almonds and cashews, and no dust or broken pieces at the bottom of the pack. Cashews are graded by count per pound, so W240 means 240 kernels a pound: larger, whole and ideal for gifting or snacking.',
                    'Kishmish should be plump and soft, not sticky. Golden raisins are milder and sweeter, while green kishmish has a gentle tang that works well in kheer, pulao and halwa.',
                ],
            },
            {
                heading: 'Everyday nutrition for the whole family',
                body: [
                    'A small handful of mixed nuts a day is an easy habit for school tiffins, office desks and pre-workout snacks. Almonds and walnuts are a natural source of protein, fibre and healthy fats, and dry fruits add natural sweetness without reaching for a biscuit.',
                    'Soaked badam in the morning, a few cashews in the afternoon and kishmish in dessert cover most households. Brazil nuts and macadamia are richer, so two or three pieces a day is plenty.',
                ],
            },
            {
                heading: 'Storing dry fruits so they stay fresh',
                body: [
                    'Keep nuts in an airtight jar away from heat and sunlight. In warm, humid months, refrigerate opened packs of walnuts, macadamia and Brazil nuts, which have more oil and can turn rancid faster. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'Which dry fruits are best to eat every day?', a: 'Almonds, walnuts, cashews and raisins are the most common daily choices. A small handful (about 20–30g) of mixed nuts a day is a practical portion for most adults.' },
            { q: 'What is the difference between American badam and Sanora badam?', a: 'American (California) almonds are the familiar everyday variety. Sanora (Sonora) almonds are a premium variety prized for their even shape, mild sweetness and crunch, and are popular for gifting.' },
            { q: 'What does W240 mean for cashews?', a: 'It is the grade: roughly 240 whole kernels per pound. Lower numbers mean larger cashews, so W240 is a jumbo grade.' },
            { q: 'Do you deliver dry fruits across India?', a: SHIPPING_LINE },
        ],
        related: ['flavoured-and-special-nuts', 'imported-fruits-and-berries', 'gift-boxes'],
    },

    'imported-fruits-and-berries': {
        title: 'Buy Dried Berries & Imported Dried Fruits Online',
        description:
            'Shop dried blueberries, cranberries, dried kiwi, mango, pineapple and candied cherries online. Imported dried fruits for snacking, baking and muesli bowls.',
        h1: 'Dried Berries & Imported Fruits',
        eyebrow: 'Blueberry · Cranberry · Kiwi · Mango',
        intro: [
            'Buy dried berries and imported dried fruits online: juicy blueberries, sweet-tart cranberries, dried kiwi and golden kiwi, mango and mango chilli, pineapple slices, candied cherries and mixed fruit cocktail.',
            'They are an easy way to add colour and natural fruit flavour to breakfast bowls, trail mixes, cakes and lunch boxes, and a favourite with children who prefer something sweet.',
        ],
        sections: [
            {
                heading: 'Ways to use dried berries',
                body: [
                    'Stir cranberries and blueberries into oats, muesli or yoghurt, fold them into cake and muffin batter, or mix them with almonds and pumpkin seeds for a homemade trail mix. Dried kiwi and pineapple are best eaten on their own as a chewy snack.',
                    'Candied cherries and mixed fruit cocktail are baking staples for fruit cakes, cookies, ice-cream toppings and festive desserts.',
                ],
            },
            {
                heading: 'Sweetened or naturally dried?',
                body: [
                    'Many dried berries, cranberries in particular, are lightly sweetened because the fresh fruit is very tart. Check each product page for the exact ingredients if you are watching sugar.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Reseal the pouch after opening and keep it somewhere cool and dry. In humid weather, refrigerating opened packs keeps the fruit soft without turning sticky. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'Are dried blueberries and cranberries good for snacking?', a: 'Yes. They are a convenient, shelf-stable fruit snack and pair well with nuts and seeds. Portion them like any sweet snack.' },
            { q: 'How do I use candied cherries?', a: 'Candied cherries are used in fruit cakes, cookies, puddings, ice creams and mocktails, or as a decorative topping.' },
            { q: 'What is the difference between dried kiwi and golden kiwi?', a: 'Dried green kiwi has a tangy flavour, while golden kiwi is sweeter and milder.' },
            { q: 'How long do dried berries last?', a: 'Unopened packs keep for months in a cool, dry place. Once opened, reseal tightly and use within a few weeks for the best texture.' },
        ],
        related: ['dry-fruits-and-nuts', 'seeds-and-superfoods', 'healthy-candies-and-sweets'],
    },

    'seeds-and-superfoods': {
        title: 'Buy Seeds & Superfoods Online | Chia, Flax, Pumpkin',
        description:
            'Buy chia seeds, flax seeds, pumpkin seeds, sunflower seeds, quinoa and muesli online. Everyday superfoods for smoothies, salads and healthy breakfasts.',
        h1: 'Seeds & Superfoods',
        eyebrow: 'Chia · Flax · Pumpkin · Muesli',
        intro: [
            'Shop healthy seeds and superfoods online: chia seeds, flax seeds, pumpkin and sunflower seeds, quinoa and fruit-and-nut muesli for quick, nutritious breakfasts.',
            'Seeds are one of the simplest upgrades to an everyday diet. A spoonful adds crunch, fibre and plant protein to smoothies, salads, raita, oats and rotis without changing the dish much.',
        ],
        sections: [
            {
                heading: 'How to eat chia and flax seeds',
                body: [
                    'Soak chia seeds in water or milk for 15–20 minutes to make chia pudding, or stir them into lemonade and smoothies. Flax seeds are best ground just before use so the body can absorb them. Add them to atta, oats or curd.',
                    'Pumpkin and sunflower seeds can be eaten straight from the pack, dry-roasted with a pinch of salt, or sprinkled over salads and poha.',
                ],
            },
            {
                heading: 'For fitness and weight-conscious diets',
                body: [
                    'Chia and pumpkin seeds are a natural source of fibre, plant protein and omega-3 fats, which is why they are a staple in fitness and high-protein diets. Muesli with nuts and fruit makes a filling breakfast that is quick to put together on a workday.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Store seeds airtight in a cool, dark place. Ground flax oxidises quickly, so grind small batches. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'How much chia seed should I eat a day?', a: 'One to two tablespoons (about 10–20g) a day is a common serving. Soak them first and drink enough water.' },
            { q: 'Should flax seeds be eaten whole or ground?', a: 'Ground. Whole flax seeds often pass through undigested, so grind them just before use.' },
            { q: 'Can I eat pumpkin seeds raw?', a: 'Yes, they can be eaten raw or lightly roasted as a snack or topping.' },
            { q: 'Is muesli a healthy breakfast?', a: 'Fruit-and-nut muesli with milk or curd is a filling, fibre-rich breakfast. Check the label for added sugar if that matters to you.' },
        ],
        related: ['millets-and-grains', 'dry-fruits-and-nuts', 'roasted-and-healthy-snacks'],
    },

    'millets-and-grains': {
        title: 'Buy Millets & Healthy Grains Online | Ragi, Jowar, Quinoa',
        description:
            'Buy millets and healthy grains online: ragi, jowar, bajra, foxtail and little millet, and quinoa. Traditional Indian grains for rotis, khichdi and porridge.',
        h1: 'Millets & Healthy Grains',
        eyebrow: 'Ragi · Jowar · Bajra · Quinoa',
        intro: [
            'Shop millets and healthy grains online: ragi (finger millet), jowar, bajra, foxtail, kodo and little millet, and quinoa. These are traditional Indian grains that our grandparents cooked every day and are back in modern kitchens.',
            'Millets are naturally gluten-free and cook just like rice or dalia, so they are an easy swap for families looking to eat less refined flour.',
        ],
        sections: [
            {
                heading: 'How to cook millets',
                body: [
                    'Rinse and soak millets for a few hours, then cook with about 2.5–3 cups of water per cup of millet, the same way you cook rice. Use them in khichdi, upma, pongal, pulao and salads, or grind ragi and jowar into flour for rotis, dosa and porridge.',
                ],
            },
            {
                heading: 'Who millets suit best',
                body: [
                    'Millets suit families moving away from maida, people on gluten-free diets and anyone who wants more fibre in everyday meals. Ragi porridge is a traditional first food for toddlers and a comforting breakfast for elders.',
                ],
            },
        ],
        faqs: [
            { q: 'Which millet is best for daily use?', a: 'Foxtail and little millet cook like rice and are easy to start with. Ragi and jowar are best as flour for rotis and porridge.' },
            { q: 'Are millets gluten-free?', a: 'Yes, millets are naturally gluten-free.' },
            { q: 'Do millets need to be soaked?', a: 'Soaking for 4–6 hours shortens cooking time and gives a softer texture.' },
            { q: 'Do you deliver millets across India?', a: SHIPPING_LINE },
        ],
        related: ['pulses-and-dal', 'seeds-and-superfoods', 'herbs-and-ayurveda'],
    },

    'pulses-and-dal': {
        title: 'Buy Dal & Pulses Online | Moong, Toor, Chana, Masoor',
        description:
            'Buy dal and pulses online: moong, toor (arhar), chana, masoor, urad and rajma. Clean, quality-checked kitchen staples delivered across India.',
        h1: 'Pulses & Dal',
        eyebrow: 'Moong · Toor · Chana · Masoor',
        intro: [
            'Buy dal and pulses online at Energyflow: moong, toor (arhar), chana, masoor, urad, rajma and kabuli chana. These are the everyday protein staples of the Indian vegetarian kitchen.',
            'Each lot is cleaned and checked for uniform grain, so it cooks evenly and needs less picking over before it goes into the pressure cooker.',
        ],
        sections: [
            {
                heading: 'Everyday protein for vegetarian families',
                body: [
                    'Dal-chawal, rajma, chole and sprouts are the backbone of a vegetarian diet. Mixing pulses with grains and millets gives a more complete protein, which is why khichdi and dal-roti have lasted for generations.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Store pulses in airtight steel or glass containers. A few dried red chillies or bay leaves in the jar is a traditional way to keep pests away. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'Which dal has the most protein?', a: 'Most dals provide roughly 20–25g of protein per 100g uncooked. Moong, masoor and chana are all good everyday sources.' },
            { q: 'Should I soak dal before cooking?', a: 'Soaking whole pulses like rajma and chana overnight is recommended. Split dals like moong and masoor need only 20–30 minutes.' },
            { q: 'How should dal be stored?', a: 'In an airtight container in a cool, dry place, away from moisture.' },
        ],
        related: ['millets-and-grains', 'seeds-and-superfoods', 'herbs-and-ayurveda'],
    },

    'herbs-and-ayurveda': {
        title: 'Buy Ayurvedic Herbs Online | Ashwagandha, Kaunch Beej',
        description:
            'Shop Ayurvedic herbs online: ashwagandha, kaunch (konch) beej, shatavari, moringa and more. Traditional wellness herbs, quality checked and delivered across India.',
        h1: 'Herbs & Ayurveda',
        eyebrow: 'Ashwagandha · Kaunch Beej · Moringa',
        intro: [
            'Shop Ayurvedic herbs online at Energyflow: ashwagandha, black kaunch (konch) beej, shatavari, moringa and other traditional herbs that have been part of Indian households for generations.',
            'These herbs are sold as raw ingredients, cleaned and packed, for people who prefer traditional wellness foods over processed supplements.',
        ],
        sections: [
            {
                heading: 'Using traditional herbs',
                body: [
                    'Ashwagandha root powder is traditionally taken with warm milk at night. Kaunch beej is usually used as a powder mixed into milk. Moringa leaf powder can be stirred into dals, parathas and smoothies.',
                    'Herbs affect everyone differently. If you are pregnant, nursing, taking medication or managing a health condition, speak to your doctor or an Ayurvedic practitioner before adding them to your routine.',
                ],
            },
        ],
        faqs: [
            { q: 'How is ashwagandha traditionally taken?', a: 'Ashwagandha powder is traditionally mixed into warm milk or water, usually in small quantities once a day. Follow the guidance on the pack or from a qualified practitioner.' },
            { q: 'What is kaunch beej?', a: 'Kaunch (konch) beej are the seeds of the Mucuna pruriens plant, used in traditional Ayurvedic preparations.' },
            { q: 'Are herbs safe for everyone?', a: 'Not always. Consult a doctor before use if you are pregnant, nursing, on medication or have a medical condition.' },
        ],
        related: ['seeds-and-superfoods', 'millets-and-grains', 'dry-fruits-and-nuts'],
    },

    'flavoured-and-special-nuts': {
        title: 'Buy Flavoured Nuts Online | Peri Peri Cashew, Roasted Pista',
        description:
            'Buy flavoured nuts online: peri peri cashews, black pepper cashews, roasted salted pista and kesar mango almonds. Crunchy, snack-ready nuts for work and travel.',
        h1: 'Flavoured & Special Nuts',
        eyebrow: 'Peri Peri · Black Pepper · Roasted',
        intro: [
            'Shop flavoured nuts online: peri peri cashews, black pepper cashews, roasted and salted pistachios, kesar mango almonds and assorted roasted nuts.',
            'They are the snack for the 4 pm office slump, road trips and movie nights, with all the crunch and spice of a packet of chips and a lot more protein.',
        ],
        sections: [
            {
                heading: 'A better desk-drawer snack',
                body: [
                    'Flavoured nuts suit working professionals and students who want a quick, filling snack between meals. Keep a pouch at your desk or in your bag instead of reaching for fried namkeen.',
                    'Serve a bowl of peri peri and black pepper cashews with drinks at a party, or add roasted pista to a festive platter.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Roasted, seasoned nuts lose their crunch when exposed to air, so reseal the pouch tightly after every use. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'Are flavoured nuts healthy?', a: 'They are a more filling snack than most fried namkeen because nuts provide protein and healthy fats. Seasoned nuts contain salt and spices, so enjoy them in sensible portions.' },
            { q: 'Which flavoured cashew is spicier?', a: 'Peri peri cashews are the spicier of the two. Black pepper cashews have a milder, peppery warmth.' },
            { q: 'How do I keep roasted nuts crunchy?', a: 'Reseal the pack airtight right after opening and keep it away from humidity.' },
        ],
        related: ['dry-fruits-and-nuts', 'flavoured-makhana-and-snacks', 'roasted-and-healthy-snacks'],
    },

    'healthy-candies-and-sweets': {
        title: 'Buy Fruit Candies & Healthy Sweets Online',
        description:
            'Shop fruit candies and traditional sweets online: orange candy, amla candy and more. Nostalgic treats for kids and a lighter alternative to mithai.',
        h1: 'Healthy Candies & Sweets',
        eyebrow: 'Orange · Amla · Fruit candies',
        intro: [
            'Shop fruit candies and traditional sweets online: tangy orange candy, amla candy and other fruit-based treats that bring back the taste of childhood.',
            'They make a lighter after-meal sweet, a lunch-box treat for kids and a thoughtful alternative to heavy mithai when you are visiting family.',
        ],
        sections: [
            {
                heading: 'Treats for kids and families',
                body: [
                    'Parents often look for sweets made with fruit instead of artificial-looking confectionery. Fruit candies are easy to portion, travel well and keep for weeks, which makes them handy for school tiffins and long journeys.',
                ],
            },
        ],
        faqs: [
            { q: 'Are fruit candies suitable for children?', a: 'Yes, as an occasional treat. They still contain sugar, so portion them as you would any sweet.' },
            { q: 'How long do fruit candies last?', a: 'Stored airtight in a cool, dry place, they keep for several weeks after opening.' },
            { q: 'Can I include candies in a gift box?', a: 'Yes. Candies pair well with dry fruits and chocolates in festive and return-gift hampers. Contact us for custom boxes.' },
        ],
        related: ['premium-chocolates', 'gift-boxes', 'imported-fruits-and-berries'],
    },

    'premium-chocolates': {
        title: 'Buy Premium Chocolates & Dry Fruit Chocolates Online',
        description:
            'Buy premium chocolates online: dry fruit chocolates, nut-coated chocolates and chocolate gift boxes for birthdays, Diwali and every celebration.',
        h1: 'Premium Chocolates',
        eyebrow: 'Dry fruit chocolates · Gifting',
        intro: [
            'Shop premium chocolates online at Energyflow: rich chocolates paired with almonds, cashews and dried fruit, made for gifting and for treating yourself.',
            'Dry fruit chocolates bring together two of India’s favourite festive gifts in one box, so they are a natural choice for birthdays, Diwali, weddings and thank-you gifts.',
        ],
        sections: [
            {
                heading: 'Chocolates for gifting',
                body: [
                    'Combine chocolates with dry fruits in a custom gift box for festivals and corporate hampers, or pick a single box for a birthday or house-warming. For bulk and branded orders, get in touch and we will put together options for your budget.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Keep chocolates in a cool, dry place below 25°C and away from sunlight. In summer, store them in the fridge in an airtight box and bring them to room temperature before serving.',
                ],
            },
        ],
        faqs: [
            { q: 'Will chocolates melt during delivery?', a: 'We pack chocolates to protect them in transit. During peak summer, please store them in a cool place as soon as they arrive.' },
            { q: 'Can I order chocolates in bulk for corporate gifting?', a: 'Yes. Contact us with your quantity and budget for bulk and custom-branded chocolate hampers.' },
            { q: 'How should chocolates be stored?', a: 'Below 25°C, in an airtight container, away from sunlight and strong smells.' },
        ],
        related: ['gift-boxes', 'healthy-candies-and-sweets', 'dry-fruits-and-nuts'],
    },

    'flavoured-makhana-and-snacks': {
        title: 'Buy Flavoured Makhana Online | Roasted Fox Nuts',
        description:
            'Buy flavoured roasted makhana (fox nuts) online in peri peri, pudina, cheese and classic salted. A light, crunchy, roasted-not-fried healthy snack.',
        h1: 'Flavoured Makhana & Snacks',
        eyebrow: 'Roasted fox nuts · Lotus seeds',
        intro: [
            'Buy flavoured makhana online: roasted fox nuts (lotus seeds) in peri peri, pudina, cheese and classic salted flavours. It is one of India’s favourite guilt-free snacks.',
            'Makhana is roasted, not deep-fried, so it is light and crunchy. That makes it the go-to snack for evening chai, office desks, kids’ tiffins and fasting days.',
        ],
        sections: [
            {
                heading: 'Why makhana is a popular healthy snack',
                body: [
                    'Makhana is low in fat, naturally gluten-free and a source of plant protein, which is why it has replaced chips for many health-conscious families and fitness enthusiasts.',
                    'Plain makhana is also a traditional vrat (fasting) food. It can be roasted in ghee at home, added to kheer or cooked in curries.',
                ],
            },
            {
                heading: 'Storage',
                body: [
                    'Makhana absorbs moisture quickly, so always reseal the pack. If it loses its crunch, dry-roast it in a pan for 2–3 minutes. ' + SHIPPING_LINE,
                ],
            },
        ],
        faqs: [
            { q: 'Is makhana a healthy snack?', a: 'Makhana is roasted rather than fried, low in fat and a source of plant protein, which makes it a lighter snack than chips or fried namkeen.' },
            { q: 'What is the difference between makhana and fox nuts?', a: 'There is none. Makhana, fox nuts and lotus seeds are different names for the same popped seed.' },
            { q: 'Can I eat makhana during a fast?', a: 'Plain makhana is traditionally eaten during vrat. Check the ingredients of flavoured variants if you follow specific fasting rules.' },
            { q: 'How do I keep makhana crunchy?', a: 'Reseal the pack airtight after every use. If it softens, dry-roast it for a couple of minutes.' },
        ],
        related: ['roasted-and-healthy-snacks', 'flavoured-and-special-nuts', 'seeds-and-superfoods'],
    },

    'roasted-and-healthy-snacks': {
        title: 'Healthy Roasted Snacks Online | Trail Mix, Protein Snacks',
        description:
            'Shop healthy snacks online: roasted snacks, trail mix, roasted chana and protein snacks. Better-for-you munchies for work, school and the gym bag.',
        h1: 'Roasted & Healthy Snacks',
        eyebrow: 'Trail mix · Roasted · Protein',
        intro: [
            'Shop healthy snacks online at Energyflow: roasted snacks, trail mixes, roasted chana and protein-rich munchies that swap deep-fried namkeen for something that keeps you going.',
            'They are made for busy days: between meetings, after the gym, in a school bag or on a long drive.',
        ],
        sections: [
            {
                heading: 'Snacks for every routine',
                body: [
                    'Working professionals keep a pouch at their desk, fitness enthusiasts carry a trail mix in the gym bag, and parents pack roasted snacks in tiffins instead of biscuits. Pair them with nuts and seeds for a more filling mini-meal.',
                ],
            },
        ],
        faqs: [
            { q: 'What makes a snack healthy?', a: 'Look for roasted rather than fried snacks, whole ingredients like nuts, seeds and pulses, and sensible salt and sugar levels.' },
            { q: 'What is trail mix?', a: 'A mix of nuts, seeds and dried fruit that gives a balance of protein, healthy fats and quick energy.' },
            { q: 'Are roasted snacks good for kids?', a: 'Yes, roasted snacks made from nuts, pulses and seeds make a good tiffin alternative to fried chips and biscuits.' },
        ],
        related: ['flavoured-makhana-and-snacks', 'flavoured-and-special-nuts', 'seeds-and-superfoods'],
    },

    'gift-boxes': {
        title: 'Dry Fruit Gift Boxes & Hampers | Diwali & Corporate Gifts',
        description:
            'Buy dry fruit gift boxes and hampers online for Diwali, weddings, birthdays and corporate gifting. Premium nuts, chocolates and sweets, with custom bulk orders.',
        h1: 'Dry Fruit Gift Boxes & Hampers',
        eyebrow: 'Diwali · Weddings · Corporate',
        intro: [
            'Shop dry fruit gift boxes and hampers online: premium almonds, cashews, pistachios, berries and chocolates, packed in gift-ready boxes for Diwali, Raksha Bandhan, weddings, birthdays and every family occasion.',
            'A dry fruit hamper is a healthier gift than a box of mithai, and it lasts for months instead of days, which is why it has become India’s favourite festive and corporate gift.',
        ],
        sections: [
            {
                heading: 'Corporate gifting and bulk orders',
                body: [
                    'We put together dry fruit and chocolate hampers for employee gifts, client thank-yous and festive corporate gifting, with volume pricing for bulk orders. Tell us your quantity, budget and delivery date and we will suggest options.',
                    'For Diwali, place custom and branded orders early: September and the first half of October are ideal, so every box arrives on time.',
                ],
            },
            {
                heading: 'Gifts for every occasion',
                body: [
                    'Wedding favours and shagun boxes, birthday and return gifts, house-warmings, festive visits and thank-you gifts for teachers and neighbours. There is a box for every budget, from compact dry fruit packs to premium hampers with imported nuts and chocolates.',
                ],
            },
        ],
        faqs: [
            { q: 'Do you take bulk orders for corporate Diwali gifting?', a: 'Yes. Contact us with your quantity, budget and delivery date, and we will share hamper options and volume pricing.' },
            { q: 'Can I customise a dry fruit gift box?', a: 'Yes, for bulk orders we can customise the mix of dry fruits, chocolates and sweets. Get in touch with your requirements.' },
            { q: 'When should I order Diwali gift hampers?', a: 'For custom or bulk hampers, order in September or early October. Single gift boxes can be ordered closer to the festival, subject to delivery times.' },
            { q: 'Do you deliver gift boxes across India?', a: SHIPPING_LINE },
        ],
        related: ['dry-fruits-and-nuts', 'premium-chocolates', 'healthy-candies-and-sweets'],
    },
}

// Categories added later in the admin (ghee, honey, dates…) still get a
// complete, keyword-led page until bespoke copy is written for them.
export const getCategorySeo = (slug, name) => {
    const seo = CATEGORY_SEO[slug]
    if (seo) return seo
    return {
        title: `Buy ${name} Online`,
        description: `Buy ${name.toLowerCase()} online at Energyflow. Premium quality, checked before packing and delivered across India with free shipping on prepaid orders.`,
        h1: name,
        eyebrow: 'Energyflow pantry',
        intro: [`Shop ${name.toLowerCase()} online at Energyflow, quality checked before packing and delivered across India.`],
        sections: [],
        faqs: [
            { q: `How do you check the quality of your ${name.toLowerCase()}?`, a: 'Every lot is checked on intake for grade, moisture, foreign matter and freshness before it is packed. Anything that fails a check does not make it to the shelf.' },
            { q: `How should I store ${name.toLowerCase()}?`, a: 'Keep it in an airtight container in a cool, dry place, away from heat, moisture and direct sunlight. The packed and best before dates are printed on every pack.' },
            { q: `Can I buy ${name.toLowerCase()} in bulk or for gifting?`, a: 'Yes. Contact us with the products and quantities you need, and we will confirm availability and volume pricing.' },
            { q: `Do you deliver ${name.toLowerCase()} across India?`, a: SHIPPING_LINE },
        ],
        related: ['dry-fruits-and-nuts', 'seeds-and-superfoods', 'gift-boxes'],
    }
}
