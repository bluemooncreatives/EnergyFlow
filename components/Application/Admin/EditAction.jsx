import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
const EditAction = ({ href }) => {
    return (
        <DropdownMenuItem key="edit" asChild>
            <Link href={href} className='flex items-center gap-2 cursor-pointer'>
                <Pencil className='size-4' />
                Edit
            </Link>
        </DropdownMenuItem>
    )
}

export default EditAction