import { Button } from '@/components/ui/button';
import { useState } from 'react'
import { Search } from 'lucide-react'
import SearchModel from './SearchModel';
const AdminMobileSearch = () => {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button type="button" size="icon" onClick={() => setOpen(true)} className="md:hidden" variant="ghost">
                <Search className='size-4' />
            </Button>
            <SearchModel open={open} setOpen={setOpen} />
        </>
    )
}

export default AdminMobileSearch
