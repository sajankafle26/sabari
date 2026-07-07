"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  TicketPlus,
  Search,
  Clock,
  MapPin,
  Package,
  ChevronLeft,
  ChevronRight,
  Bus,
  IndianRupee,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/counter", icon: LayoutDashboard },
  { label: "New Booking", href: "/counter/book", icon: TicketPlus },
  { label: "Parcels", href: "/counter/parcels", icon: Package },
  { label: "Finance", href: "/counter/finance", icon: IndianRupee },
  { label: "Search", href: "/counter/search", icon: Search },
  { label: "History", href: "/counter/history", icon: Clock },
  { label: "Live Tracking", href: "/counter/tracking", icon: MapPin },
]

export function CounterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen bg-white border-r border-zinc-200 flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-200">
          <Link href="/counter" className={cn("flex items-center gap-2.5", collapsed && "justify-center w-full")}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600">
              <Bus className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-zinc-900">
                Counter<span className="text-violet-600">Hub</span>
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/counter" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-violet-50 text-violet-700"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-violet-600")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden flex items-center h-16 px-4 border-b border-zinc-200 bg-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-zinc-400 hover:text-zinc-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2.5 ml-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
              <Bus className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-zinc-900">
              Counter<span className="text-violet-600">Hub</span>
            </span>
          </div>
        </div>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
