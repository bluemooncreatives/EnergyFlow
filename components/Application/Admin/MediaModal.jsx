import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import axios from 'axios'
import Image from 'next/image'
import React, { useState } from 'react'
import loading from '@/public/assets/images/loading.svg'
import ModalMediaBlock from './ModalMediaBlock'
import { showToast } from '@/lib/showToast'
import ButtonLoading from '../ButtonLoading'
import AdminEmptyState from './AdminEmptyState'
import { CircleAlert, ImageOff } from 'lucide-react'
import { ADMIN_MEDIA_SHOW } from '@/routes/AdminPanelRoute'
const MediaModal = ({ open, setOpen, selectedMedia, setSelectedMedia, isMultiple }) => {

    const [previouslySelected, setPreviouslySelected] = useState([])

    const fetchMedia = async (page) => {
        const { data: response } = await axios.get(`/api/media?page=${page}&&limit=18&&deleteType=SD`)
        return response
    }

    const { isPending, isError, error, data, isFetching, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery({
        queryKey: ['MediaModal'],
        queryFn: async ({ pageParam }) => await fetchMedia(pageParam),
        placeholderData: keepPreviousData,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextPage = allPages.length
            return lastPage.hasMore ? nextPage : undefined
        }
    })


    const handleClear = () => {
        setSelectedMedia([])
        setPreviouslySelected([])
        showToast('success', 'Media selection cleared.')
    }
    const handleClose = () => {
        setSelectedMedia(previouslySelected)
        setOpen(false)
    }
    const handleSelect = () => {
        if (selectedMedia.length <= 0) {
            return showToast('error', 'Please select a media.')
        }

        setPreviouslySelected(selectedMedia)
        setOpen(false)
    }

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogContent onInteractOutside={(e) => e.preventDefault()}
                className="h-dvh max-h-dvh overflow-hidden max-w-[calc(100%-1rem)] border-0 bg-transparent p-0 py-4 shadow-none sm:max-w-[80%] sm:py-10"
            >
                <DialogDescription className="hidden"></DialogDescription>

                <div className='flex h-full flex-col rounded-xl border bg-background p-3 shadow-sm'>
                    <DialogHeader className="shrink-0 border-b pb-2">
                        <DialogTitle>Media Selection</DialogTitle>
                    </DialogHeader>

                    <div className='min-h-0 flex-1 overflow-auto py-2'>
                        {isPending ?
                            (<div className='size-full flex justify-center items-center'>
                                <Image src={loading} alt='loading' height={80} width={80} />
                            </div>)
                            :
                            isError ?
                                <div className='size-full flex justify-center items-center'>
                                    <AdminEmptyState icon={CircleAlert} tone="danger" title="Couldn’t load media" description={error.message} onRetry={() => refetch()} />
                                </div>
                                :
                                !data?.pages?.some(page => page?.mediaData?.length) ?
                                <div className='size-full flex justify-center items-center'>
                                    <AdminEmptyState icon={ImageOff} title="No media yet" description="Upload images from the Media library, then come back to pick them here." action={{ href: ADMIN_MEDIA_SHOW, label: 'Open media library' }} />
                                </div>
                                :
                                <>
                                    <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6'>
                                        {
                                            data?.pages?.map((page, index) => (
                                                <React.Fragment key={index}>
                                                    {
                                                        page?.mediaData?.map((media) => (
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

                                    {hasNextPage ?
                                        <div className='flex justify-center py-5'>
                                                    <ButtonLoading type="button" onClick={() => fetchNextPage()} loading={isFetching} text="Load More" size="lg" />
                                        </div>
                                        :
                                        <p className='py-5 text-center text-sm text-muted-foreground'>You’ve reached the end of the library.</p>
                                    }

                                </>
                        }
                    </div>


                    <div className='flex shrink-0 items-center justify-between gap-2 border-t pt-3'>
                        <div>
                            <Button type="button" variant="destructive" size="lg" onClick={handleClear} >
                                Clear All
                            </Button>
                        </div>
                        <div className='flex gap-2 sm:gap-5'>
                            <Button type="button" variant="secondary" size="lg" onClick={handleClose} >
                                Close
                            </Button>
                            <Button type="button" size="lg" onClick={handleSelect} >
                                Select
                            </Button>
                        </div>
                    </div>

                </div>

            </DialogContent>
        </Dialog>
    )
}

export default MediaModal