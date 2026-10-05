import { NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { giftEnquiryNotification } from '@/email/giftEnquiryNotification'
import { giftEnquiryConfirmation } from '@/email/giftEnquiryConfirmation'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { generateTicketId } from '@/lib/generateTicketId'
import { BUDGETS, OCCASIONS, giftEnquirySchema, labelFor } from '@/lib/giftEnquiry'
import { catchError, escapeRegex, response } from '@/lib/helperFunction'
import { sendMail } from '@/lib/sendMail'
import GiftEnquiryModel from '@/models/GiftEnquiry.model'
import ProductModel from '@/models/Product.model'

// Best-effort per-IP throttle: 5 enquiries per 10 minutes. In-memory, so it
// resets on a cold start and is per-instance on serverless — enough to blunt
// a scripted flood, not a substitute for an edge WAF.
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const attempts = new Map()

const isThrottled = (ip) => {
  const now = Date.now()
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  attempts.set(ip, recent)
  if (attempts.size > 5000) {
    for (const [key, list] of attempts) {
      if (!list.some((t) => now - t < WINDOW_MS)) attempts.delete(key)
    }
  }
  return recent.length > MAX_ATTEMPTS
}

const clientIp = (request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  'unknown'

// A second identical submit (double click, retry after a slow network) within
// this window returns the first enquiry's reference instead of a duplicate.
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000

const formatDeliveryDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : ''

// Public: corporate / bulk gifting enquiry from the gift-boxes page.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return response(false, 400, 'Invalid request.')
    }

    // Honeypot: a hidden field real visitors never fill. Pretend success so
    // bots don't learn to skip it.
    if (body.website) {
      return response(true, 200, 'Enquiry received.', { ticketId: null })
    }

    if (isThrottled(clientIp(request))) {
      return response(false, 429, 'Too many enquiries from this connection. Please try again in a few minutes, or call us.')
    }

    const parsed = giftEnquirySchema.safeParse(body)
    if (!parsed.success) {
      const first = parsed.error.issues[0]
      return response(false, 400, first?.message || 'Please check the form and try again.', {
        field: first?.path?.[0] || null,
      })
    }
    const data = parsed.data

    await connectDB()

    // A signed-in customer gets the enquiry in their account to track.
    const auth = await isAuthenticated('user', request)
    const userId = auth.isAuth && isValidObjectId(auth.userId) ? auth.userId : null

    const duplicate = await GiftEnquiryModel.findOne({
      email: data.email,
      quantity: data.quantity,
      occasion: data.occasion,
      deletedAt: null,
      createdAt: { $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    })
      .select('ticketId user')
      .lean()
    if (duplicate) {
      // Sent as a guest, then again after signing in: claim it for the account.
      if (userId && !duplicate.user) {
        await GiftEnquiryModel.updateOne({ _id: duplicate._id, user: null }, { $set: { user: userId } })
      }
      return response(true, 200, 'We already have this enquiry - our team will be in touch shortly.', {
        ticketId: duplicate.ticketId,
        duplicate: true,
        tracked: Boolean(userId),
      })
    }

    // Keep only boxes that still exist, and snapshot their names so the
    // enquiry reads correctly even if a product is renamed or removed later.
    const productIds = [...new Set(data.products)].filter(isValidObjectId)
    const products = productIds.length
      ? await ProductModel.find({ _id: { $in: productIds }, deletedAt: null }).select('name slug').lean()
      : []

    const payload = {
      user: userId,
      name: data.name,
      company: data.company || '',
      email: data.email,
      phone: data.phone,
      city: data.city || '',
      occasion: data.occasion,
      quantity: data.quantity,
      budget: data.budget || '',
      deliveryDate: data.deliveryDate ? new Date(`${data.deliveryDate}T00:00:00Z`) : null,
      branding: Boolean(data.branding),
      products: products.map((p) => ({ product: p._id, name: p.name, slug: p.slug })),
      message: data.message || '',
      pagePath: String(body.pagePath || '').split(/[?#]/)[0].slice(0, 300),
    }

    // Mint a unique reference; retry on the (astronomically rare) collision
    // with an existing one, which the unique index reports as code 11000.
    let enquiry = null
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        enquiry = await GiftEnquiryModel.create({
          ...payload,
          ticketId: generateTicketId('GE'),
          statusHistory: [{ status: 'new', at: new Date() }],
        })
        break
      } catch (err) {
        const isDuplicateTicket = err?.code === 11000 && err?.keyPattern && 'ticketId' in err.keyPattern
        if (isDuplicateTicket && attempt < 4) continue
        throw err
      }
    }

    const emailData = {
      ...payload,
      id: String(enquiry._id),
      ticketId: enquiry.ticketId,
      occasion: labelFor(OCCASIONS, payload.occasion),
      budget: labelFor(BUDGETS, payload.budget),
      deliveryDate: formatDeliveryDate(payload.deliveryDate),
    }

    // Both mails are best-effort: the enquiry is saved, and sendMail never
    // throws, so a mail outage can't fail the customer's submission.
    await Promise.allSettled([
      sendMail(
        `New gifting enquiry [${enquiry.ticketId}] - ${payload.quantity} boxes${payload.company ? ` · ${payload.company}` : ''}`,
        process.env.NODEMAILER_EMAIL,
        giftEnquiryNotification(emailData),
        { replyTo: payload.email }
      ),
      sendMail(
        `We've received your gifting enquiry - Ref ${enquiry.ticketId}`,
        payload.email,
        giftEnquiryConfirmation(emailData)
      ),
    ])

    return response(true, 200, 'Enquiry received.', { ticketId: enquiry.ticketId, tracked: Boolean(userId) })
  } catch (error) {
    return catchError(error, 'We could not send your enquiry. Please try again.')
  }
}

// Columns the admin table may filter on (all plain string fields).
const FILTERABLE = ['ticketId', 'name', 'company', 'email', 'phone', 'city', 'occasion', 'status', 'budget']

// Admin: paginated list for the data table.
export async function GET(request) {
  try {
    const auth = await isAuthenticated('admin')
    if (!auth.isAuth) {
      return response(false, 403, 'Unauthorized.')
    }

    await connectDB()

    const searchParams = request.nextUrl.searchParams
    const start = Math.max(parseInt(searchParams.get('start') || 0, 10) || 0, 0)
    const size = Math.min(Math.max(parseInt(searchParams.get('size') || 10, 10) || 10, 1), 200)
    const filters = JSON.parse(searchParams.get('filters') || '[]')
    const globalFilter = (searchParams.get('globalFilter') || '').trim().slice(0, 100)
    const sorting = JSON.parse(searchParams.get('sorting') || '[]')
    const deleteType = searchParams.get('deleteType')

    const matchQuery = {}
    if (deleteType === 'SD') matchQuery.deletedAt = null
    else if (deleteType === 'PD') matchQuery.deletedAt = { $ne: null }

    if (globalFilter) {
      const regex = { $regex: escapeRegex(globalFilter), $options: 'i' }
      matchQuery.$or = [
        { ticketId: regex },
        { name: regex },
        { company: regex },
        { email: regex },
        { phone: regex },
        { city: regex },
        { message: regex },
        { 'products.name': regex },
      ]
    }

    if (Array.isArray(filters)) {
      filters.forEach((filter) => {
        if (FILTERABLE.includes(filter?.id) && typeof filter.value === 'string') {
          matchQuery[filter.id] = { $regex: escapeRegex(filter.value), $options: 'i' }
        }
      })
    }

    const sortQuery = {}
    if (Array.isArray(sorting)) {
      sorting.forEach((sort) => {
        if (typeof sort?.id === 'string' && /^[a-zA-Z]+$/.test(sort.id)) sortQuery[sort.id] = sort.desc ? -1 : 1
      })
    }

    const [enquiries, totalRowCount] = await Promise.all([
      GiftEnquiryModel.find(matchQuery)
        .sort(Object.keys(sortQuery).length ? { ...sortQuery, _id: -1 } : { createdAt: -1 })
        .skip(start)
        .limit(size)
        .lean(),
      GiftEnquiryModel.countDocuments(matchQuery),
    ])

    return NextResponse.json({ success: true, data: enquiries, meta: { totalRowCount } })
  } catch (error) {
    return catchError(error)
  }
}
