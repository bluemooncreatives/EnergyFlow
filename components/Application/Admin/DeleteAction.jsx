import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Trash2 } from 'lucide-react'
const DeleteAction = ({ handleDelete, row, deleteType }) => {
    return (
        <DropdownMenuItem
            key="delete"
            onClick={() => handleDelete([row.original._id], deleteType)}
            className='text-destructive focus:text-destructive cursor-pointer'
        >
            <Trash2 className='size-4' />
            Delete
        </DropdownMenuItem>
    )
}

export default DeleteAction