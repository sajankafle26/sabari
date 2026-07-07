"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Users, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useBooking, type PassengerInfo } from "@/lib/context/booking-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function PassengerDetailsPage() {
  const router = useRouter()
  const { data, updateData } = useBooking()

  const seatCount = data.seats?.length || 1

  const [primaryName, setPrimaryName] = useState(data.passengers?.[0]?.name || "")
  const [primaryPhone, setPrimaryPhone] = useState(data.passengers?.[0]?.phone || "")
  const [primaryEmail, setPrimaryEmail] = useState(data.passengers?.[0]?.email || "")
  const [primaryAge, setPrimaryAge] = useState(data.passengers?.[0]?.age || "")
  const [primaryGender, setPrimaryGender] = useState(data.passengers?.[0]?.gender || "male")

  const [sameAsPrimary, setSameAsPrimary] = useState(true)

  const [extraPassengers, setExtraPassengers] = useState<Array<{
    name: string
    phone: string
    email: string
    age: string
    gender: string
  }>>(
    data.passengers.length > 1
      ? data.passengers.slice(1).map((p) => ({
          name: p.name,
          phone: p.phone,
          email: p.email,
          age: p.age,
          gender: p.gender,
        }))
      : Array.from({ length: Math.max(0, seatCount - 1) }, () => ({
          name: "",
          phone: "",
          email: "",
          age: "",
          gender: "male",
        }))
  )

  const updateExtra = (index: number, field: string, value: string) => {
    setExtraPassengers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  const handleContinue = () => {
    if (!primaryName.trim() || !primaryPhone.trim()) {
      toast.error("Please fill in your name and phone number")
      return
    }

    const allPassengers: PassengerInfo[] = [
      {
        name: primaryName,
        phone: primaryPhone,
        email: primaryEmail,
        age: primaryAge,
        gender: primaryGender,
        seatNumber: data.seats[0],
      },
    ]

    for (let i = 0; i < extraPassengers.length; i++) {
      const ep = sameAsPrimary
        ? { name: primaryName, phone: primaryPhone, email: primaryEmail, age: primaryAge, gender: primaryGender }
        : extraPassengers[i]

      if (!sameAsPrimary && !ep.name.trim()) {
        toast.error(`Please fill in name for passenger ${i + 2}`)
        return
      }

      allPassengers.push({
        name: ep.name || primaryName,
        phone: ep.phone || primaryPhone,
        email: ep.email || primaryEmail,
        age: ep.age || primaryAge,
        gender: ep.gender || primaryGender,
        seatNumber: data.seats[i + 1],
      })
    }

    updateData({ passengers: allPassengers })
    router.push("/booking/payment")
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Passenger Details</h1>
        <p className="text-zinc-500 text-sm">
          {seatCount} {seatCount === 1 ? "seat" : "seats"} selected — {sameAsPrimary && seatCount > 1 ? "all passengers share the same contact" : "enter each passenger's details"}
        </p>
      </div>

      {/* Primary Passenger */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-600/20">
              <User className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-base">Primary Passenger</CardTitle>
              <p className="text-xs text-zinc-500">Seat {data.seats[0]} — This person receives the booking confirmation</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Full Name *" placeholder="e.g. Ram Sharma" value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} />
            <Input label="Phone *" placeholder="98XXXXXXXX" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Email" type="email" placeholder="email@example.com" value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
            <Input label="Age" type="number" placeholder="25" value={primaryAge} onChange={(e) => setPrimaryAge(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Gender</label>
              <select
                value={primaryGender}
                onChange={(e) => setPrimaryGender(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Same as primary toggle */}
      {seatCount > 1 && (
        <button
          onClick={() => setSameAsPrimary(!sameAsPrimary)}
          className={cn(
            "flex items-center gap-3 w-full p-4 rounded-xl border mb-4 transition-all",
            sameAsPrimary
              ? "border-violet-500/50 bg-violet-50"
              : "border-zinc-200 bg-white/50 hover:border-zinc-300"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-5 h-5 rounded border transition-colors",
            sameAsPrimary
              ? "bg-violet-600 border-violet-600"
              : "border-zinc-600"
          )}>
            {sameAsPrimary && <Check className="h-3 w-3 text-zinc-900" />}
          </div>
          <div className="text-left">
            <p className="text-sm text-zinc-900 font-medium">Same details for all passengers</p>
            <p className="text-xs text-zinc-500">
              {seatCount - 1} other {seatCount - 1 === 1 ? "passenger" : "passengers"} will use the same contact info
            </p>
          </div>
        </button>
      )}

      {/* Extra passengers */}
      {!sameAsPrimary && extraPassengers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <p className="text-sm text-zinc-500">Other Passengers</p>
          </div>
          {extraPassengers.map((ep, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Passenger {index + 2}
                  <span className="ml-2 text-xs font-normal text-zinc-500">(Seat {data.seats[index + 1]})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Full Name *" placeholder="Passenger name" value={ep.name} onChange={(e) => updateExtra(index, "name", e.target.value)} />
                  <Input label="Phone" placeholder="98XXXXXXXX" value={ep.phone} onChange={(e) => updateExtra(index, "phone", e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Age" type="number" placeholder="25" value={ep.age} onChange={(e) => updateExtra(index, "age", e.target.value)} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Gender</label>
                    <select
                      value={ep.gender}
                      onChange={(e) => updateExtra(index, "gender", e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => router.push("/booking/select-seat")}>
          ← Back
        </Button>
        <Button size="lg" className="flex-1" onClick={handleContinue}>
          Continue to Payment →
        </Button>
      </div>
    </div>
  )
}
