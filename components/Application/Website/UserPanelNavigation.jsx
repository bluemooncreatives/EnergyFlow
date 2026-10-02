'use client'
import { showToast } from '@/lib/showToast'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/account'
import { USER_DASHBOARD, USER_ORDERS, USER_PROFILE, WEBSITE_LOGIN } from '@/routes/WebsiteRoute'
import { logout } from '@/store/reducer/authReducer'
import { persistor } from '@/store/store'
import axios from 'axios'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutDashboard, User, ShoppingBag, LogOut, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navLinks = [
    { label: 'Dashboard', href: USER_DASHBOARD, icon: LayoutDashboard },
    { label: 'Orders', href: USER_ORDERS, icon: ShoppingBag },
    { label: 'Profile', href: USER_PROFILE, icon: User },
]

// Order details live outside the panel but belong to the Orders section.
const isActiveLink = (pathname, href) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === USER_ORDERS && pathname.startsWith('/order-details'))

const UserPanelNavigation = () => {
    const pathname = usePathname() || ''
    const dispatch = useDispatch()
    const user = useSelector((store) => store.authStore?.auth)
    const hydrated = useSelector((store) => store.authStore?.hydrated)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleLogout = async () => {
        if (loggingOut) return
        setLoggingOut(true)
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
            showToast('error', error.response?.data?.message || error.message)
            setLoggingOut(false)
        }
    }

    return (
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-surface-card shadow-[inset_0_0_0_1px_var(--line-soft)] font-neue">
            {/* User greeting */}
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5 sm:py-4">
                {!hydrated ? (
                    // Auth state not resolved yet — show a skeleton instead of a
                    // misleading "User" placeholder that would flash before hydration.
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="size-10 shrink-0 animate-pulse rounded-full bg-border/60" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <span className="block h-3.5 w-28 animate-pulse rounded bg-border/60" />
                            <span className="block h-2.5 w-36 animate-pulse rounded bg-border/60" />
                        </div>
                    </div>
                ) : (
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-10 border border-line-soft">
                            <AvatarImage src={user?.avatar?.url} alt={user?.name || 'User'} className="object-cover" />
                            <AvatarFallback className="bg-brand font-neue text-xs font-semibold uppercase tracking-[0em] text-on-brand">
                                {initials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-[var(--brand-primary)] sm:text-base" data-testid="nav-user-name">
                                {user?.name || 'My account'}
                            </p>
                            {user?.email && (
                                <p className="truncate text-xs text-foreground/55">{user.email}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Compact logout for the mobile tab layout */}
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    aria-label="Log out"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 lg:hidden"
                >
                    {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
                </button>
            </div>

            {/* Navigation links: equal-width tabs on mobile, a list on desktop */}
            <nav aria-label="Account" className="p-2">
                <ul className="grid grid-cols-3 gap-1 lg:flex lg:flex-col lg:gap-0.5">
                    {navLinks.map(({ label, href, icon: Icon }) => {
                        const isActive = isActiveLink(pathname, href)
                        return (
                            <li key={href} className="min-w-0">
                                <Link
                                    href={href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={cn(
                                        'group flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-2.5 transition-all duration-200 sm:gap-2.5 sm:px-3.5 lg:justify-start lg:gap-3 lg:px-3',
                                        isActive
                                            ? 'bg-brand text-on-brand'
                                            : 'text-[var(--brand-primary)] hover:bg-[var(--brand-warm-bg)]'
                                    )}
                                >
                                    <Icon className={cn('size-4 shrink-0', isActive ? 'text-on-brand/90' : 'text-foreground/40 group-hover:text-[var(--brand-primary)]')} />
                                    <span className="truncate text-[13px] font-semibold sm:text-sm lg:text-[15px]">{label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Logout */}
            <div className="hidden border-t border-line-soft p-2 lg:block">
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="group flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left transition-all duration-200 hover:bg-destructive/10 disabled:opacity-60"
                >
                    {loggingOut
                        ? <Loader2 className="size-4 shrink-0 animate-spin text-foreground/40" />
                        : <LogOut className="size-4 shrink-0 text-foreground/40 group-hover:text-destructive" />}
                    <span className="text-[15px] font-semibold text-foreground/60 group-hover:text-destructive">
                        {loggingOut ? 'Logging out…' : 'Logout'}
                    </span>
                </button>
            </div>
        </div>
    )
}

export default UserPanelNavigation
