'use client'
import { Button } from '@/components/ui/button'
import { showToast } from '@/lib/showToast'
import { USER_DASHBOARD, USER_ORDERS, USER_PROFILE, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { logout } from '@/store/reducer/authReducer'
import { persistor } from '@/store/store'
import axios from 'axios'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutDashboard, User, ShoppingBag, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navLinks = [
    { label: 'Dashboard', href: USER_DASHBOARD, icon: LayoutDashboard },
    { label: 'Profile', href: USER_PROFILE, icon: User },
    { label: 'Orders', href: USER_ORDERS, icon: ShoppingBag },
]

const UserPanelNavigation = () => {
    const pathname = usePathname()
    const dispatch = useDispatch()
    const user = useSelector((store) => store.authStore?.auth)
    const hydrated = useSelector((store) => store.authStore?.hydrated)

    const handleLogout = async () => {
        try {
            const { data: logoutResponse } = await axios.post('/api/auth/logout', {}, {
                withCredentials: true,
            })
            if (!logoutResponse.success) {
                throw new Error(logoutResponse.message)
            }

            dispatch(logout())
            await persistor.purge()

            await signOut({
                redirect: false,
            })

            showToast('success', logoutResponse.message)

            // Force a full navigation to avoid stale client state in production.
            window.location.replace(WEBSITE_LOGIN)
        } catch (error) {
            showToast('error', error.message)
        }
    }

    return (
        <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--dark-red)]/20 bg-background font-neue">
            {/* User greeting */}
            <div className="border-b border-[var(--dark-red)]/20 px-5 py-4">
                {!hydrated ? (
                    // Auth state not resolved yet — show a skeleton instead of a
                    // misleading "User" placeholder that would flash before hydration.
                    <div className="flex items-center gap-3">
                        <span className="size-9 shrink-0 animate-pulse rounded-full bg-border/60" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <span className="block h-2.5 w-16 animate-pulse rounded bg-border/60" />
                            <span className="block h-3.5 w-28 animate-pulse rounded bg-border/60" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-[var(--dark-red)]/10">
                            <AvatarImage src={user?.avatar?.url} alt={user?.name || 'User'} className="object-cover" />
                            <AvatarFallback className="bg-[var(--dark-red)] font-neue text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="text-[13px] text-foreground/60">
                                Welcome back
                            </p>
                            <p className="truncate text-base font-semibold text-[var(--brand-primary)]">
                                {user?.name || 'User'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation links */}
            <nav className="p-2">
                <ul className="space-y-0.5">
                    {navLinks.map(({ label, href, icon: Icon }) => {
                        const isActive = pathname.startsWith(href)
                        return (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className={`group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 transition-all duration-200 ${isActive
                                        ? 'bg-[var(--dark-red)] text-white'
                                        : 'text-foreground/60 hover:bg-[var(--brand-warm-bg)] hover:text-[var(--brand-primary)]'
                                        }`}
                                >
                                    <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-white/90' : 'text-foreground/40 group-hover:text-[var(--brand-primary)]'}`} />
                                    <span className={`text-base font-semibold ${isActive ? 'text-white' : 'text-[var(--brand-primary)]'}`}>
                                        {label}
                                    </span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="border-t border-[var(--dark-red)]/20 p-2">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-all duration-200 hover:bg-red-50"
                >
                    <LogOut className="size-3.5 shrink-0 text-foreground/40 group-hover:text-red-500" />
                    <span className="text-base font-semibold text-foreground/60 group-hover:text-red-600">
                        Logout
                    </span>
                </button>
            </div>
        </div>
    )
}

export default UserPanelNavigation
