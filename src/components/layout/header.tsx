"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Bus, ChevronDown, User, LogOut, Ticket, LayoutDashboard, MapPin, Shield, Building2, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/ui/notification-bell"
import { useAuth } from "@/lib/context/auth-context"

const passengerLinks = [
  { label: "My Bookings", href: "/my-bookings", icon: Ticket },
  { label: "Live Tracking", href: "/tracking", icon: MapPin },
]

const roleLinks: Record<string, { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  super_admin: [{ label: "Admin Panel", href: "/admin", icon: Shield }],
  company_admin: [{ label: "Company Panel", href: "/company", icon: Building2 }],
  counter_operator: [{ label: "Counter Panel", href: "/counter", icon: ClipboardList }],
  driver: [],
  passenger: [],
}

export function Header() {
  const { user, logout, getDashboardUrl } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0]
    : ""
  const roleLabel = user?.role?.replace("_", " ")?.replace(/\b\w/g, (c) => c.toUpperCase())

  const extraLinks = user ? roleLinks[user.role] || [] : []

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600 group-hover:bg-violet-500 transition-colors">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-900">
              Sa<span className="text-violet-600">bari</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {user && user.role !== "passenger" && (
              <Link href="/tracking" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                <MapPin className="h-4 w-4" />
                Live Tracking
              </Link>
            )}
            {user && user.role === "passenger" && (
              <Link href="/my-tracking" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                <MapPin className="h-4 w-4" />
                My Tracking
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-1">
            <NotificationBell />
            {user ? (
              <div className="relative ml-2" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{displayName}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl z-20">
                    <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                      <p className="text-sm text-zinc-900 font-medium truncate">{displayName}</p>
                      <p className="text-xs text-zinc-500 capitalize">{roleLabel}</p>
                    </div>
                    <Link href={getDashboardUrl()} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900" onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    {extraLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900" onClick={() => setUserMenuOpen(false)}>
                        <link.icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    ))}
                    <Link href="/my-bookings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900" onClick={() => setUserMenuOpen(false)}>
                      <Ticket className="h-4 w-4" />
                      My Bookings
                    </Link>
                    <hr className="my-1 border-zinc-100" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Register</Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-500 hover:text-zinc-900"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3 animate-fade-in">
          {user && user.role !== "passenger" && (
            <Link href="/tracking" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
              <MapPin className="h-4 w-4" /> Live Tracking
            </Link>
          )}
          {user && user.role === "passenger" && (
            <Link href="/my-tracking" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
              <MapPin className="h-4 w-4" /> My Tracking
            </Link>
          )}
          <hr className="border-zinc-200" />
          {user ? (
            <>
              <div className="px-3 py-2">
                <p className="text-sm text-zinc-900 font-medium">{displayName}</p>
                <p className="text-xs text-zinc-500 capitalize">{roleLabel}</p>
              </div>
              <Link href={getDashboardUrl()} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              {extraLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => setMobileOpen(false)}>
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              <button onClick={() => { logout(); setMobileOpen(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Login</Button>
              </Link>
              <Link href="/auth/register" className="flex-1">
                <Button size="sm" className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
