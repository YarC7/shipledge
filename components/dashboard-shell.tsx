import { SignOutButton } from "@/components/sign-out-button"
import { ProductTour } from "@/components/product-tour"
import type { SessionUser } from "@/lib/session"
import Link from "next/link"

type NavItem = { href: string; label: string }

export function DashboardShell({
  user,
  nav,
  children,
}: {
  user: SessionUser
  nav: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary font-mono text-xs font-bold text-sidebar-primary-foreground">
              <img src="/shipledger-logo.png" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
            </span>
            <span className="text-base font-semibold tracking-tight">ShipLedger</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.href === "/admin/drivers" ? "admin-drivers-nav" : item.href === "/admin/items" ? "admin-items-nav" : undefined}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs capitalize text-sidebar-foreground/60">{user.role}</p>
            </div>
            <ProductTour role={user.role === "admin" ? "admin" : "driver"} />
            <SignOutButton />
          </div>
        </div>

        <nav className="flex items-center gap-1 border-t border-sidebar-border px-4 py-2 sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-tour={item.href === "/admin/drivers" ? "admin-drivers-nav" : item.href === "/admin/items" ? "admin-items-nav" : undefined}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
