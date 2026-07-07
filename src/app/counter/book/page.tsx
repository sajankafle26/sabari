"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Search,
  Bus,
  MapPin,
  CalendarDays,
  Users,
  CreditCard,
  Printer,
  X,
  Plus,
  Minus,
  Radio,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CounterLayout } from "@/components/counter/counter-layout"
import { CITIES } from "@/lib/constants"
import { HorizontalDatePicker } from "@/components/ui/horizontal-date-picker"

const mockSchedules = [
  { id: 1, vehicle: "Sworgadwari Travels", type: "AC Bus", from: "Kathmandu", to: "Pokhara", departure: "06:00", arrival: "11:00", price: 1200, seats: 32, layout: "2x2" },
  { id: 2, vehicle: "Pathao Travels", type: "Deluxe Bus", from: "Kathmandu", to: "Pokhara", departure: "07:30", arrival: "12:30", price: 1000, seats: 28, layout: "2x2" },
  { id: 3, vehicle: "Nepal Yatayat", type: "Tourist Bus", from: "Kathmandu", to: "Pokhara", departure: "09:00", arrival: "14:00", price: 1500, seats: 40, layout: "luxury" },
  { id: 4, vehicle: "Sajha Yatayat", type: "AC Bus", from: "Kathmandu", to: "Pokhara", departure: "11:00", arrival: "16:00", price: 1100, seats: 36, layout: "2x2" },
  { id: 5, vehicle: "Gandaki Travels", type: "Deluxe Bus", from: "Kathmandu", to: "Pokhara", departure: "14:00", arrival: "19:00", price: 1300, seats: 30, layout: "2x2" },
]

const steps = ["Select Route", "Select Vehicle", "Select Seats", "Passenger Details", "Payment & Print"]

interface Passenger {
  name: string
  phone: string
  email: string
  age: string
  gender: string
}

export default function BookPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [fromCity, setFromCity] = useState("")
  const [toCity, setToCity] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [filteredFrom, setFilteredFrom] = useState(CITIES)
  const [filteredTo, setFilteredTo] = useState(CITIES)
  const [schedules] = useState(mockSchedules)
  const [selectedSchedule, setSelectedSchedule] = useState<typeof mockSchedules[0] | null>(null)
  const [seatCount, setSeatCount] = useState(0)
  const [passengers, setPassengers] = useState<Passenger[]>([{ name: "", phone: "", email: "", age: "", gender: "male" }])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [showTicket, setShowTicket] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalAmount = selectedSchedule ? selectedSchedule.price * seatCount : 0

  const filteredFromCities = (query: string) => {
    setFromCity(query)
    setFilteredFrom(CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()) && c !== toCity))
  }

  const filteredToCities = (query: string) => {
    setToCity(query)
    setFilteredTo(CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()) && c !== fromCity))
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return fromCity && toCity && date
      case 1: return !!selectedSchedule
      case 2: return seatCount > 0
      case 3: return passengers.every(p => p.name && p.phone && p.age && p.gender)
      case 4: return true
      default: return false
    }
  }

  const generateSeats = (capacity: number, booked: number[] = []): { id: number; number: string; status: "available" | "booked" | "selected" }[] => {
    const seats: { id: number; number: string; status: "available" | "booked" | "selected" }[] = []
    for (let i = 1; i <= capacity; i++) {
      const status: "available" | "booked" = booked.includes(i) ? "booked" : "available"
      seats.push({ id: i, number: `S${i}`, status })
    }
    return seats
  }

  const [seats, setSeats] = useState(() => generateSeats(32, [3, 7, 12, 18, 22, 29]))
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])

  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId)
    if (!seat) return
    if (seat.status === "booked") {
      const confirmed = window.confirm("This seat is already booked. Override and book it anyway?")
      if (!confirmed) return
    }
    setSelectedSeats(prev => {
      const updated = prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
      setSeatCount(updated.length)
      return updated
    })
    setSeats(prev => prev.map(s => {
      if (s.id === seatId) {
        if (s.status === "booked") return { ...s, status: "selected" as const }
        if (s.status === "selected") return { ...s, status: "available" as const }
        return { ...s, status: "selected" as const }
      }
      return s
    }))
  }

  const addPassenger = () => {
    setPassengers(prev => [...prev, { name: "", phone: "", email: "", age: "", gender: "male" }])
  }

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return
    setPassengers(prev => prev.filter((_, i) => i !== index))
  }

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("sabari_token")
    if (!token) {
      toast.error("Please log in first")
      router.push("/auth/login")
      return
    }

    setSubmitting(true)
    try {
      const response = await axios.post(
        "/api/counter/bookings",
        {
          schedule: String(selectedSchedule?.id || ""),
          route: String(selectedSchedule?.id || ""),
          vehicle: String(selectedSchedule?.id || ""),
          passengers: passengers.map((p, i) => ({
            name: p.name,
            phone: p.phone,
            email: p.email || "",
            age: Number(p.age) || 0,
            gender: p.gender,
            seatNumber: `S${selectedSeats[i] || (i + 1)}`,
          })),
          journeyDate: date,
          totalAmount,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success("Booking confirmed successfully!")
      setShowTicket(true)
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Booking failed"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const resetBooking = () => {
    setCurrentStep(0)
    setFromCity("")
    setToCity("")
    setDate(new Date().toISOString().split("T")[0])
    setSelectedSchedule(null)
    setSeatCount(0)
    setSelectedSeats([])
    setPassengers([{ name: "", phone: "", email: "", age: "", gender: "male" }])
    setPaymentMethod("cash")
    setShowTicket(false)
    setSeats(generateSeats(32, [3, 7, 12, 18, 22, 29]))
  }

  const renderStepIndicator = () => (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        return (
          <div key={step} className="flex items-center gap-2 shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isCompleted ? "bg-green-600/20 text-green-600" :
              isCurrent ? "bg-violet-600/20 text-violet-600" :
              "bg-zinc-50 text-zinc-500"
            }`}>
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                isCompleted ? "bg-green-600 text-zinc-900" :
                isCurrent ? "bg-violet-600 text-zinc-900" :
                "bg-zinc-700 text-zinc-500"
              }`}>
                {isCompleted ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-px w-6 ${index < currentStep ? "bg-green-600/50" : "bg-zinc-100"}`} />
            )}
          </div>
        )
      })}
    </div>
  )

  if (showTicket) {
    return (
      <CounterLayout>
        <div className="p-6 space-y-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center border-b border-zinc-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Bus className="h-6 w-6 text-violet-600" />
                  <span className="text-xl font-bold text-zinc-900">Sa<span className="text-violet-600">bari</span></span>
                </div>
                <CardTitle className="text-lg">Booking Confirmed</CardTitle>
                <CardDescription>Ticket #{Math.random().toString(36).substring(2, 8).toUpperCase()}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-zinc-50 rounded-lg p-4 text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-lg mb-2">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto border-2 border-dashed border-zinc-300 flex items-center justify-center">
                        <span className="text-[8px] text-zinc-500">QR Code</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Scan QR at boarding</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Route</p>
                    <p className="text-zinc-200 font-medium">{selectedSchedule?.from} → {selectedSchedule?.to}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Date</p>
                    <p className="text-zinc-200 font-medium">{date}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Departure</p>
                    <p className="text-zinc-200 font-medium">{selectedSchedule?.departure}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Arrival</p>
                    <p className="text-zinc-200 font-medium">{selectedSchedule?.arrival}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Vehicle</p>
                    <p className="text-zinc-200 font-medium">{selectedSchedule?.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Seats</p>
                    <p className="text-zinc-200 font-medium">{selectedSeats.map(s => `S${s}`).join(", ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Passengers</p>
                    <p className="text-zinc-200 font-medium">{passengers.length}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Payment</p>
                    <p className="text-zinc-200 font-medium capitalize">{paymentMethod}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-zinc-500">Total Amount</p>
                    <p className="text-xl font-bold text-zinc-900">Rs. {totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 gap-2" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                    Print Ticket
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={resetBooking}>
                    New Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CounterLayout>
    )
  }

  return (
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">New Booking</h1>
          <p className="text-zinc-500 mt-1">Create a new passenger ticket</p>
        </div>

        {renderStepIndicator()}

        {/* Step 1: Select Route */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-violet-600" />
                Select Route
              </CardTitle>
              <CardDescription>Choose departure and destination cities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="From"
                    placeholder="Select departure city"
                    value={fromCity}
                    onChange={(e) => {
                      filteredFromCities(e.target.value)
                      setShowFromDropdown(true)
                    }}
                    onFocus={() => setShowFromDropdown(true)}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  {showFromDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg bg-white border border-zinc-200 shadow-xl max-h-48 overflow-y-auto">
                      {filteredFrom.map(city => (
                        <button
                          key={city}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
                          onClick={() => { setFromCity(city); setShowFromDropdown(false) }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Input
                    label="To"
                    placeholder="Select destination city"
                    value={toCity}
                    onChange={(e) => {
                      filteredToCities(e.target.value)
                      setShowToDropdown(true)
                    }}
                    onFocus={() => setShowToDropdown(true)}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  {showToDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg bg-white border border-zinc-200 shadow-xl max-h-48 overflow-y-auto">
                      {filteredTo.map(city => (
                        <button
                          key={city}
                          className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 transition-colors"
                          onClick={() => { setToCity(city); setShowToDropdown(false) }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Travel Date</label>
                <HorizontalDatePicker value={date} onChange={setDate} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Vehicle */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-violet-600" />
                  Available Vehicles
                </CardTitle>
                <CardDescription>{fromCity} → {toCity} on {date}</CardDescription>
              </CardHeader>
            </Card>
            {schedules.map(schedule => (
              <Card key={schedule.id} className={`p-4 transition-all ${selectedSchedule?.id === schedule.id ? "ring-2 ring-violet-500" : "hover:bg-zinc-100/30"}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-violet-600" />
                      <span className="text-base font-semibold text-zinc-900">{schedule.vehicle}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">{schedule.type}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>Depart: {schedule.departure}</span>
                      <span>Arrive: {schedule.arrival}</span>
                      <span>{schedule.layout}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{schedule.seats} seats available</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-violet-600">Rs. {schedule.price.toLocaleString()}</p>
                      <p className="text-xs text-zinc-500">per seat</p>
                    </div>
                    <Button
                      size="sm"
                      variant={selectedSchedule?.id === schedule.id ? "primary" : "outline"}
                      onClick={() => setSelectedSchedule(schedule)}
                    >
                      {selectedSchedule?.id === schedule.id ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Select Seats */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Select Seats
              </CardTitle>
              <CardDescription>
                {selectedSchedule?.vehicle} · {selectedSchedule?.layout} layout · {seatCount} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1">
                  <div className="bg-zinc-100/30 rounded-lg p-6 inline-block">
                    <div className="mb-4 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded bg-zinc-100 text-xs text-zinc-500">
                        <Bus className="h-3 w-3" /> Driver Cabin
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="space-y-2">
                        {seats.filter((_, i) => i % 2 === 0).map(seat => (
                          <button
                            key={seat.id}
                            disabled={seat.status === "booked"}
                            onClick={() => toggleSeat(seat.id)}
                            className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                              seat.status === "selected" ? "bg-violet-600 text-zinc-900 shadow-lg shadow-violet-600/20" :
                              seat.status === "booked" ? "bg-zinc-100 text-zinc-600 cursor-not-allowed line-through" :
                              "bg-zinc-50 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-300"
                            }`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                      <div className="w-6" />
                      <div className="space-y-2">
                        {seats.filter((_, i) => i % 2 === 1).map(seat => (
                          <button
                            key={seat.id}
                            disabled={seat.status === "booked"}
                            onClick={() => toggleSeat(seat.id)}
                            className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
                              seat.status === "selected" ? "bg-violet-600 text-zinc-900 shadow-lg shadow-violet-600/20" :
                              seat.status === "booked" ? "bg-zinc-100 text-zinc-600 cursor-not-allowed line-through" :
                              "bg-zinc-50 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-300"
                            }`}
                          >
                            {seat.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lg:w-48 space-y-3">
                  <p className="text-sm font-medium text-zinc-700">Legend</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border border-zinc-300 bg-zinc-50" />
                      <span className="text-xs text-zinc-500">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-violet-600" />
                      <span className="text-xs text-zinc-500">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-600 line-through flex items-center justify-center text-[8px]">
                        S
                      </div>
                      <span className="text-xs text-zinc-500">Booked</span>
                    </div>
                  </div>
                  {selectedSeats.length > 0 && (
                    <div className="pt-3 border-t border-zinc-200">
                      <p className="text-xs text-zinc-500 mb-1">Selected Seats:</p>
                      <p className="text-sm font-medium text-zinc-200">{selectedSeats.map(s => `S${s}`).join(", ")}</p>
                      <p className="text-xs text-zinc-500 mt-2">Total: Rs. {(selectedSchedule?.price ?? 0 * seatCount).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Passenger Details */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600" />
                Passenger Details
              </CardTitle>
              <CardDescription>Enter details for each passenger</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {passengers.map((passenger, index) => (
                <div key={index} className="p-4 rounded-lg bg-zinc-100/30 border border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-700">Passenger {index + 1}</p>
                    {passengers.length > 1 && (
                      <button
                        onClick={() => removePassenger(index)}
                        className="p-1 rounded text-zinc-500 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name *"
                      placeholder="Enter passenger name"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, "name", e.target.value)}
                    />
                    <Input
                      label="Phone *"
                      placeholder="98XXXXXXXX"
                      value={passenger.phone}
                      onChange={(e) => updatePassenger(index, "phone", e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@example.com"
                      value={passenger.email}
                      onChange={(e) => updatePassenger(index, "email", e.target.value)}
                    />
                    <Input
                      label="Age *"
                      type="number"
                      placeholder="Age"
                      value={passenger.age}
                      onChange={(e) => updatePassenger(index, "age", e.target.value)}
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-zinc-700">Gender *</label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => updatePassenger(index, "gender", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addPassenger} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Another Passenger
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Payment & Print */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-violet-600" />
                  Payment Method
                </CardTitle>
                <CardDescription>Select payment method</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { value: "cash", label: "Cash", icon: "💵" },
                  { value: "esewa", label: "eSewa", icon: "📱" },
                  { value: "khalti", label: "Khalti", icon: "📱" },
                  { value: "fonepay", label: "Fonepay", icon: "📱" },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      paymentMethod === method.value
                        ? "border-violet-500 bg-violet-50"
                        : "border-zinc-200 hover:bg-zinc-100/30"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.value ? "border-violet-500" : "border-zinc-600"
                    }`}>
                      {paymentMethod === method.value && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                    </div>
                    <span className="text-base">{method.icon}</span>
                    <span className="text-sm text-zinc-200">{method.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-violet-600" />
                  Booking Summary
                </CardTitle>
                <CardDescription>Review your booking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Route</span>
                    <span className="text-zinc-200">{fromCity} → {toCity}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Date</span>
                    <span className="text-zinc-200">{date}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Time</span>
                    <span className="text-zinc-200">{selectedSchedule?.departure} - {selectedSchedule?.arrival}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Vehicle</span>
                    <span className="text-zinc-200">{selectedSchedule?.vehicle}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Seats</span>
                    <span className="text-zinc-200">{selectedSeats.map(s => `S${s}`).join(", ") || "-"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-200/50">
                    <span className="text-zinc-500">Passengers</span>
                    <span className="text-zinc-200">{passengers.length}</span>
                  </div>
                  {passengers.map((p, i) => (
                    <div key={i} className="flex justify-between py-1 text-xs text-zinc-500 pl-2">
                      <span>{p.name} ({p.gender}, {p.age})</span>
                      <span>{p.phone}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 text-base font-bold">
                    <span className="text-zinc-700">Total Amount</span>
                    <span className="text-violet-600">Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div>
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canGoNext()} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleConfirmBooking} disabled={!canGoNext() || submitting} className="gap-2">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting ? "Booking..." : "Confirm & Print Ticket"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </CounterLayout>
  )
}
