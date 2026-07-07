"use client"

import { useState, useEffect } from "react"
import { Route as RouteIcon } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Route {
  id: number
  name: string
  from: string
  to: string
  fromDistrict: string
  toDistrict: string
  distance: number
  estimatedDuration: number
  stops: { name: string }[]
  status: string
  popular: boolean
}

export default function RoutesPage() {
  const [data, setData] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/routes")
      setData(res.data.routes)
    } catch {
      toast.error("Failed to load routes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <CompanyLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Routes</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CompanyLayout>
    )
  }

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Routes</h1>
          <p className="text-zinc-500 mt-1">Browse available routes (read-only)</p>
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <RouteIcon className="h-12 w-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 mt-4">No routes found</p>
                <p className="text-zinc-600 text-sm mt-1">Routes are managed by the admin</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((route) => (
              <Card key={route.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">{route.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      {route.from} → {route.to}
                    </p>
                  </div>
                  {route.popular && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-amber-600 bg-amber-600/10">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                  <span>{route.distance ? `${route.distance} km` : "-"}</span>
                  <span>{route.estimatedDuration ? `${route.estimatedDuration} mins` : "-"}</span>
                  <span>{route.stops?.length || 0} stops</span>
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  {route.fromDistrict && route.toDistrict
                    ? `${route.fromDistrict} → ${route.toDistrict}`
                    : ""}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}
