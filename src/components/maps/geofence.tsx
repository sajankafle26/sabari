"use client"

import { Circle } from "@react-google-maps/api"

interface GeofenceProps {
  center: { lat: number; lng: number }
  radius: number
  label?: string
}

function Geofence({ center, radius, label }: GeofenceProps) {
  return (
    <>
      <Circle
        center={center}
        radius={radius}
        options={{
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          clickable: false,
        }}
      />
      {label && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: `${((center.lng + 180) / 360) * 100}%`,
            top: `${((90 - center.lat) / 180) * 100}%`,
            transform: "translate(-50%, -150%)",
          }}
        >
          <span className="rounded bg-blue-500/90 px-2 py-0.5 text-[10px] font-medium text-white shadow whitespace-nowrap">
            {label}
          </span>
        </div>
      )}
    </>
  )
}

export { Geofence }
