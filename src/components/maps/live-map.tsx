"use client"

import { useState, useMemo, useCallback, type ReactNode } from "react"
import { Geofence } from "./geofence"
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  TrafficLayer,
  CircleF,
  PolylineF,
  useJsApiLoader,
} from "@react-google-maps/api"
import type { VehicleData } from "./types"
import { VEHICLE_STATUS_COLORS, darkMapStyles } from "./types"

interface LiveMapProps {
  vehicles: VehicleData[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  showVehicleList?: boolean
  selectedVehicleId?: string
  onVehicleSelect?: (id: string) => void
  showLegend?: boolean
  children?: ReactNode
}

const defaultCenter = { lat: 27.7172, lng: 85.3240 }
const defaultZoom = 8

const containerStyle = {
  width: "100%",
  height: "100%",
}

function createBusIcon(color: string, heading: number): google.maps.Symbol {
  return {
    path: "M4 0C1.8 0 0 1.8 0 4v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-2.2-1.8-4-4-4H4zm0 2h8v3H4V2zm0 4h8v3H4V6zm-1 6c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm10 0c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: "#ffffff",
    scale: 1.5,
    rotation: heading,
    anchor: new google.maps.Point(8, 8),
  }
}

function LiveMap({
  vehicles,
  center = defaultCenter,
  zoom = defaultZoom,
  height = "600px",
  showVehicleList = true,
  selectedVehicleId,
  onVehicleSelect,
  children,
}: LiveMapProps) {
  const [showTraffic, setShowTraffic] = useState(false)
  const [mapType, setMapType] = useState<google.maps.MapTypeId>(google.maps.MapTypeId.ROADMAP)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
  })

  const handleVehicleClick = useCallback(
    (vehicle: VehicleData) => {
      setSelectedVehicle(vehicle)
      onVehicleSelect?.(vehicle.id)
    },
    [onVehicleSelect],
  )

  const handleMapTypeToggle = useCallback(() => {
    setMapType((prev) =>
      prev === google.maps.MapTypeId.ROADMAP
        ? google.maps.MapTypeId.SATELLITE
        : prev === google.maps.MapTypeId.SATELLITE
          ? google.maps.MapTypeId.TERRAIN
          : google.maps.MapTypeId.ROADMAP,
    )
  }, [])

  const markers = useMemo(
    () =>
      vehicles.map((vehicle) => (
        <MarkerF
          key={vehicle.id}
          position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
          icon={createBusIcon(
            VEHICLE_STATUS_COLORS[vehicle.status] || VEHICLE_STATUS_COLORS.offline,
            vehicle.heading,
          )}
          onClick={() => handleVehicleClick(vehicle)}
        />
      )),
    [vehicles, handleVehicleClick],
  )

  const routeTrails = useMemo(() => {
    const trails: ReactNode[] = []
    const grouped = vehicles.filter((v) => v.route)
    grouped.forEach((vehicle) => {
      if (vehicle.route) {
        try {
          const coords = JSON.parse(vehicle.route) as { lat: number; lng: number }[]
          if (coords.length > 1) {
            trails.push(
              <PolylineF
                key={`trail-${vehicle.id}`}
                path={coords}
                options={{
                  strokeColor: VEHICLE_STATUS_COLORS[vehicle.status] || "#22c55e",
                  strokeOpacity: 0.6,
                  strokeWeight: 3,
                }}
              />,
            )
          }
        } catch {
          // route is not a polyline path
        }
      }
    })
    return trails
  }, [vehicles])

  const destinationZones = useMemo(() => {
    const zones: ReactNode[] = []
    const seen = new Set<string>()
    vehicles.forEach((vehicle) => {
      if (vehicle.route) {
        try {
          const coords = JSON.parse(vehicle.route) as { lat: number; lng: number }[]
          if (coords.length > 0) {
            const last = coords[coords.length - 1]
            const key = `${last.lat}-${last.lng}`
            if (!seen.has(key)) {
              seen.add(key)
              zones.push(
                <CircleF
                  key={`zone-${key}`}
                  center={last}
                  radius={500}
                  options={{
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.5,
                    strokeWeight: 2,
                    fillColor: "#3b82f6",
                    fillOpacity: 0.1,
                  }}
                />,
              )
            }
          }
        } catch {
          // route is not a polyline path
        }
      }
    })
    return zones
  }, [vehicles])

  if (loadError) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-xl bg-zinc-100 p-8 text-center">
        <div className="space-y-2">
          <p className="text-sm text-red-600">Failed to load Google Maps</p>
          <p className="text-xs text-zinc-500">{loadError.message}</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-xl bg-zinc-100">
        <div className="flex items-center gap-3">
          <svg className="h-5 w-5 animate-spin text-violet-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-zinc-400">Loading map...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200" style={{ height }}>
      <GoogleMap
        mapContainerClassName="w-full h-full"
        id="map"
        center={center}
        zoom={zoom}
        options={{
          styles: darkMapStyles,
          mapTypeId: mapType,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          mapTypeControl: false,
        }}
      >
        {markers}
        {showTraffic && <TrafficLayer />}
        {routeTrails}
        {destinationZones}
        {children}

        {selectedVehicle && (
          <InfoWindowF
            position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
            onCloseClick={() => setSelectedVehicle(null)}
            options={{
              pixelOffset: new google.maps.Size(0, -8),
            }}
          >
            <div className="min-w-[200px] space-y-2 bg-white p-3 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      VEHICLE_STATUS_COLORS[selectedVehicle.status] || VEHICLE_STATUS_COLORS.offline,
                  }}
                />
                <span className="font-medium text-zinc-900">{selectedVehicle.vehicleNumber}</span>
              </div>
              <div className="space-y-1 text-zinc-500">
                <div className="flex justify-between">
                  <span>Driver</span>
                  <span className="text-zinc-700">{selectedVehicle.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="text-zinc-700">{selectedVehicle.speed} km/h</span>
                </div>
                {selectedVehicle.route && (
                  <div className="flex justify-between">
                    <span>Route</span>
                    <span className="text-zinc-700">{selectedVehicle.route}</span>
                  </div>
                )}
                {selectedVehicle.eta && (
                  <div className="flex justify-between">
                    <span>ETA</span>
                    <span className="text-zinc-700">{selectedVehicle.eta}</span>
                  </div>
                )}
                {selectedVehicle.battery !== undefined && (
                  <div className="flex justify-between">
                    <span>Battery</span>
                    <span className="text-zinc-700">{selectedVehicle.battery}%</span>
                  </div>
                )}
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowTraffic((prev) => !prev)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-lg transition-all ${
            showTraffic
              ? "bg-violet-600 text-white"
              : "bg-white/90 text-zinc-600 backdrop-blur-sm hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 16l4-8 4 4 4-8" />
          </svg>
          Traffic
        </button>
        <button
          onClick={handleMapTypeToggle}
          className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-xs font-medium text-zinc-600 shadow-lg backdrop-blur-sm transition-all hover:bg-zinc-100 hover:text-zinc-900"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
          {mapType === google.maps.MapTypeId.ROADMAP
            ? "Satellite"
            : mapType === google.maps.MapTypeId.SATELLITE
              ? "Terrain"
              : "Map"}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-white/90 p-3 shadow-lg backdrop-blur-sm">
        <div className="space-y-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Legend</span>
          {(Object.entries(VEHICLE_STATUS_COLORS) as [string, string][]).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2 text-xs text-zinc-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {showVehicleList && vehicles.length > 0 && (
        <div className="absolute bottom-3 right-3 z-10 max-h-48 w-56 overflow-y-auto rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm">
          <div className="space-y-1">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                onClick={() => handleVehicleClick(vehicle)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                  selectedVehicleId === vehicle.id
                    ? "bg-violet-100 text-violet-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      VEHICLE_STATUS_COLORS[vehicle.status] || VEHICLE_STATUS_COLORS.offline,
                  }}
                />
                <span className="truncate font-medium">{vehicle.vehicleNumber}</span>
                <span className="ml-auto shrink-0 text-[10px] text-zinc-500">{vehicle.speed} km/h</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export { LiveMap }
