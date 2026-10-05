import { z } from 'zod'
import { zSchema } from './zodSchema.js'
import { COVER_POSITIONS } from './categoryCover.js'

// Optional fields preserve covers when an older client only updates the name.
export const categorySchema = zSchema.pick({ name: true, slug: true }).extend({
    coverImage: z.string().regex(/^[a-f\d]{24}$/i, 'Choose an image from the media library.').nullable().optional(),
    coverAlt: z.string().trim().max(200, 'Alt text must be at most 200 characters.').optional(),
    coverPosition: z.enum(COVER_POSITIONS).optional(),
})

export const categoryUpdateSchema = categorySchema.extend({
    _id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid category ID.'),
    updatedAt: z.string().datetime().optional(),
})
