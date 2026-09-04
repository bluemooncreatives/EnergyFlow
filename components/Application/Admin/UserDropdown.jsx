import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSelector } from "react-redux"

import { PackagePlus, ShoppingBag } from 'lucide-react'
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import { ADMIN_ORDER_SHOW, ADMIN_PRODUCT_ADD } from "@/routes/AdminPanelRoute";

const UserDropdown = () => {
    const auth = useSelector((store) => store.authStore.auth)
    const avatarSrc = auth?.avatar || ''
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex items-center justify-center rounded-full p-0.5 hover:bg-muted cursor-pointer"
                    aria-label="Account"
                >
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarSrc} />
                        <AvatarFallback>{auth?.name?.slice(0, 2)?.toUpperCase() || 'AD'}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                    <p className="font-semibold">{auth?.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{auth?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={ADMIN_PRODUCT_ADD} className="cursor-pointer">
                        <PackagePlus className="size-4" />
                        New Product
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={ADMIN_ORDER_SHOW} className="cursor-pointer">
                        <ShoppingBag className="size-4" />
                        Orders
                    </Link>
                </DropdownMenuItem>

                <LogoutButton />

            </DropdownMenuContent>
        </DropdownMenu>

    )
}

export default UserDropdown
