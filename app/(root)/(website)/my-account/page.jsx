'use client'
import UserPanelLayout from '@/components/Application/Website/UserPanelLayout'
import WebsiteBreadcrumb from '@/components/Application/Website/WebsiteBreadcrumb'
import AccountCard from '@/components/Application/Website/account/AccountCard'
import OrderCard, { OrderCardSkeleton } from '@/components/Application/Website/account/OrderCard'
import EmptyState from '@/components/Application/Website/storefront/EmptyState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import useFetch from '@/hooks/useFetch'
import { addressLines, firstName, formatCurrency, formatDate, greetingFor, initials, profileCompletion } from '@/lib/account'
import { USER_ORDERS, USER_PROFILE, WEBSITE_CART, WEBSITE_LOGIN, WEBSITE_SHOP } from '@/routes/WebsiteRoute'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    ArrowRight,
    BadgeCheck,
    CircleAlert,
    IndianRupee,
    KeyRound,
    MapPin,
    Package,
    PackageCheck,
    PackageOpen,
    ShoppingBag,
    ShoppingCart,
    Truck,
    UserRoundPen,
} from 'lucide-react'

const breadCrumbData = {
    title: 'Dashboard',
    links: [{ label: 'Dashboard' }]
}

const Skeleton = ({ className }) => <span className={`block animate-pulse rounded bg-border/60 ${className}`} />

const StatCard = ({ icon: Icon, label, value, hint, loading }) => (
    <div className="flex items-start justify-between gap-3 rounded-[var(--radius-card)] bg-surface-card p-5 shadow-[inset_0_0_0_1px_var(--line-soft)]">
        <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground/60">{label}</p>
            <div className="mt-2 text-2xl font-semibold text-[var(--brand-primary)] sm:text-[1.75rem]" data-testid={`stat-${label}`}>
                {loading ? <Skeleton className="h-8 w-16" /> : <span className="break-all">{value}</span>}
            </div>
            {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tint-honey text-brand">
            <Icon className="size-[18px]" aria-hidden="true" />
        </span>
    </div>
)

// Greeting depends on the viewer's clock, so compute it after mount to keep the
// server and client render identical.
const useGreeting = () => {
    const [greeting, setGreeting] = useState('Welcome back')
    useEffect(() => setGreeting(greetingFor(new Date())), [])
    return greeting
}

const WelcomeCard = ({ user, loading }) => {
    const greeting = useGreeting()
    const memberSince = formatDate(user?.createdAt)

    return (
        <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-brand p-6 text-on-brand shadow-[var(--shadow-brand)] sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                    {loading ? (
                        <span className="size-14 shrink-0 animate-pulse rounded-full bg-on-brand/20" />
                    ) : (
                        <Avatar className="size-14 shrink-0 border-2 border-on-brand/30">
                            <AvatarImage src={user?.avatar?.url} alt={user?.name || 'Your profile photo'} className="object-cover" />
                            <AvatarFallback className="bg-on-brand/15 text-base font-semibold text-on-brand">
                                {initials(user?.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="min-w-0">
                        {loading ? (
                            <div className="space-y-2">
                                <span className="block h-5 w-48 animate-pulse rounded bg-on-brand/20" />
                                <span className="block h-3.5 w-36 animate-pulse rounded bg-on-brand/20" />
                            </div>
                        ) : (
                            <>
                                <h2 className="truncate text-xl font-semibold sm:text-2xl" data-testid="welcome-heading">
                                    {greeting}, {firstName(user?.name)}
                                </h2>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-on-brand/75">
                                    {user?.email && <span className="max-w-full truncate">{user.email}</span>}
                                    {user?.isEmailVerified && (
                                        <span className="inline-flex items-center gap-1">
                                            <BadgeCheck className="size-3.5" aria-hidden="true" /> Verified
                                        </span>
                                    )}
                                    {memberSince && <span>Member since {memberSince}</span>}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <Button asChild className="h-10 rounded-[var(--radius-control)] bg-on-brand px-5 font-semibold text-brand hover:bg-on-brand/90">
                        <Link href={WEBSITE_SHOP}><ShoppingBag className="size-4" /> Shop now</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-10 rounded-[var(--radius-control)] border-on-brand/40 bg-transparent px-5 font-semibold text-on-brand hover:bg-on-brand/10 hover:text-on-brand dark:bg-transparent">
                        <Link href={USER_PROFILE}><UserRoundPen className="size-4" /> Edit profile</Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

const ProfileCompletionCard = ({ user }) => {
    const { percent, missing, complete } = profileCompletion(user)
    if (complete) return null

    return (
        <AccountCard bodyClassName="p-5" data-testid="profile-completion">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-semibold text-[var(--brand-primary)]">Complete your profile</p>
                <p className="text-sm font-semibold text-brand">{percent}%</p>
            </div>
            <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-surface-well"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Profile completion"
            >
                <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-3 text-[13px] text-foreground/60">
                Add {missing.slice(0, 3).join(', ').toLowerCase()}
                {missing.length > 3 ? ` and ${missing.length - 3} more` : ''} for a faster checkout.
            </p>
            <Button asChild variant="brand-outline" className="mt-4 h-9 px-5 text-sm font-semibold">
                <Link href={USER_PROFILE}>Finish profile</Link>
            </Button>
        </AccountCard>
    )
}

const AddressCard = ({ user, loading }) => {
    const lines = addressLines(user)
    return (
        <AccountCard
            icon={MapPin}
            title="Saved address"
            action={!loading && lines && (
                <Link href={USER_PROFILE} className="text-sm font-medium text-foreground/60 transition hover:text-[var(--brand-primary)]">
                    Edit
                </Link>
            )}
            bodyClassName="p-5"
        >
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-24" />
                </div>
            ) : lines ? (
                <address className="not-italic" data-testid="saved-address">
                    {user?.name && <p className="text-sm font-semibold text-[var(--brand-primary)]">{user.name}</p>}
                    {lines.map((line, i) => (
                        <p key={i} className="break-words text-sm text-foreground/70">{line}</p>
                    ))}
                    {user?.phone && <p className="mt-1 text-sm text-foreground/70">{user.phone}</p>}
                </address>
            ) : (
                <div className="text-sm text-foreground/60" data-testid="no-address">
                    <p>No address saved yet. Save one to pre-fill checkout.</p>
                    <Button asChild variant="brand-outline" className="mt-3 h-9 px-5 text-sm font-semibold">
                        <Link href={USER_PROFILE}>Add address</Link>
                    </Button>
                </div>
            )}
        </AccountCard>
    )
}

const QuickLink = ({ href, icon: Icon, title, hint }) => (
    <Link
        href={href}
        className="group flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-3 transition-colors hover:bg-surface-well/70"
    >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-well text-[var(--brand-primary)]">
            <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--brand-primary)]">{title}</span>
            <span className="block truncate text-xs text-foreground/55">{hint}</span>
        </span>
        <ArrowRight className="size-3.5 text-foreground/40 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
)

const MyAccount = () => {
    const { data: dashboardData, loading, error, errorStatus, refetch } = useFetch('/api/dashboard/user')
    const cartCount = useSelector(store => store.cartStore?.count) || 0

    // useFetch starts idle (loading=false, no data) — count that first frame as
    // loading so the empty state never flashes before the request begins.
    const isLoading = loading || (!dashboardData && !error)
    const dashboard = dashboardData?.data
    const user = dashboard?.user
    const stats = dashboard?.stats
    const recentOrders = Array.isArray(dashboard?.recentOrders) ? dashboard.recentOrders : []
    const totalOrders = stats?.totalOrders ?? dashboard?.totalOrder ?? 0

    if (!isLoading && error) {
        const sessionProblem = errorStatus === 401 || errorStatus === 404
        return (
            <div>
                <WebsiteBreadcrumb props={breadCrumbData} />
                <UserPanelLayout>
                    <AccountCard>
                        <EmptyState
                            icon={CircleAlert}
                            tone="danger"
                            title={sessionProblem ? 'Your session has ended' : 'We couldn’t load your account'}
                            description={sessionProblem
                                ? 'Please sign in again to see your orders and saved details.'
                                : 'Something went wrong on our side. Please try again in a moment.'}
                            action={sessionProblem ? (
                                <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                                    <Link href={`${WEBSITE_LOGIN}?callback=/my-account`}>Sign in</Link>
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={refetch} className="h-11 px-8 text-base font-semibold">Try again</Button>
                            )}
                        />
                    </AccountCard>
                </UserPanelLayout>
            </div>
        )
    }

    return (
        <div>
            <WebsiteBreadcrumb props={breadCrumbData} />
            <UserPanelLayout>
                <div className="space-y-6">
                    <WelcomeCard user={user} loading={isLoading} />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard icon={ShoppingBag} label="Total orders" value={totalOrders} loading={isLoading} />
                        <StatCard icon={Truck} label="In progress" value={stats?.activeOrders ?? 0} loading={isLoading} />
                        <StatCard icon={PackageCheck} label="Delivered" value={stats?.deliveredOrders ?? 0} loading={isLoading} />
                        <StatCard icon={IndianRupee} label="Total spent" value={formatCurrency(stats?.totalSpent)} loading={isLoading} />
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                        {/* Recent orders */}
                        <AccountCard
                            icon={Package}
                            title="Recent orders"
                            description={!isLoading && totalOrders > recentOrders.length
                                ? `Showing ${recentOrders.length} of ${totalOrders}`
                                : undefined}
                            action={!isLoading && recentOrders.length > 0 && (
                                <Link href={USER_ORDERS} className="flex items-center gap-1 text-sm font-medium text-foreground/60 transition hover:text-[var(--brand-primary)]">
                                    View all <ArrowRight className="size-3" />
                                </Link>
                            )}
                            className="self-start"
                        >
                            {isLoading ? (
                                <div className="divide-y divide-line-soft">
                                    {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
                                </div>
                            ) : recentOrders.length === 0 ? (
                                <EmptyState
                                    icon={PackageOpen}
                                    title="No orders yet"
                                    description="Start shopping and your orders will appear here."
                                    action={
                                        <Button asChild variant="brand" className="h-11 px-8 text-base font-semibold">
                                            <Link href={WEBSITE_SHOP}>Shop Now</Link>
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="divide-y divide-line-soft" data-testid="recent-orders">
                                    {recentOrders.map((order, i) => <OrderCard key={order?._id || order?.order_id || i} order={order} />)}
                                </div>
                            )}
                        </AccountCard>

                        {/* Side column */}
                        <div className="space-y-6">
                            {!isLoading && <ProfileCompletionCard user={user} />}
                            <AddressCard user={user} loading={isLoading} />
                            <AccountCard bodyClassName="p-2">
                                <QuickLink
                                    href={WEBSITE_CART}
                                    icon={ShoppingCart}
                                    title="Your cart"
                                    hint={cartCount > 0 ? `${cartCount} ${cartCount === 1 ? 'item' : 'items'} waiting` : 'Your cart is empty'}
                                />
                                <QuickLink
                                    href={`${USER_PROFILE}#security`}
                                    icon={KeyRound}
                                    title={user?.hasPassword === false ? 'Set a password' : 'Password & security'}
                                    hint={user?.hasPassword === false ? 'Sign in with email too' : 'Update your password'}
                                />
                            </AccountCard>
                        </div>
                    </div>
                </div>
            </UserPanelLayout>
        </div>
    )
}

export default MyAccount
