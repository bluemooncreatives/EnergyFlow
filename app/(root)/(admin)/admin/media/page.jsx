'use client'
import BreadCrumb from '@/components/Application/Admin/BreadCrumb'
import Media from '@/components/Application/Admin/Media'
import PageHeader from '@/components/Application/Admin/PageHeader'
import UploadMedia from '@/components/Application/Admin/UploadMedia'
import ButtonLoading from '@/components/Application/ButtonLoading'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import useDeleteMutation from '@/hooks/useDeleteMutation'
import { ADMIN_DASHBOARD, ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { ArrowLeft, Trash2 } from 'lucide-react'

const breadcrumbData = [
    { href: ADMIN_DASHBOARD, label: 'Home' },
    { href: '', label: 'Media' },
]

import { Suspense } from 'react'

const MediaContent = () => {
    const queryClient = useQueryClient()
    const [deleteType, setDeleteType] = useState('SD')
    const [selectedMedia, setSelectedMedia] = useState([])
    const [selectAll, setSelectAll] = useState(false)
    const searchParams = useSearchParams()

    useEffect(() => {
        if (searchParams) {
            const trashOf = searchParams.get('trashof')
            setSelectedMedia([])
            if (trashOf) {
                setDeleteType('PD')
            } else {
                setDeleteType('SD')
            }
        }
    }, [searchParams])

    const fetchMedia = async (page, deleteType) => {
        const { data: response } = await axios.get(`/api/media?page=${page}&&limit=10&&deleteType=${deleteType}`)

        return response
    }


    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        status
    } = useInfiniteQuery({
        queryKey: ['media-data', deleteType],
        queryFn: async ({ pageParam }) => await fetchMedia(pageParam, deleteType),
        initialPageParam: 0,
        getNextPageParam: (lastPage, pages) => {
            const nextPage = pages.length
            return lastPage.hasMore ? nextPage : undefined
        },
    })


    const deleteMutation = useDeleteMutation('media-data', '/api/media/delete')

    const handleDelete = (ids, deleteType) => {
        let c = true
        if (deleteType === 'PD') {
            c = confirm('Are you sure you want to delete the data permanently?')
        }

        if (c) {
            deleteMutation.mutate({ ids, deleteType })
        }

        setSelectAll(false)
        setSelectedMedia([])

    }

    const handleSelectAll = () => {
        setSelectAll(!selectAll)
    }

    useEffect(() => {
        if (selectAll) {
            const ids = data.pages.flatMap(page => page.mediaData.map(media => media._id));
            setSelectedMedia(ids)
        } else {
            setSelectedMedia([])
        }
    }, [selectAll])



    return (
        <div className="flex flex-col gap-4 sm:gap-6">
            <PageHeader
                title={deleteType === 'SD' ? 'Media' : 'Media Trash'}
                description="Manage your media library and uploads."
                breadcrumb={<BreadCrumb breadcrumbData={breadcrumbData} />}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {deleteType === 'SD' && (
                            <UploadMedia isMultiple={true} queryClient={queryClient} />
                        )}
                        {deleteType === 'SD' ? (
                            <Button type="button" variant="destructive" asChild size="lg" className="h-9">
                                <Link href={`${ADMIN_MEDIA_SHOW}?trashof=media`} className="inline-flex items-center gap-2">
                                    <Trash2 className="size-4" />
                                    Trash
                                </Link>
                            </Button>
                        ) : (
                            <Button type="button" variant="outline" asChild size="lg" className="h-9">
                                <Link href={`${ADMIN_MEDIA_SHOW}`} className="inline-flex items-center gap-2">
                                    <ArrowLeft className="size-4" />
                                    Back To Media
                                </Link>
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="rounded-md bg-card p-4 sm:p-5">
                {selectedMedia.length > 0 && (
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
                        <Label>
                            <Checkbox
                                checked={selectAll}
                                onCheckedChange={handleSelectAll}
                                className="border-primary mr-2"
                            />
                            Select All
                        </Label>

                        <div className="flex flex-wrap gap-2">
                            {deleteType === 'SD' ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(selectedMedia, deleteType)}
                                    className="h-9 cursor-pointer"
                                    size="lg"
                                >
                                    Move Into Trash
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        className="bg-green-500 hover:bg-green-600 h-9"
                                        onClick={() => handleDelete(selectedMedia, "RSD")}
                                        size="lg"
                                    >
                                        Restore
                                    </Button>

                                    <Button variant="destructive" onClick={() => handleDelete(selectedMedia, deleteType)} className="h-9" size="lg">
                                        Delete Permanently
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {status === 'pending' ? (
                    <div>Loading...</div>
                ) : status === 'error' ? (
                    <div className="text-red-500 text-sm">{error.message}</div>
                ) : (
                    <>
                        {data.pages.flatMap(page => page.mediaData.map(media => media._id)).length === 0 && (
                            <div>Data not found.</div>
                        )}

                        <div className="grid lg:grid-cols-5 sm:grid-cols-3 grid-cols-2 gap-2 mb-5">
                            {data?.pages?.map((page, index) => (
                                <React.Fragment key={index}>
                                    {page?.mediaData?.map((media) => (
                                        <Media
                                            key={media._id}
                                            media={media}
                                            handleDelete={handleDelete}
                                            deleteType={deleteType}
                                            selectedMedia={selectedMedia}
                                            setSelectedMedia={setSelectedMedia}
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}

                {hasNextPage && (
                    <ButtonLoading
                        type="button"
                        className="h-9 cursor-pointer"
                        loading={isFetching}
                        onClick={() => fetchNextPage()}
                        text="Load More"
                        size="lg"
                    />
                )}
            </div>
        </div>
    )
}

const MediaPage = () => {
    return (
        <Suspense fallback={null}>
            <MediaContent />
        </Suspense>
    )
}

export default MediaPage
