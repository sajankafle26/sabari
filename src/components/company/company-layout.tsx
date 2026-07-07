"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Bus,
  User,
  Store,
  Users,
  Route,
  Calendar,
  IndianRupee,
  Ticket,
  MapPin,
  BarChart,
  Package,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/company", icon: LayoutDashboard },
  { label: "Vehicles", href: "/company/vehicles", icon: Bus },
  { label: "Vehicle Health", href: "/company/vehicle-health", icon: Activity },
  { label: "Drivers", href: "/company/drivers", icon: User },
  { label: "Counters", href: "/company/counters", icon: Store },
  { label: "Staff", href: "/company/staff", icon: Users },
  { label: "Routes", href: "/company/routes", icon: Route },
  { label: "Schedules", href: "/company/schedules", icon: Calendar },
  { label: "Fares", href: "/company/fares", icon: IndianRupee },
  { label: "Bookings", href: "/company/bookings", icon: Ticket },
  { label: "Parcels", href: "/company/parcels", icon: Package },
  { label: "Expenses", href: "/company/expenses", icon: IndianRupee },
  { label: "Attendance", href: "/company/attendance", icon: Clock },
  { label: "Live Tracking", href: "/company/tracking", icon: MapPin },
  { label: "Reports", href: "/company/reports", icon: BarChart },
]

export function CompanyLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/company" className={cn("flex items-center gap-2.5", collapsed && "justify-center w-full")}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-600">
              <Bus className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-zinc-900">
                Sa<span className="text-violet-600">bari</span>
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
            const isActive = pathname === item.href || (item.href !== "/company" && pathname.startsWith(item.href))
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
              Sa<span className="text-violet-600">bari</span>
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
