"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import React from "react"
import { PackageSearch, Package, Truck, CheckCircle, XCircle, Clock, MapPin, ArrowRight, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatDate, formatTime, formatPrice } from "@/lib/utils"
import axios from "axios"

const statusIcons: Record<string, any> = {
  pending: Clock,
  picked_up: Package,
  in_transit: Truck,
  arrived: MapPin,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

const statusColors: Record<string, string> = {
  pending: "text-yellow-600 bg-yellow-600/10 border-yellow-600/30",
  picked_up: "text-blue-600 bg-blue-600/10 border-blue-600/30",
  in_transit: "text-violet-600 bg-violet-50 border-violet-600/30",
  arrived: "text-cyan-600 bg-cyan-600/10 border-cyan-600/30",
  out_for_delivery: "text-orange-400 bg-orange-600/10 border-orange-600/30",
  delivered: "text-green-600 bg-green-600/10 border-green-600/30",
  cancelled: "text-red-600 bg-red-600/10 border-red-600/30",
}

const statusLabels: Record<string, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  arrived: "Arrived",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

const statusSteps = ["pending", "picked_up", "in_transit", "arrived", "out_for_delivery", "delivered"]

export default function ParcelTrackingPage() {
  const params = useParams()
  const trackingId = params.trackingId as string
  const [parcel, setParcel] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchId, setSearchId] = useState(trackingId || "")

  useEffect(() => {
    if (!trackingId) {
      setLoading(false)
      return
    }
    fetchParcel(trackingId)
  }, [trackingId])

  const fetchParcel = async (id: string) => {
    setLoading(true)
    setError("")
    try {
      const { data } = await axios.get(`/api/parcels/track/${id}`)
      setParcel(data.parcel)
    } catch (err: any) {
      setError(err.response?.data?.message || "Parcel not found")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchId.trim()) {
      window.location.href = `/tracking/parcel/${searchId.trim().toUpperCase()}`
    }
  }

  if (!trackingId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="text-center mb-8">
          <PackageSearch className="h-16 w-16 mx-auto text-violet-600 mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900">Track Your Parcel</h1>
          <p className="text-zinc-500 mt-2">Enter your tracking ID to check the status</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter tracking ID (e.g. PRC2507031234)"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Track
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-zinc-500">Tracking parcel...</p>
        </div>
      </div>
    )
  }

  if (error || !parcel) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="text-center">
          <PackageSearch className="h-16 w-16 mx-auto text-zinc-700 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900">Parcel Not Found</h1>
          <p className="text-zinc-500 mt-2">{error || "No parcel matches this tracking ID"}</p>
          <Link href="/tracking/parcel" className="mt-6 inline-block">
            <Button variant="outline">Try Another ID</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStepIndex = statusSteps.indexOf(parcel.status)

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Track Your Parcel</h1>
        <p className="text-zinc-500 mt-1">Tracking ID: <span className="text-violet-600 font-mono">{parcel.trackingId}</span></p>
      </div>

      <Card className="border-violet-500/20 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border", statusColors[parcel.status])}>
              {parcel.status === "delivered" ? <CheckCircle className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              {statusLabels[parcel.status] || parcel.status}
            </div>
            <span className="text-sm text-zinc-500">{parcel.company?.name || "N/A"}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-200 text-sm">
            <div>
              <p className="text-zinc-500 mb-1">From</p>
              <p className="text-zinc-900 font-medium">{parcel.route?.from || "N/A"}</p>
            </div>
            <div className="text-right">
              <p className="text-zinc-500 mb-1">To</p>
              <p className="text-zinc-900 font-medium">{parcel.route?.to || "N/A"}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Sender</span>
              <span className="text-zinc-900">{parcel.sender?.name} ({parcel.sender?.phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Receiver</span>
              <span className="text-zinc-900">{parcel.receiver?.name} ({parcel.receiver?.phone})</span>
            </div>
            {parcel.receiver?.address && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivery Address</span>
                <span className="text-zinc-900 text-right max-w-[60%]">{parcel.receiver.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Weight</span>
              <span className="text-zinc-900">{parcel.weight} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Description</span>
              <span className="text-zinc-900">{parcel.description}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200">
              <span className="text-zinc-500">Amount</span>
              <span className="text-violet-600 font-semibold">{formatPrice(parcel.amount)}</span>
            </div>
            {parcel.cod && (
              <div className="flex justify-between">
                <span className="text-zinc-500">COD Amount</span>
                <span className="text-amber-600">{formatPrice(parcel.codAmount || parcel.amount)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-6">Tracking Timeline</h2>
          <div className="relative">
            {statusSteps.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx
              const isCurrent = currentStepIndex === idx
              const historyEntry = parcel.statusHistory?.find((h: any) => h.status === step)

              return (
                <div key={step} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0",
                      isCompleted ? "bg-violet-600 border-violet-600" : "bg-white border-zinc-300",
                      isCurrent && "ring-2 ring-violet-600/30"
                    )}>
                      {React.createElement(statusIcons[step] || Package, {
                        className: cn("h-4 w-4", isCompleted ? "text-zinc-900" : "text-zinc-500"),
                      })}
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div className={cn("w-0.5 h-full mt-1", isCompleted ? "bg-violet-600" : "bg-zinc-100")} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={cn("text-sm font-medium", isCompleted ? "text-zinc-900" : "text-zinc-500")}>
                      {statusLabels[step]}
                    </p>
                    {historyEntry && (
                      <>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {formatDate(historyEntry.timestamp)} at {formatTime(historyEntry.timestamp)}
                        </p>
                        {historyEntry.note && (
                          <p className="text-xs text-zinc-500 mt-0.5">{historyEntry.note}</p>
                        )}
                        {historyEntry.location && (
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {historyEntry.location}
                          </p>
                        )}
                      </>
                    )}
                    {!historyEntry && isCurrent && (
                      <p className="text-xs text-zinc-500 mt-0.5">Current status</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/tracking/parcel">
          <Button variant="outline" size="sm">
            <PackageSearch className="h-4 w-4" />
            Track Another Parcel
          </Button>
        </Link>
      </div>
    </div>
  )
}
