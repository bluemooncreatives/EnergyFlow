import { z } from 'zod'

export const zSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email({ message: "Invalid email address" }),

    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
        .max(64, { message: "Password must be at most 64 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),

    name: z
        .string()
        .min(2, { message: "Name must be at least 2 characters" })
        .max(50, { message: "Name must be at most 50 characters" }),
    otp: z.string().regex(/^\d{6}$/, {
        message: "OTP must be a 6-digit number",
    }),
    _id: z.string().min(3, '_id is required.'),
    alt: z.string().min(3, 'Alt is required.'),
    title: z.string().min(3, 'Title is required.'),
    slug: z.string().min(3, 'Slug is required.'),
    parentSku: z.string().trim().min(1, 'Parent SKU is required.'),

    category: z.string().min(3, 'Category is required.'),
    sizeGuide: z.string().min(3, 'Size guide is required.').nullable().optional(),
    // MRP and Selling Price are money fields: always a positive number (coerced
    // so number inputs that arrive as strings validate cleanly). The cross-field
    // rule (Selling Price <= MRP) lives in lib/pricing.js (validatePricing),
    // because this is a flat shape reused across many forms.
    mrp: z.coerce
        .number({ invalid_type_error: 'Please enter a valid number.' })
        .positive('MRP must be greater than 0.'),
    sellingPrice: z.coerce
        .number({ invalid_type_error: 'Please enter a valid number.' })
        .positive('Selling price must be greater than 0.'),
    // Derived from MRP & Selling Price. 0% is valid (Selling Price == MRP); the
    // server always recomputes this, so a stale/tampered client value is ignored.
    discountPercentage: z.coerce
        .number({ invalid_type_error: 'Please enter a valid number.' })
        .min(0, 'Discount cannot be negative.')
        .max(100, 'Discount cannot exceed 100%.'),
    description: z.string().min(3, 'Description is required.'),
    media: z.array(z.string()),
    product: z.string().min(3, 'Product is required.'),
    color: z.string().min(3, 'Color is required.'),
    colorHex: z
        .string()
        .trim()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'Enter a valid hex color (e.g. #50C878).')
        .optional()
        .or(z.literal('')),
    size: z.string().min(1, 'Size is required.'),
    sku: z.string().min(3, 'SKU is required.'),
    amount: z.union([
        z.number().positive('Expected positive value, received negative.'),
        z.string().transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0, 'Please enter a valid number.')
    ]),
    minShoppingAmount: z.union([
        z.number().positive('Expected positive value, received negative.'),
        z.string().transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0, 'Please enter a valid number.')
    ]),
    validity: z.coerce.date(),
    userId: z.string().min(3, 'User id is required.'),
    rating: z.union([
        z.number().positive('Expected positive value, received negative.'),
        z.string().transform((val) => Number(val)).refine((val) => !isNaN(val) && val >= 0, 'Please enter a valid number.')
    ]),
    review: z.string().min(3, 'Review is required.'),
    // Star rating for admin-authored homepage testimonials. Coerced (number
    // inputs may arrive as strings), forced to a whole number, and clamped to
    // the 1–5 range the storefront star row can actually render.
    testimonialRating: z.coerce
        .number({ invalid_type_error: 'Please select a rating.' })
        .int('Rating must be a whole number.')
        .min(1, 'Rating must be between 1 and 5.')
        .max(5, 'Rating must be between 1 and 5.'),
    // Coupon codes are case-insensitive for users but stored canonically in UPPERCASE.
    // trim() drops stray spaces, toUpperCase() normalises before the min-length check.
    code: z.string().trim().toUpperCase().min(3, 'Coupon code is required.'),
    // Accepts 10–15 digits with optional leading + and common separators.
    // Stored as a string so leading zeros / country codes are never lost.
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9][0-9\s().-]{8,18}$/, 'Please enter a valid phone number'),
    country: z.string().trim().min(2, 'Country is required.').max(60, 'Country is too long.'),
    state: z.string().trim().min(2, 'State is required.').max(60, 'State is too long.'),
    city: z.string().trim().min(2, 'City is required.').max(60, 'City is too long.'),
    pincode: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/, 'Please enter a valid pincode / ZIP'),
    // Landmark is an optional convenience field (e.g. "near City Mall"). Normalised
    // to '' so an absent value never trips downstream "required" checks.
    landmark: z.string().trim().max(120, 'Landmark is too long.').optional().or(z.literal('')),
    ordernote: z.string().trim().max(500, 'Order note is too long.').optional().or(z.literal('')),
    address: z.string().trim().min(5, 'Please enter your full address.').max(250, 'Address is too long.'),
})