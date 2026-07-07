"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, MapPin, ArrowRight, Shield, Clock, IndianRupee, Headphones, ChevronDown, Bus, Star, ArrowUpRight, Users, Smartphone, CheckCircle, Zap, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CITIES, POPULAR_ROUTES, FEATURES } from "@/lib/constants"
import { todayNepali } from "@/lib/nepali-date"
import { HorizontalDatePicker } from "@/components/ui/horizontal-date-picker"

const faqs = [
  {
    q: "How do I book a ticket on Sabari?",
    a: "Booking is simple. Search your route by selecting departure and destination cities, choose your travel date, select your preferred vehicle and seat, fill in passenger details, and complete payment. You'll receive a confirmation with your booking details.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes, you can cancel your booking depending on the operator's cancellation policy. Refundable tickets can be cancelled through your booking dashboard, and refunds will be processed according to the terms.",
  },
  {
    q: "What payment methods are accepted?",
    a: "Sabari accepts eSewa, Khalti, Fonepay, IME Pay, ConnectIPS, credit/debit cards, and online banking. All payments are processed through secure gateways.",
  },
  {
    q: "How will I receive my ticket?",
    a: "After successful booking, you'll receive a confirmation email and SMS with a QR code. Show the e-ticket (digital or printed) to board your vehicle.",
  },
  {
    q: "Can I select my seat in advance?",
    a: "Yes, Sabari allows you to select your preferred seat during booking. You can view the seat layout and choose from available seats before completing your booking.",
  },
  {
    q: "Can I track my vehicle in real-time?",
    a: "Yes! After booking, you can track your vehicle live on the map. You'll receive notifications when the vehicle starts, reaches stops, and approaches your location.",
  },
]

const blogPosts = [
  {
    title: "Dashain Bus Rush 2026: How to Book Early and Avoid the Chaos",
    excerpt: "Millions leave Kathmandu Valley every Dashain. This guide breaks down the real 2026 festival dates, advance booking tips, and how to secure your seat.",
    date: "Jul 2, 2026",
    readTime: "9 min read",
    category: "Seasonal Travel",
  },
  {
    title: "Kathmandu to Pokhara: Complete Bus Travel Guide 2026",
    excerpt: "Everything you need to know about traveling from Kathmandu to Pokhara — ticket prices, travel time, best bus operators, and tips for a comfortable journey.",
    date: "Jun 28, 2026",
    readTime: "7 min read",
    category: "Route Guide",
  },
  {
    title: "Electric Buses in Nepal: The Future of Green Travel",
    excerpt: "Nepal is embracing electric mobility. Discover how EV buses are transforming intercity travel with lower fares and eco-friendly journeys.",
    date: "Jun 20, 2026",
    readTime: "6 min read",
    category: "Nepal Travel",
  },
]

export default function HomePage() {
  const router = useRouter()
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [showFromCities, setShowFromCities] = useState(false)
  const [showToCities, setShowToCities] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredFrom = CITIES.filter((c) => c.toLowerCase().includes(from.toLowerCase()) && c !== to)
  const filteredTo = CITIES.filter((c) => c.toLowerCase().includes(to.toLowerCase()) && c !== from)

  const handleSearch = () => {
    if (!from || !to) return
    router.push(`/booking/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`)
  }

  const switchCities = () => {
    setFrom(to)
    setTo(from)
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm text-white/90 mb-6">
              <Star className="h-3.5 w-3.5 fill-white/90" />
              Nepal&apos;s #1 Vehicle Booking Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Book Your Journey{" "}
              <br className="hidden sm:block" />
              Across <span className="text-yellow-300">Nepal</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 max-w-lg mx-auto leading-relaxed">
              Bus, Hiace, Sumo, Jeep, EV — book any vehicle. Track live. Travel safe.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm text-white/80">
              <span className="text-yellow-300 font-semibold">{todayNepali()}</span>
            </div>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/10 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr,auto] gap-3 items-end mb-3">
                <div className="relative">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">From</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
                    <input
                      type="text"
                      placeholder="Departure city"
                      value={from}
                      onChange={(e) => { setFrom(e.target.value); setShowFromCities(true) }}
                      onFocus={() => setShowFromCities(true)}
                      onBlur={() => setTimeout(() => setShowFromCities(false), 200)}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {showFromCities && filteredFrom.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 bg-white max-h-48 overflow-y-auto z-30 shadow-xl">
                      {filteredFrom.map((city) => (
                        <button
                          key={city}
                          className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                          onClick={() => { setFrom(city); setShowFromCities(false) }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={switchCities}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600 transition-colors self-center sm:self-end mb-0.5"
                  title="Switch cities"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>

                <div className="relative">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">To</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500" />
                    <input
                      type="text"
                      placeholder="Destination city"
                      value={to}
                      onChange={(e) => { setTo(e.target.value); setShowToCities(true) }}
                      onFocus={() => setShowToCities(true)}
                      onBlur={() => setTimeout(() => setShowToCities(false), 200)}
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {showToCities && filteredTo.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-zinc-200 bg-white max-h-48 overflow-y-auto z-30 shadow-xl">
                      {filteredTo.map((city) => (
                        <button
                          key={city}
                          className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                          onClick={() => { setTo(city); setShowToCities(false) }}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">Travel Date</label>
                  <HorizontalDatePicker value={date} onChange={setDate} />
                </div>

                <Button size="lg" className="h-12 px-8 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all sm:col-start-4" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { label: "Verified Operators", icon: Shield },
              { label: "Secure Payments", icon: CheckCircle },
              { label: "24/7 Support", icon: Headphones },
              { label: "Live Tracking", icon: MapPin },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-white/60">
                <stat.icon className="h-4 w-4 text-yellow-300" />
                <span className="text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Popular Routes</h2>
              <p className="mt-2 text-zinc-500">Explore the most traveled destinations across Nepal</p>
            </div>
            <Link href="/booking/search" className="hidden sm:flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors">
              View All <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map((route) => (
              <Link key={`${route.from}-${route.to}`} href={`/booking/search?from=${route.from}&to=${route.to}`}>
                <Card className="group cursor-pointer overflow-hidden hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-300 transition-all duration-300">
                  <div className="h-32 bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent" />
                    <Bus className="h-12 w-12 text-violet-300 group-hover:text-violet-500 transition-colors group-hover:scale-110 duration-300" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-zinc-900 group-hover:text-violet-600 transition-colors">
                      {route.from} → {route.to}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      Starting from <span className="text-violet-600 font-semibold">Rs. {route.price.toLocaleString()}</span>
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <Link href="/booking/search" className="sm:hidden flex items-center justify-center gap-1 mt-4 text-sm text-violet-600 font-medium">
            View All Routes <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Why Choose Sabari */}
      <section className="py-16 sm:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Why Choose Sabari</h2>
            <p className="mt-2 text-zinc-500">Experience the difference with Nepal&apos;s most trusted booking platform</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="p-6 text-center hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-300 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 text-violet-600 mb-4">
                  {feature.icon === "Shield" && <Shield className="h-6 w-6" />}
                  {feature.icon === "Clock" && <Clock className="h-6 w-6" />}
                  {feature.icon === "IndianRupee" && <IndianRupee className="h-6 w-6" />}
                  {feature.icon === "Headphones" && <Headphones className="h-6 w-6" />}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Types */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Book Any Vehicle</h2>
            <p className="mt-2 text-zinc-500">From buses to EVs — we cover all your travel needs</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { name: "Bus", icon: "🚌", desc: "Standard & Deluxe" },
              { name: "AC Bus", icon: "🚌", desc: "Air Conditioned" },
              { name: "Tourist Bus", icon: "🚌", desc: "Sightseeing" },
              { name: "Night Bus", icon: "🌙", desc: "Overnight Travel" },
              { name: "Hiace", icon: "🚐", desc: "Group Travel" },
              { name: "Sumo", icon: "🚙", desc: "Off-road" },
              { name: "Jeep", icon: "🚙", desc: "Adventure" },
              { name: "EV Bus", icon: "⚡", desc: "Electric" },
              { name: "Micro Bus", icon: "🚐", desc: "Mini Bus" },
              { name: "Electric Van", icon: "⚡", desc: "Eco Friendly" },
            ].map((v) => (
              <Card key={v.name} className="p-4 text-center hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-300 transition-all duration-300 cursor-pointer group">
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{v.icon}</span>
                <h3 className="font-medium text-zinc-900 text-sm group-hover:text-violet-600 transition-colors">{v.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App Download */}
      <section className="py-16 sm:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Get the Sabari App</h2>
              <p className="mt-3 text-zinc-500 max-w-md leading-relaxed">
                Book tickets, track your vehicle in real-time, and get exclusive app-only offers. Available on iOS and Android.
              </p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" size="lg" className="gap-2">
                  <Smartphone className="h-5 w-5" />
                  App Store
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Smartphone className="h-5 w-5" />
                  Google Play
                </Button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-3xl" />
                <div className="absolute inset-4 bg-white rounded-2xl border border-zinc-200 shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <Bus className="h-12 w-12 text-violet-600 mx-auto" />
                    <p className="text-zinc-900 font-semibold mt-2">Sabari</p>
                    <p className="text-xs text-zinc-500">Book & Track</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">Frequently Asked Questions</h2>
            <p className="mt-2 text-zinc-500">Everything you need to know about booking with Sabari</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-300 transition-colors">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-zinc-900 text-sm sm:text-base pr-4">{faq.q}</span>
                  <ChevronDown className={cn("h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200", openFaq === i && "rotate-180")} />
                </button>
                <div className={cn("overflow-hidden transition-all duration-300", openFaq === i ? "max-h-48" : "max-h-0")}>
                  <p className="px-4 pb-4 text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="py-16 sm:py-20 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900">From the Blog</h2>
              <p className="mt-2 text-zinc-500">Travel tips, route guides & booking advice</p>
            </div>
            <Link href="#" className="hidden sm:flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium">
              View all articles <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-300 transition-all duration-300 cursor-pointer group">
                <div className="h-40 bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center">
                  <Bus className="h-10 w-10 text-violet-300 group-hover:text-violet-500 transition-colors" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-violet-600 font-semibold bg-violet-50 px-2 py-0.5 rounded-full">{post.category}</span>
                    <span className="text-xs text-zinc-400">•</span>
                    <span className="text-xs text-zinc-500">{post.readTime}</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 group-hover:text-violet-600 transition-colors line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-zinc-500 mt-2 line-clamp-2">{post.excerpt}</p>
                  <p className="text-xs text-zinc-400 mt-3">{post.date}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
