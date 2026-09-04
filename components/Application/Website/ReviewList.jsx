import Image from 'next/image'
import usericon from '@/public/assets/images/user.png'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Star } from 'lucide-react'

dayjs.extend(relativeTime);
const ReviewList = ({ review }) => {
    return (
        <div className='flex gap-4 rounded-md border border-border/60 bg-background p-4'>
            <div className='w-[55px] shrink-0'>
                <Image
                    src={review?.avatar?.url || usericon.src}
                    width={55}
                    height={55}
                    alt='user icon'
                    className='rounded-md border border-border/60'
                />
            </div>
            <div className='min-w-0 flex-1'>
                <div>
                    <div className='flex items-center gap-1'>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                                key={index}
                                className={`size-3.5 ${index < Number(review?.rating || 0) ? 'fill-[var(--dark-red)] text-[var(--dark-red)]' : 'text-foreground/20'}`}
                            />
                        ))}
                    </div>
                    <h4 className='mt-2 text-lg font-semibold'>{review?.title}</h4>
                    <p className='flex flex-wrap gap-2 items-center text-sm'>
                        <span className='font-medium'>{review?.reviewedBy || 'Anonymous'}</span>
                        <span className='text-muted-foreground'>·</span>
                        <span className='text-muted-foreground'>{dayjs(review?.createdAt).fromNow()}</span>
                    </p>
                    <p className='mt-3 break-words text-foreground/85'>{review?.review}</p>
                </div>
            </div>
        </div>
    )
}

export default ReviewList