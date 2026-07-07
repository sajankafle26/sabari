"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PackageSearch, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ParcelTrackingLandingPage() {
  const router = useRouter()
  const [searchId, setSearchId] = useState("")

  const handleSearch = () => {
    if (searchId.trim()) {
      router.push(`/tracking/parcel/${searchId.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-50 mb-4">
          <PackageSearch className="h-10 w-10 text-violet-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Track Your Parcel</h1>
        <p className="text-zinc-500 mt-2">Enter your tracking ID to check the real-time status of your parcel</p>
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

      <p className="text-center text-xs text-zinc-600 mt-4">
        Tracking ID is printed on your receipt. It starts with PRC followed by numbers.
      </p>
    </div>
  )
}
