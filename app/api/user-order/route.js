import { isAuthenticated } from "@/lib/authentication";
import { connectDB } from "@/lib/databaseConnection";
import { catchError, response } from "@/lib/helperFunction";
import OrderModel, { withDefaultShipmentMany } from "@/models/Order.model";
import mongoose from "mongoose";

export async function GET(request) {
    try {
        await connectDB()
        const auth = await isAuthenticated('user', request)
        if (!auth.isAuth) {
            return response(false, 401, 'Unauthorized')
        }

        const userId = auth.userId
        const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null

        // No valid user id => no orders. Orders are matched strictly by owner; the
        // order's contact email is user-supplied and is never used for access.
        if (!userObjectId) {
            return response(true, 200, 'Order info.', [])
        }

        const orders = await OrderModel.aggregate([
            {
                $match: {
                    deletedAt: null,
                    user: userObjectId
                }
            },
            {
                $sort: {
                    createdAt: -1,
                }
            },
            {
                $lookup: {
                    from: 'products',
                    let: { productIds: { $ifNull: ['$products.productId', []] } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$productIds'] }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                slug: 1,
                            }
                        }
                    ],
                    as: 'productDocs'
                }
            },
            {
                $lookup: {
                    from: 'productvariants',
                    let: { variantIds: { $ifNull: ['$products.variantId', []] } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$_id', '$$variantIds'] }
                            }
                        },
                        {
                            $lookup: {
                                from: 'medias',
                                localField: 'media',
                                foreignField: '_id',
                                as: 'media'
                            }
                        }
                    ],
                    as: 'variantDocs'
                }
            },
            {
                $addFields: {
                    products: {
                        $map: {
                            input: '$products',
                            as: 'item',
                            in: {
                                $mergeObjects: [
                                    '$$item',
                                    {
                                        productId: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$productDocs',
                                                        as: 'productDoc',
                                                        cond: {
                                                            $eq: ['$$productDoc._id', '$$item.productId']
                                                        }
                                                    }
                                                },
                                                0
                                            ]
                                        },
                                        variantId: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$variantDocs',
                                                        as: 'variantDoc',
                                                        cond: {
                                                            $eq: ['$$variantDoc._id', '$$item.variantId']
                                                        }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    productDocs: 0,
                    variantDocs: 0,
                }
            }
        ])


        return response(true, 200, 'Order info.', withDefaultShipmentMany(orders))

    } catch (error) {
        return catchError(error)
    }
}
