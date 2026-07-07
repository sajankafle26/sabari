"use client"

import { useEffect, useRef } from "react"
import { useGoogleMap } from "@react-google-maps/api"

interface AnimatedMarkerProps {
  position: { lat: number; lng: number }
  icon: google.maps.Symbol
  label?: string
  onClick?: () => void
}

const ANIMATION_DURATION = 1000

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function AnimatedMarker({ position, icon, label, onClick }: AnimatedMarkerProps) {
  const map = useGoogleMap()
  const markerRef = useRef<google.maps.Marker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startPos = useRef(position)
  const targetPos = useRef(position)
  const startTime = useRef(0)

  useEffect(() => {
    if (!map) return

    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        map,
        position,
        icon,
        label: label ? { text: label, color: "#ffffff", fontSize: "11px" } : undefined,
      })
      if (onClick) {
        marker.addListener("click", onClick)
      }
      markerRef.current = marker
      targetPos.current = position
      startPos.current = position
      return
    }

    const prevLat = targetPos.current.lat
    const prevLng = targetPos.current.lng
    const latDiff = position.lat - prevLat
    const lngDiff = position.lng - prevLng

    if (Math.abs(latDiff) < 0.00001 && Math.abs(lngDiff) < 0.00001) {
      return
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }

    startPos.current = { lat: prevLat, lng: prevLng }
    targetPos.current = position
    startTime.current = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime.current
      const t = Math.min(elapsed / ANIMATION_DURATION, 1)
      const eased = easeInOutCubic(t)

      const lat = startPos.current.lat + latDiff * eased
      const lng = startPos.current.lng + lngDiff * eased

      markerRef.current?.setPosition({ lat, lng })

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        animFrameRef.current = null
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [map, position, icon, label, onClick])

  useEffect(() => {
    if (!markerRef.current || !icon) return
    markerRef.current.setIcon(icon)
  }, [icon])

  useEffect(() => {
    if (!markerRef.current || !onClick) return
    const listener = markerRef.current.addListener("click", onClick)
    return () => google.maps.event.removeListener(listener)
  }, [onClick])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
      markerRef.current?.setMap(null)
      markerRef.current = null
    }
  }, [])

  return null
}

export { AnimatedMarker }
