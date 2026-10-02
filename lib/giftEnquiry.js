import { z } from 'zod'

// Corporate / bulk gifting enquiries — the options and validation shared by
// the storefront form (/shop?category=gift-boxes, /category/gift-boxes) and
// /api/gift-enquiry, so the client and the server always agree on what is a
// valid enquiry.

export const GIFTING_CATEGORY_SLUG = 'gift-boxes'

// Smallest order the gifting team quotes for. Below this, the gift boxes can
// simply be bought from the collection on the same page.
export const MIN_GIFT_QUANTITY = 10
export const MAX_GIFT_QUANTITY = 100000

export const QUANTITY_PRESETS = [25, 50, 100, 250, 500]

export const OCCASIONS = [
    { value: 'diwali', label: 'Diwali & festive' },
    { value: 'employees', label: 'Employee gifting' },
    { value: 'clients', label: 'Client thank-you' },
    { value: 'events', label: 'Events & conferences' },
    { value: 'wedding', label: 'Weddings & functions' },
    { value: 'other', label: 'Something else' },
]

export const BUDGETS = [
    { value: 'under-1000', label: 'Under ₹1,000' },
    { value: '1000-2500', label: '₹1,000 – ₹2,500' },
    { value: '2500-5000', label: '₹2,500 – ₹5,000' },
    { value: '5000-plus', label: '₹5,000+' },
    { value: 'undecided', label: 'Not sure yet' },
]

// Admin pipeline for an enquiry. `tone` maps onto the admin <Pill> tones.
export const ENQUIRY_STATUSES = [
    { value: 'new', label: 'New', tone: 'sun' },
    { value: 'contacted', label: 'Contacted', tone: 'pine' },
    { value: 'quoted', label: 'Quote sent', tone: 'olive' },
    { value: 'won', label: 'Order confirmed', tone: 'forest' },
    { value: 'lost', label: 'Closed', tone: 'danger' },
]

const values = (list) => list.map((item) => item.value)
export const labelFor = (list, value) => list.find((item) => item.value === value)?.label || value || ''

export const OCCASION_VALUES = values(OCCASIONS)
export const BUDGET_VALUES = values(BUDGETS)
export const STATUS_VALUES = values(ENQUIRY_STATUSES)

// "YYYY-MM-DD" from a date input. Valid when it is today or later (a day of
// slack absorbs the visitor's timezone vs the server's) and within ~18 months.
const DAY_MS = 24 * 60 * 60 * 1000
export const isValidDeliveryDate = (value) => {
    if (!value) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const time = Date.parse(`${value}T00:00:00Z`)
    if (Number.isNaN(time)) return false
    const now = Date.now()
    return time >= now - 1.5 * DAY_MS && time <= now + 550 * DAY_MS
}

// Local "YYYY-MM-DD" for today — the `min` of the date input.
export const todayInputValue = () => {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const optionalText = (max, message) =>
    z.string().trim().max(max, message).optional().or(z.literal(''))

export const giftEnquirySchema = z.object({
    name: z.string({ required_error: 'Please enter your name.' }).trim().min(2, 'Please enter your name.').max(80, 'Name is too long.'),
    company: optionalText(120, 'Company name is too long.'),
    email: z.string({ required_error: 'Please enter your email address.' }).trim().toLowerCase().max(254, 'Email is too long.').email('Please enter a valid email address.'),
    phone: z.string({ required_error: 'Please enter your phone number.' }).trim().regex(/^\+?[0-9][0-9\s().-]{8,18}$/, 'Please enter a valid phone number.'),
    city: optionalText(60, 'City is too long.'),
    occasion: z.enum(OCCASION_VALUES, { errorMap: () => ({ message: 'Please choose an occasion.' }) }),
    quantity: z.coerce
        .number({ invalid_type_error: 'Please enter how many boxes you need.' })
        .int('Please enter a whole number of boxes.')
        .min(MIN_GIFT_QUANTITY, `Bulk orders start at ${MIN_GIFT_QUANTITY} boxes.`)
        .max(MAX_GIFT_QUANTITY, 'For orders this large, please call us directly.'),
    // An untouched radio group reports null.
    budget: z.enum(BUDGET_VALUES).nullable().optional().or(z.literal('')),
    deliveryDate: z.string().trim().optional().or(z.literal(''))
        .refine(isValidDeliveryDate, 'Please pick a delivery date from today onwards.'),
    branding: z.boolean().optional().default(false),
    products: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(20).optional().default([]),
    message: optionalText(2000, 'Message is too long (2,000 characters max).'),
})
