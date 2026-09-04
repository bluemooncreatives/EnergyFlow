import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ADMIN_MEDIA_EDIT } from '@/routes/AdminPanelRoute';

import Image from 'next/image'
import Link from 'next/link';
import { MoreVertical, Pencil, Link2, Trash2 } from 'lucide-react'
import { showToast } from '@/lib/showToast';

const Media = ({ media, handleDelete, deleteType, selectedMedia, setSelectedMedia }) => {
    const handleCheck = () => {
        let newSelectedMedia = []
        if (selectedMedia.includes(media._id)) {
            newSelectedMedia = selectedMedia.filter(m => m !== media._id)
        } else {
            newSelectedMedia = [...selectedMedia, media._id]
        }

        setSelectedMedia(newSelectedMedia)
    }

    const handleCopyLink = async (url) => {
        await navigator.clipboard.writeText(url)
        showToast('success', 'Link copied.')
    }

    return (
        <div className='border border-gray-200 dark:border-gray-800 relative group rounded overflow-hidden'>
            <div className='absolute top-2 left-2 z-20'>
                <Checkbox
                    checked={selectedMedia.includes(media._id)}
                    onCheckedChange={handleCheck}
                    className="border-primary cursor-pointer"
                />
            </div>

            <div className='absolute top-2 right-2 z-20'>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <button type='button' className='w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white cursor-pointer'>
                            <MoreVertical className='size-4' />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {deleteType === 'SD' &&
                            <>
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={ADMIN_MEDIA_EDIT(media._id)}>
                                        <Pencil className='size-4' />
                                        Edit
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleCopyLink(media.secure_url)}>
                                    <Link2 className='size-4' />
                                    Copy Link
                                </DropdownMenuItem>
                            </>
                        }

                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDelete([media._id], deleteType)}>
                            <Trash2 className='size-4 text-red-500' />
                            {deleteType === 'SD' ? 'Move Into Trash' : 'Delete Permanently'}
                        </DropdownMenuItem>


                    </DropdownMenuContent>
                </DropdownMenu>
            </div>


            <div className='w-full h-full absolute z-10 transition-all duration-150 ease-in group-hover:bg-black/30'></div>

            <div>
                <Image
                    src={media?.secure_url}
                    alt={media?.alt || 'Image'}
                    height={300}
                    width={300}
                    className='object-cover w-full sm:h-[200px] h-[150px]'
                />
            </div>
        </div>
    )
}

export default Media
