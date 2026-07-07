export const ROUTES = {
  home: "/",
  login: "/auth/login",
  register: "/auth/register",
  search: "/booking/search",
  selectSeat: "/booking/select-seat",
  passengerDetails: "/booking/passenger-details",
  payment: "/booking/payment",
  confirmation: "/booking/confirmation",
  tracking: "/tracking",
  myBookings: "/my-bookings",
  dashboard: "/dashboard",
  admin: "/admin",
} as const

export const VEHICLE_TYPES = [
  { id: "bus", label: "Bus", icon: "🚌" },
  { id: "deluxe-bus", label: "Deluxe Bus", icon: "🚌" },
  { id: "ac-bus", label: "AC Bus", icon: "🚌" },
  { id: "tourist-bus", label: "Tourist Bus", icon: "🚌" },
  { id: "night-bus", label: "Night Bus", icon: "🚌" },
  { id: "sumo", label: "Sumo", icon: "🚙" },
  { id: "hiace", label: "Hiace", icon: "🚐" },
  { id: "jeep", label: "Jeep", icon: "🚙" },
  { id: "ev-bus", label: "EV Bus", icon: "🚌" },
  { id: "micro-bus", label: "Micro Bus", icon: "🚐" },
] as const

export const CITIES = [
  "Kathmandu",
  "Pokhara",
  "Biratnagar",
  "Kakarbhitta",
  "Lumbini",
  "Chitwan",
  "Butwal",
  "Bhairahawa",
  "Hetauda",
  "Janakpur",
  "Dharan",
  "Itahari",
  "Bhadrapur",
  "Nepalgunj",
  "Dhangadhi",
  "Tikapur",
  "Ghorahi",
  "Baglung",
  "Beltar",
  "Beni",
  "Sunauli",
  "Rampur",
  "Narayanghat",
  "Banepa",
  "Panauti",
  "Dhulikhel",
]

export const POPULAR_ROUTES = [
  { from: "Kathmandu", to: "Pokhara", price: 1000, image: "/images/pokhara.jpg" },
  { from: "Kathmandu", to: "Kakarbhitta", price: 1600, image: "/images/kakarbhitta.jpg" },
  { from: "Kathmandu", to: "Biratnagar", price: 1400, image: "/images/biratnagar.jpg" },
  { from: "Kathmandu", to: "Lumbini", price: 1160, image: "/images/lumbini.jpg" },
]

export const FEATURES = [
  {
    title: "Safe & Secure",
    description: "Verified bus operators and secure payment gateways for your peace of mind.",
    icon: "Shield",
  },
  {
    title: "On Time",
    description: "Track your bus in real-time and never miss a departure.",
    icon: "Clock",
  },
  {
    title: "Best Prices",
    description: "Lowest price guarantee with no hidden booking fees.",
    icon: "IndianRupee",
  },
  {
    title: "24/7 Support",
    description: "Our customer support team is always here to help you.",
    icon: "Headphones",
  },
]

export const SEAT_LAYOUTS = {
  "2x2": { rows: 10, cols: 2, label: "2x2" },
  "2x1": { rows: 10, cols: 2, label: "2x1" },
  luxury: { rows: 8, cols: 2, label: "Luxury" },
  sleeper: { rows: 6, cols: 2, label: "Sleeper" },
  hiace: { rows: 4, cols: 3, label: "Hiace" },
  sumo: { rows: 3, cols: 2, label: "Sumo" },
} as const
