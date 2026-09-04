'use client'
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Package, Star } from 'lucide-react'

import imgPlaceholder from '@/public/assets/images/img-placeholder.webp'
import useFetch from "@/hooks/useFetch";
import { useEffect, useState } from "react";
import Image from "next/image"
import notFound from '@/public/assets/images/not-found.png'
const LatestReview = () => {
    const [latestReview, setLatestReview] = useState()
    const { data: getLatestReview, loading } = useFetch('/api/dashboard/admin/latest-review')

    useEffect(() => {
        if (getLatestReview && getLatestReview.success) {
            setLatestReview(getLatestReview.data)
        }
    }, [getLatestReview])

    if (loading) return <div className="h-full w-full flex justify-center items-center">Loading...</div>

    if (!latestReview || latestReview.length === 0) return <div className="h-full w-full flex justify-center items-center">
        <Image src={notFound.src} width={notFound.width} height={notFound.height} alt="not found" className="w-20" />
    </div>

    return (
        <Table>
            <TableHeader>
                <TableRow className="group/row">
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5" />
                            Product
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Star className="h-3.5 w-3.5" />
                            Rating
                        </span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {latestReview?.map((review) => (
                    <TableRow key={review._id} className="group/row text-sm">
                        <TableCell className="bg-background py-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={review?.product?.media[0]?.secure_url || imgPlaceholder.src} />
                                </Avatar>
                                <span className="line-clamp-1 font-medium">{review?.product?.name || 'Not found'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="bg-background py-3">
                            <div className="flex items-center gap-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <span key={i}>
                                        <Star className="text-yellow-400 w-4 h-4 fill-yellow-400" />
                                    </span>
                                ))}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default LatestReview
