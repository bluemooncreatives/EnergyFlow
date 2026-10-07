import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import loading from '@/public/assets/images/loading.svg'
import ModalMediaBlock from './ModalMediaBlock'
import { showToast } from '@/lib/showToast'
import ButtonLoading from '../ButtonLoading'
import AdminEmptyState from './AdminEmptyState'
import { CircleAlert, ImageOff } from 'lucide-react'
import { ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'

/**
 * The media picker. A flex column capped at the viewport: header and footer
 * stay put and only the grid scrolls, so the actions are always in reach
 * however many images are loaded. More images load on their own as the end
 * of the grid comes into view (the Load More button remains as a fallback).
 */
const MediaModal = ({ open, setOpen, selectedMedia, setSelectedMedia, isMultiple, onSelect, filterMedia }) => {

    const previouslySelected = useRef([])
    const wasOpen = useRef(false)
    const scrollRef = useRef(null)
    const sentinelRef = useRef(null)
    useEffect(() => {
        if (open && !wasOpen.current) previouslySelected.current = [...selectedMedia]
        wasOpen.current = open
    }, [open, selectedMedia])

    const fetchMedia = async (page) => {
        const { data: response } = await axios.get(`/api/media?page=${page}&&limit=18&&deleteType=SD`)
        if (response.success === false || !Array.isArray(response.mediaData)) throw new Error(response.message || 'Could not load media. Please retry.')
        return response
    }

    const { isPending, isError, error, data, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
        queryKey: ['MediaModal'],
        enabled: open,
        queryFn: async ({ pageParam }) => await fetchMedia(pageParam),
        placeholderData: keepPreviousData,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length
            return lastPage.hasMore ? nextPage : undefined
        }
    })

    // Load the next page as the end of the grid scrolls into view.
    const hasMedia = data?.pages?.some((page) => page?.mediaData?.length)
    useEffect(() => {
        const root = scrollRef.current
        const target = sentinelRef.current
        if (!open || !root || !target || !hasNextPage || typeof IntersectionObserver === 'undefined') return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
            },
            { root, rootMargin: '0px 0px 240px 0px' }
        )
        observer.observe(target)
        return () => observer.disconnect()
    }, [open, hasMedia, hasNextPage, isFetchingNextPage, fetchNextPage])

    const handleClear = () => {
        setSelectedMedia([])
        showToast('success', 'Media selection cleared.')
    }
    const handleClose = () => {
        setSelectedMedia(previouslySelected.current)
        setOpen(false)
    }
    const handleSelect = () => {
        if (selectedMedia.length <= 0) {
            return showToast('error', 'Please select a media.')
        }

        if (onSelect?.(selectedMedia) === false) return
        previouslySelected.current = [...selectedMedia]
        setOpen(false)
    }

    const count = selectedMedia.length

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => next ? setOpen(true) : handleClose()}
        >
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-full max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-5rem)] sm:max-h-[calc(100dvh-5rem)] sm:max-w-[min(80rem,92vw)]"
            >
                <DialogHeader className="shrink-0 gap-1 border-b px-5 py-4 pr-14 text-left">
                    <DialogTitle className="text-lg">Media Selection</DialogTitle>
                    <DialogDescription>
                        {isMultiple ? 'Pick one or more images. They are added in the order you pick them.' : 'Pick an image.'}
                    </DialogDescription>
                </DialogHeader>

                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                    {isPending ?
                        (<div className='flex size-full items-center justify-center'>
                            <Image src={loading} alt='loading' height={80} width={80} />
                        </div>)
                        :
                        isError ?
                            <div className='flex size-full items-center justify-center'>
                                <AdminEmptyState icon={CircleAlert} tone="danger" title="Couldn’t load media" description={error.message} onRetry={() => refetch()} />
                            </div>
                            :
                            !hasMedia ?
                            <div className='flex size-full items-center justify-center'>
                                <AdminEmptyState icon={ImageOff} title="No media yet" description="Upload images from the Media library, then come back to pick them here." action={{ href: ADMIN_MEDIA_SHOW, label: 'Open media library' }} />
                            </div>
                            :
                            <>
                                {filterMedia && !data?.pages?.some(page => page.mediaData.some(filterMedia)) && (
                                    <p className="pb-4 text-sm text-muted-foreground">No supported cover images in these results. Load more images, or close the library and upload a cover.</p>
                                )}
                                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
                                    {
                                        data?.pages?.map((page, index) => (
                                            <React.Fragment key={index}>
                                                {
                                                    page?.mediaData?.filter((media) => !filterMedia || filterMedia(media)).map((media) => (
                                                        <ModalMediaBlock
                                                            key={media._id}
                                                            media={media}
                                                            selectedMedia={selectedMedia}
                                                            setSelectedMedia={setSelectedMedia}
                                                            isMultiple={isMultiple}
                                                        />
                                                    ))
                                                }
                                            </React.Fragment>
                                        ))
                                    }
                                </div>

                                <div ref={sentinelRef} aria-hidden="true" className="h-px" />
                                {hasNextPage ?
                                    <div className='flex justify-center py-5'>
                                        <ButtonLoading type="button" variant="outline" onClick={() => fetchNextPage()} loading={isFetchingNextPage || isFetching} text="Load More" />
                                    </div>
                                    :
                                    <p className='py-5 text-center text-sm text-muted-foreground'>You’ve reached the end of the library.</p>
                                }
                            </>
                    }
                </div>

                <div className='flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3'>
                    <div className='flex items-center gap-3'>
                        <span className='text-sm tabular-nums text-muted-foreground' aria-live="polite">
                            {count ? `${count} selected` : 'Nothing selected'}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={handleClear} disabled={!count} className="text-destructive hover:text-destructive">
                            Clear
                        </Button>
                    </div>
                    <div className='flex gap-2'>
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Close
                        </Button>
                        <Button type="button" disabled={isPending || isError || !count} onClick={handleSelect}>
                            {isMultiple && count > 1 ? `Select (${count})` : 'Select'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default MediaModal
