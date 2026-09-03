"use client"

import { SignOutButton } from "@/components/sign-out-button"
import { ProductTour } from "@/components/product-tour"
import { Button } from "@/components/ui/button"
import type { SessionUser } from "@/lib/session"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

type NavItem = { href: string; label: string; badge?: number }

function NavBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground">
      {count}
    </span>
  )
}

function tourTarget(href: string) {
  return href === "/admin/drivers" ? "admin-drivers-nav" : href === "/admin/items" ? "admin-items-nav" : undefined
}

export function DashboardShell({
  user,
  nav,
  children,
}: {
  user: SessionUser
  nav: NavItem[]
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

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
                data-tour={tourTarget(item.href)}
                className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {item.label}
                <NavBadge count={item.badge} />
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

            <div className="relative sm:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Mở menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div
                    role="menu"
                    className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-lg"
                  >
                    {nav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        data-tour={tourTarget(item.href)}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      >
                        <span>{item.label}</span>
                        <NavBadge count={item.badge} />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
