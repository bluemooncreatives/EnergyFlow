import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// One square tile in the media picker. The whole tile toggles the checkbox;
// a picked tile gets a ring and a tint, and — when picking several — shows
// its place in the selection order.
const ModalMediaBlock = ({ media, selectedMedia, setSelectedMedia, isMultiple }) => {
    const order = selectedMedia.findIndex((m) => m._id === media._id)
    const isSelected = order !== -1

    const handleCheck = () => {
        const picked = { _id: media._id, url: media.secure_url, alt: media.alt || '' }
        if (!isMultiple) return setSelectedMedia([picked])
        setSelectedMedia(isSelected ? selectedMedia.filter((m) => m._id !== media._id) : [...selectedMedia, picked])
    }

    return (
        <label
            htmlFor={media._id}
            className={cn(
                'group relative block aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition-shadow',
                isSelected ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border hover:border-foreground/30'
            )}
        >
            <Image
                src={media.secure_url}
                alt={media.alt || ''}
                fill
                sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
            />
            <span aria-hidden="true" className={cn('absolute inset-0 transition-colors', isSelected ? 'bg-primary/15' : 'bg-transparent group-hover:bg-black/5')} />

            <div className="absolute left-2 top-2 z-10 rounded-[5px] bg-background/90 p-0.5 shadow-sm">
                <Checkbox
                    id={media._id}
                    aria-label={media.alt || media.title || `Select image ${media.public_id || media._id}`}
                    checked={isSelected}
                    onCheckedChange={handleCheck}
                />
            </div>

            {isMultiple && isSelected && (
                <span aria-hidden="true" className="absolute right-2 top-2 z-10 grid size-6 place-items-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground shadow-sm">
                    {order + 1}
                </span>
            )}
        </label>
    )
}

export default ModalMediaBlock
