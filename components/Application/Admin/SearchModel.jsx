import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import searchData from "@/lib/search"
import Fuse from "fuse.js"
import Link from "next/link"
import { useEffect, useState } from "react"
import { SearchX } from "lucide-react"
import AdminEmptyState from "@/components/Application/Admin/AdminEmptyState"


const options = {
    keys: ['label', 'description', 'keywords'],
    threshold: 0.3
}

const SearchModel = ({ open, setOpen }) => {
    const [query, setQuery] = useState('')
    const [results, setResult] = useState([])

    const fuse = new Fuse(searchData, options)

    useEffect(() => {
        if (query.trim() === "") {
            setResult([])
        }

        const res = fuse.search(query)
        setResult(res.map((r) => r.item))
    }, [query])

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Quick Search</DialogTitle>
                    <DialogDescription>
                        Find and navigate to any admin section instantly. Type a keyword to get started.
                    </DialogDescription>
                </DialogHeader>

                <Input
                    placeholder="Search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />

                <ul className="mt-4 max-h-60 overflow-y-auto">

                    {results.map((item, index) => (
                        <li key={index}>
                            <Link href={item.url}
                                className="block py-2 px-3 rounded hover:bg-muted"
                                onClick={() => setOpen(false)}
                            >
                                <h4 className="font-medium">
                                    {item.label}
                                </h4>
                                <p className="text-sm text-muted-foreground"> {item.description}</p>
                            </Link>
                        </li>

                    ))}

                    {query.trim() && results.length === 0 &&
                        <li>
                            <AdminEmptyState
                                icon={SearchX}
                                title={`No matches for “${query.trim()}”`}
                                description="Try a different keyword, like orders, products or coupons."
                                className="py-8"
                            />
                        </li>
                    }

                </ul>

            </DialogContent>
        </Dialog>

    )
}

export default SearchModel