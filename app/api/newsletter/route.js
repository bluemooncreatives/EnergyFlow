import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/authentication'
import { connectDB } from '@/lib/databaseConnection'
import { catchError, escapeRegex, response } from '@/lib/helperFunction'
import NewsletterSubscriberModel from '@/models/NewsletterSubscriber.model'

const FILTERABLE = ['email', 'name', 'status', 'source', 'couponCode', 'pagePath']
const SORTABLE = ['email', 'name', 'status', 'source', 'couponCode', 'pagePath', 'createdAt', 'subscribedAt', 'unsubscribedAt', 'deletedAt']

// Admin: paginated subscriber list in the Datatable contract
// (start, size, filters, globalFilter, sorting, deleteType).
export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const searchParams = request.nextUrl.searchParams
        const start = Math.max(0, parseInt(searchParams.get('start') || 0, 10) || 0)
        const size = Math.min(500, Math.max(1, parseInt(searchParams.get('size') || 10, 10) || 10))
        const filters = JSON.parse(searchParams.get('filters') || '[]')
        const globalFilter = searchParams.get('globalFilter') || ''
        const sorting = JSON.parse(searchParams.get('sorting') || '[]')
        const deleteType = searchParams.get('deleteType')

        let matchQuery = {}
        if (deleteType === 'SD') {
            matchQuery = { deletedAt: null }
        } else if (deleteType === 'PD') {
            matchQuery = { deletedAt: { $ne: null } }
        }

        if (globalFilter) {
            const pattern = escapeRegex(globalFilter)
            matchQuery.$or = ['email', 'name', 'status', 'source', 'couponCode', 'pagePath'].map((field) => ({
                [field]: { $regex: pattern, $options: 'i' },
            }))
        }

        filters.forEach((filter) => {
            if (FILTERABLE.includes(filter?.id) && filter.value) {
                matchQuery[filter.id] = { $regex: escapeRegex(filter.value), $options: 'i' }
            }
        })

        const sortQuery = {}
        sorting.forEach((sort) => {
            if (SORTABLE.includes(sort?.id)) sortQuery[sort.id] = sort.desc ? -1 : 1
        })

        const subscribers = await NewsletterSubscriberModel.aggregate([
            { $match: matchQuery },
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            { $project: { unsubscribeToken: 0 } },
        ])
        const totalRowCount = await NewsletterSubscriberModel.countDocuments(matchQuery)

        return NextResponse.json({
            success: true,
            data: subscribers,
            meta: { totalRowCount },
        })
    } catch (error) {
        return catchError(error)
    }
}
