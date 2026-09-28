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

    if (loading) return <div className="h-full w-full flex justify-center items-center py-8 text-sm text-muted-foreground">Loading...</div>

    if (!latestReview || latestReview.length === 0) return <div className="h-full w-full flex justify-center items-center py-8">
        <Image src={notFound.src} width={notFound.width} height={notFound.height} alt="not found" className="w-16 opacity-50" />
    </div>

    return (
        <Table>
            <TableHeader>
                <TableRow className="group/row">
                    <TableHead className="bg-background text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <Package className="size-3.5" />
                            Product
                        </span>
                    </TableHead>
                    <TableHead className="bg-background text-right text-xs font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Star className="size-3.5" />
                            Rating
                        </span>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {latestReview?.map((review) => (
                    <TableRow key={review._id} className="group/row text-xs sm:text-sm">
                        <TableCell className="bg-background py-2.5">
                            <div className="flex items-center gap-2.5">
                                <Avatar className="size-8 shrink-0 rounded-md">
                                    <AvatarImage src={review?.product?.media?.[0]?.secure_url || imgPlaceholder.src} className="rounded-md object-cover" />
                                </Avatar>
                                <span className="line-clamp-1 font-medium">{review?.product?.name || 'Product'}</span>
                            </div>
                        </TableCell>
                        <TableCell className="bg-background py-2.5 text-right">
                            <div className="inline-flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`size-3 ${i < review.rating ? 'fill-[var(--brand-gold)] text-[var(--brand-gold)]' : 'text-muted-foreground/30'}`}
                                    />
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
