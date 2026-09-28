"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, Search as SearchIcon, UserRound } from "lucide-react"
import { useSelector } from "react-redux"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Cart from "@/components/Application/Website/Cart"
import GlobalSearch from "@/components/Application/Website/GlobalSearch"
import ThemeToggle from "@/components/Application/Website/ThemeToggle"
import { BrandButton, BrandOutlineButton } from "@/components/Application/Website/BrandButton"
import userIcon from "@/public/assets/images/user.png"

const defaultMenu = [
  { title: "Shop", url: "/shop" },
  { title: "About Us", url: "/about-us" },
  { title: "Contact", url: "/contact" },
]

const defaultAuth = {
  login: { text: "Sign in", url: "/auth/login" },
  signup: { text: "Create account", url: "/auth/register" },
  account: { url: "/my-account" },
}

export default function Navbar({
  logo = {
    url: "/",
    alt: "Energyflow logo",
    title: "Energyflow",
  },
  menu = defaultMenu,
  auth = defaultAuth,
}) {
  const [openSearch, setOpenSearch] = React.useState(false)
  const user = useSelector((store) => store?.authStore?.auth)
  const hydrated = useSelector((store) => store?.authStore?.hydrated)

  const accountUrl = auth?.account?.url || "/my-account"

  // Global keyboard shortcut — Ctrl/Cmd + K toggles the search modal.
  React.useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpenSearch((prev) => !prev)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <section className="py-2.5 lg:py-4">
      <div className="w-full pl-4 pr-3 lg:px-10">
        <nav className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid" aria-label="Main navigation">
          <div className="flex items-center gap-8">
            {menu.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                className="text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-strong)] underline-offset-[10px] decoration-2 decoration-[var(--brand-sun)] transition-colors hover:text-[var(--brand-primary)] hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <Link
            href={logo.url}
            className="font-header text-[1.75rem] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
            aria-label={logo.alt}
          >
            {logo.title}
          </Link>

          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpenSearch(true)}
              className="text-[var(--ink-body)] transition-colors hover:text-[var(--brand-primary-hover)]"
              aria-label="Open search"
              title="Search (Ctrl K)"
            >
              <SearchIcon className="h-6 w-6" strokeWidth={1.75} />
            </button>

            <div>
              <Cart />
            </div>

            {!hydrated ? (
              // Don't flash a logged-out icon before the auth state is resolved.
              <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-[var(--surface-well)]" aria-hidden />
            ) : !user ? (
              <Link
                href={auth.login.url}
                className="text-[var(--ink-body)] transition-colors hover:text-[var(--brand-primary-hover)]"
                aria-label={auth.login.text}
              >
                <UserRound className="h-6 w-6" strokeWidth={1.75} />
              </Link>
            ) : (
              <Link href={accountUrl} aria-label="My account">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar?.url || userIcon.src} />
                  <AvatarFallback className="bg-[var(--dark-red)] text-[11px] font-semibold uppercase text-[var(--on-brand)]">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </nav>

        <div className="flex items-center justify-between lg:hidden" role="navigation" aria-label="Mobile navigation">
          <Link
            href={logo.url}
            className="min-w-0 truncate font-header text-[clamp(1.125rem,4.4vw+0.25rem,1.375rem)] font-semibold uppercase leading-none tracking-[0.02em] text-[var(--brand-primary)]"
            aria-label={logo.alt}
          >
            {logo.title}
          </Link>

          {/* Three 40px tap targets; the theme switch lives in the menu sheet
              on phones so the wordmark never collides with the icons. */}
          <div className="-mr-2 flex shrink-0 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenSearch(true)}
              className="size-10 text-[var(--ink-body)] hover:text-[var(--brand-primary-hover)]"
              aria-label="Open search"
            >
              <SearchIcon className="size-[1.125rem]" strokeWidth={1.75} />
            </Button>

            <div className="flex size-10 items-center justify-center">
              <Cart />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 text-[var(--ink-body)] hover:text-[var(--brand-primary-hover)]"
                  aria-label="Open menu"
                >
                  <Menu className="size-[1.125rem]" strokeWidth={1.75} />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex w-[85%] max-w-sm gap-0 border-l border-[var(--line-soft)] bg-background p-0 sm:max-w-sm">
                <SheetHeader className="flex-shrink-0 border-b border-[var(--line-soft)] px-5 py-5">
                  <SheetTitle className="font-header text-[1.375rem] font-semibold uppercase leading-none tracking-[0.02em] text-[var(--brand-primary)]">
                    {logo.title}
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3" aria-label="Mobile menu">
                  {menu.map((item) => (
                    <SheetClose asChild key={item.title}>
                      <Link
                        href={item.url}
                        className="rounded-md px-3 py-3.5 font-neue text-sm font-semibold uppercase tracking-[0.1em] text-[var(--ink-strong)] transition-colors hover:bg-[var(--surface-well)] hover:text-[var(--brand-primary)] active:bg-[var(--surface-sunken)]"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}

                  <div className="mt-2 border-t border-[var(--line-soft)] pt-2">
                    <ThemeToggle variant="row" />
                  </div>
                </nav>

                <div className="flex-shrink-0 border-t border-[var(--line-soft)] px-5 py-5">
                  {!hydrated ? (
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[var(--surface-well)]" aria-hidden />
                      <span className="h-4 w-24 animate-pulse rounded bg-[var(--surface-well)]" aria-hidden />
                    </div>
                  ) : !user ? (
                    <div className="flex flex-col gap-2.5">
                      <SheetClose asChild>
                        <BrandOutlineButton asChild>
                          <Link href={auth.login.url}>{auth.login.text}</Link>
                        </BrandOutlineButton>
                      </SheetClose>
                      <SheetClose asChild>
                        <BrandButton asChild>
                          <Link href={auth.signup.url}>{auth.signup.text}</Link>
                        </BrandButton>
                      </SheetClose>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        href={accountUrl}
                        className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-[var(--surface-well)]"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user?.avatar?.url || userIcon.src} />
                          <AvatarFallback className="bg-[var(--dark-red)] text-xs font-semibold uppercase text-[var(--on-brand)]">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-neue text-sm font-semibold text-[var(--brand-primary)]">
                            {user?.name || 'My account'}
                          </span>
                          <span className="text-xs text-muted-foreground">View account</span>
                        </div>
                      </Link>
                    </SheetClose>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <GlobalSearch open={openSearch} setOpen={setOpenSearch} isLoggedIn={!!user} />
    </section>
  )
}
