import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Search } from 'lucide-react'
import SearchModel from './SearchModel';

const AdminSearch = () => {
    const [open, setOpen] = useState(false)
    return (
        <div className='md:w-[280px] lg:w-[320px]'>
            <div className='flex items-center relative'>
                <Search className='pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground' />
                <Input
                    readOnly
                    className="h-9 cursor-pointer rounded-md border bg-muted/40 pl-12 pr-16 shadow-none placeholder:text-muted-foreground"
                    placeholder="Search"
                    onClick={() => setOpen(true)}
                />
                <div className='pointer-events-none absolute right-4 flex items-center gap-1 text-xs font-medium text-muted-foreground'>
                    <span className='rounded border bg-background px-1.5 py-0.5'>Ctrl</span>
                    <span className='rounded border bg-background px-1.5 py-0.5'>K</span>
                </div>
            </div>

            <SearchModel open={open} setOpen={setOpen} />
        </div>
    )
}

export default AdminSearch
