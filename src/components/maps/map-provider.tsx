"use client"

import type { ReactNode } from "react"
import { LoadScript } from "@react-google-maps/api"

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY

const libraries: ("places" | "geometry")[] = ["places", "geometry"]

interface MapProviderProps {
  children: ReactNode
}

function MapProvider({ children }: MapProviderProps) {
  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-xl bg-zinc-100 p-8 text-center">
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            Enter Google Maps API key in .env.local as NEXT_PUBLIC_GOOGLE_MAPS_KEY
          </p>
        </div>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_KEY} libraries={libraries}>
      {children}
    </LoadScript>
  )
}

export { MapProvider }
