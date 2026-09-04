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
    <section className="py-4">
      <div className="w-full px-4 lg:px-10">
        <nav className="hidden grid-cols-[1fr_auto_1fr] items-center lg:grid" aria-label="Main navigation">
          <div className="flex items-center gap-8">
            {menu.map((item) => (
              <Link
                key={item.title}
                href={item.url}
                className="text-base font-semibold text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <Link
            href={logo.url}
            className="font-header text-3xl leading-none tracking-wide text-[var(--brand-primary)] transition-colors hover:text-[var(--brand-primary-hover)]"
            aria-label={logo.alt}
          >
            {logo.title}
          </Link>

          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <button
              type="button"
              onClick={() => setOpenSearch(true)}
              className="text-stone-600 transition-colors hover:text-[var(--brand-primary-hover)]"
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
              <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-stone-200/70" aria-hidden />
            ) : !user ? (
              <Link
                href={auth.login.url}
                className="text-stone-600 transition-colors hover:text-[var(--brand-primary-hover)]"
                aria-label={auth.login.text}
              >
                <UserRound className="h-6 w-6" strokeWidth={1.75} />
              </Link>
            ) : (
              <Link href={accountUrl} aria-label="My account">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar?.url || userIcon.src} />
                  <AvatarFallback className="bg-[var(--dark-red)] text-[11px] font-semibold uppercase text-white">
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
            className="font-header text-2xl leading-none tracking-wide text-[var(--brand-primary)]"
            aria-label={logo.alt}
          >
            {logo.title}
          </Link>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenSearch(true)}
              className="size-8 text-stone-700 hover:text-[var(--brand-primary-hover)]"
              aria-label="Open search"
            >
              <SearchIcon className="size-4" strokeWidth={1.75} />
            </Button>

            <div>
              <Cart />
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-stone-700 hover:text-[var(--brand-primary-hover)]"
                  aria-label="Open menu"
                >
                  <Menu className="size-4" strokeWidth={1.75} />
                </Button>
              </SheetTrigger>
              <SheetContent className="flex w-[85%] max-w-sm gap-0 border-l border-black/[0.08] bg-background p-0 sm:max-w-sm">
                <SheetHeader className="flex-shrink-0 border-b border-black/[0.08] px-5 py-5">
                  <SheetTitle className="font-header text-2xl leading-none tracking-wide text-[var(--brand-primary)]">
                    {logo.title}
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-3" aria-label="Mobile menu">
                  {menu.map((item) => (
                    <SheetClose asChild key={item.title}>
                      <Link
                        href={item.url}
                        className="rounded-md px-3 py-3.5 font-neue text-base font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[var(--brand-cream)]/50 hover:text-[var(--brand-primary-hover)] active:bg-[var(--brand-cream)]/70"
                      >
                        {item.title}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                <div className="flex-shrink-0 border-t border-black/[0.08] px-5 py-5">
                  {!hydrated ? (
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-stone-200/70" aria-hidden />
                      <span className="h-4 w-24 animate-pulse rounded bg-stone-200/70" aria-hidden />
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
                        className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-[var(--brand-cream)]/50"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={user?.avatar?.url || userIcon.src} />
                          <AvatarFallback className="bg-[var(--dark-red)] text-xs font-semibold uppercase text-white">
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
