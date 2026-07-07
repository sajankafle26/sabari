"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

export interface PassengerInfo {
  name: string
  phone: string
  email: string
  age: string
  gender: string
  seatNumber: string
}

export interface BookingData {
  fromCity?: string
  toCity?: string
  journeyDate?: string
  vehicleId?: string
  vehicleName?: string
  vehicleNumber?: string
  departureTime?: string
  arrivalTime?: string
  pricePerSeat?: number
  serviceFee?: number
  discount?: number
  seats: string[]
  passengers: PassengerInfo[]
  paymentMethod?: string
  totalAmount: number
}

interface BookingContextType {
  data: BookingData
  updateData: (partial: Partial<BookingData>) => void
  clearData: () => void
}

const defaultData: BookingData = {
  seats: [],
  passengers: [],
  totalAmount: 0,
}

const BookingContext = createContext<BookingContextType>({
  data: defaultData,
  updateData: () => {},
  clearData: () => {},
})

export function BookingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BookingData>(defaultData)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sabari_booking")
      if (saved) setData(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("sabari_booking", JSON.stringify(data))
    } catch {}
  }, [data])

  const updateData = useCallback((partial: Partial<BookingData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const clearData = useCallback(() => {
    setData(defaultData)
    try {
      localStorage.removeItem("sabari_booking")
    } catch {}
  }, [])

  return (
    <BookingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (!context) throw new Error("useBooking must be used within BookingProvider")
  return context
}
