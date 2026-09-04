import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Trash2 } from 'lucide-react'
const DeleteAction = ({ handleDelete, row, deleteType }) => {
    return (
        <DropdownMenuItem
            key="delete"
            onClick={() => handleDelete([row.original._id], deleteType)}
            className='text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 cursor-pointer'
        >
            <Trash2 className='size-4' />
            Delete
        </DropdownMenuItem>
    )
}

export default DeleteAction