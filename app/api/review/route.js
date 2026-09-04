import { isAuthenticated } from "@/lib/authentication"
import { connectDB } from "@/lib/databaseConnection"
import { catchError, response } from "@/lib/helperFunction"
import ReviewModel from "@/models/Review.model"

import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const auth = await isAuthenticated('admin')
        if (!auth.isAuth) {
            return response(false, 403, 'Unauthorized.')
        }

        await connectDB()

        const searchParams = request.nextUrl.searchParams

        // Extract query parameters 
        const start = parseInt(searchParams.get('start') || 0, 10)
        const size = parseInt(searchParams.get('size') || 10, 10)
        const filters = JSON.parse(searchParams.get('filters') || "[]")
        const globalFilter = searchParams.get('globalFilter') || ""
        const sorting = JSON.parse(searchParams.get('sorting') || "[]")
        const deleteType = searchParams.get('deleteType')

        // Build match query  
        let matchQuery = {}
        let preMatchQuery = {}
        let postMatchQuery = {}

        if (deleteType === 'SD') {
            matchQuery = { deletedAt: null }
            preMatchQuery = { deletedAt: null }
        } else if (deleteType === 'PD') {
            matchQuery = { deletedAt: { $ne: null } }
            preMatchQuery = { deletedAt: { $ne: null } }
        }

        // Global search 
        if (globalFilter) {
            matchQuery["$or"] = [
                { "productData.name": { $regex: globalFilter, $options: 'i' } },
                { "userData.name": { $regex: globalFilter, $options: 'i' } },
                { rating: { $regex: globalFilter, $options: 'i' } },
                { title: { $regex: globalFilter, $options: 'i' } },
                { review: { $regex: globalFilter, $options: 'i' } },

            ]
            postMatchQuery["$or"] = matchQuery["$or"]
        }

        //  Column filteration  

        filters.forEach(filter => {
            if (filter.id === 'product') {
                matchQuery['productData.name'] = { $regex: filter.value, $options: 'i' }
                postMatchQuery['productData.name'] = { $regex: filter.value, $options: 'i' }
            } else if (filter.id === 'user') {
                matchQuery['userData.name'] = { $regex: filter.value, $options: 'i' }
                postMatchQuery['userData.name'] = { $regex: filter.value, $options: 'i' }
            } else {
                matchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
                preMatchQuery[filter.id] = { $regex: filter.value, $options: 'i' }
            }
        });

        //   Sorting  
        let sortQuery = {}
        sorting.forEach(sort => {
            sortQuery[sort.id] = sort.desc ? -1 : 1
        });


        // Aggregate pipeline  

        const aggregatePipeline = [
            ...(Object.keys(preMatchQuery).length ? [{ $match: preMatchQuery }] : []),
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productData'
                }
            },
            {
                $unwind: { path: '$productData', preserveNullAndEmptyArrays: true }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userData'
                }
            },
            {
                $unwind: { path: '$userData', preserveNullAndEmptyArrays: true }
            },
            ...(Object.keys(postMatchQuery).length ? [{ $match: postMatchQuery }] : []),
            { $sort: Object.keys(sortQuery).length ? sortQuery : { createdAt: -1 } },
            { $skip: start },
            { $limit: size },
            {
                $project: {
                    _id: 1,
                    product: '$productData.name',
                    user: '$userData.name',
                    rating: 1,
                    review: 1,
                    title: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    deletedAt: 1
                }
            }
        ]

        // Execute query  

        const getReview = await ReviewModel.aggregate(aggregatePipeline)

        // Get totalRowCount with the same pre/post match logic
        let totalRowCount = 0
        if (Object.keys(postMatchQuery).length) {
            const countPipeline = [
                ...(Object.keys(preMatchQuery).length ? [{ $match: preMatchQuery }] : []),
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productData'
                    }
                },
                {
                    $unwind: { path: '$productData', preserveNullAndEmptyArrays: true }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                {
                    $unwind: { path: '$userData', preserveNullAndEmptyArrays: true }
                },
                { $match: postMatchQuery },
                { $count: 'count' }
            ]
            const countResult = await ReviewModel.aggregate(countPipeline)
            totalRowCount = countResult[0]?.count ?? 0
        } else {
            totalRowCount = await ReviewModel.countDocuments(preMatchQuery)
        }

        return NextResponse.json({
            success: true,
            data: getReview,
            meta: { totalRowCount }
        })

    } catch (error) {
        return catchError(error)
    }
}
