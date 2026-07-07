const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sabari"

const userSchema = new mongoose.Schema({
  firstName: String, lastName: String, email: { type: String, unique: true },
  phone: String, password: String,
  role: { type: String, enum: ["super_admin", "company_admin", "counter_operator", "driver", "passenger"] },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  isActive: { type: Boolean, default: true },
  twoFactorEnabled: { type: Boolean, default: false },
}, { strict: false })
const User = mongoose.model("User", userSchema)

const companySchema = new mongoose.Schema({
  name: String, registrationNumber: String,
  address: { district: String, municipality: String, ward: String, street: String },
  phone: String, email: String, website: String,
  status: { type: String, enum: ["active", "suspended", "pending"], default: "pending" },
  subscription: { plan: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" }, startDate: Date, endDate: Date, status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" } },
  documents: { registrationDoc: String, taxDoc: String, permitDoc: String },
  settings: { commissionRate: { type: Number, default: 5 }, allowOnlineBooking: { type: Boolean, default: true }, allowCounterBooking: { type: Boolean, default: true }, refundPolicy: String },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const Company = mongoose.model("Company", companySchema)

const vehicleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  vehicleNumber: { type: String, unique: true },
  type: { type: String, enum: ["bus", "deluxe-bus", "ac-bus", "tourist-bus", "night-bus", "sumo", "hiace", "jeep", "ev-bus", "electric-van", "micro-bus"] },
  brand: String, model: String, year: Number, capacity: Number,
  seatLayout: { type: String, default: "2x2" },
  amenities: [String],
  features: { wifi: Boolean, ac: Boolean, charging: Boolean, blanket: Boolean, snacks: Boolean, toilet: Boolean, entertainment: Boolean },
  insurance: { provider: String, policyNumber: String, expiryDate: Date },
  taxExpiry: Date, permitExpiry: Date, lastService: Date,
  status: { type: String, enum: ["active", "maintenance", "inactive"], default: "active" },
  isActive: { type: Boolean, default: true },
  fuelLevel: { type: Number, default: 100 },
  currentMileage: { type: Number, default: 0 },
  fuelType: { type: String, default: "diesel" },
  mileagePerLiter: { type: Number, default: 0 },
}, { strict: false, timestamps: true })
const Vehicle = mongoose.model("Vehicle", vehicleSchema)

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  fullName: String, phone: String, email: String,
  licenseNumber: String, licenseExpiry: Date,
  status: { type: String, enum: ["available", "on_trip", "on_break", "offline"], default: "offline" },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const Driver = mongoose.model("Driver", driverSchema)

const routeSchema = new mongoose.Schema({
  name: String, from: String, to: String,
  fromDistrict: String, toDistrict: String,
  distance: Number, estimatedDuration: Number,
  stops: [{ name: String, district: String, order: Number, distanceFromStart: Number, estimatedArrival: String }],
  isActive: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
}, { strict: false, timestamps: true })
const Route = mongoose.model("Route", routeSchema)

const scheduleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  departureTime: String, arrivalTime: String,
  frequency: { type: String, default: "daily" },
  fare: Number, discountedFare: Number,
  status: { type: String, default: "scheduled" },
  date: Date,
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const Schedule = mongoose.model("Schedule", scheduleSchema)

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  passengers: [{ name: String, phone: String, email: String, age: Number, gender: String, seatNumber: String, status: { type: String, default: "confirmed" } }],
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
  source: { type: String, default: "online" },
  totalAmount: Number, discount: { type: Number, default: 0 }, commission: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "partial_refund"], default: "pending" },
  paymentMethod: String,
  bookingStatus: { type: String, default: "confirmed" },
  journeyDate: Date,
  cancellation: { cancelledAt: Date, reason: String, refundAmount: Number, refundStatus: { type: String, default: "none" } },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
bookingSchema.pre("save", function () {
  if (!this.bookingId) {
    const d = new Date()
    this.bookingId = `SBR-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*10000).toString().padStart(4,"0")}`
  }
})
const Booking = mongoose.model("Booking", bookingSchema)

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  transactionId: { type: String, unique: true },
  amount: Number, method: String,
  status: { type: String, default: "initiated" },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  paidAt: Date,
}, { strict: false, timestamps: true })
const Payment = mongoose.model("Payment", paymentSchema)

const expenseSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  type: { type: String, enum: ["fuel", "maintenance", "salary", "toll", "parking", "food", "other"] },
  amount: Number, description: String, date: Date,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { strict: false, timestamps: true })
const Expense = mongoose.model("Expense", expenseSchema)

const counterSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  name: String, code: { type: String, unique: true },
  address: { district: String, municipality: String, ward: String, street: String },
  phone: String, email: String,
  operators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, default: "active" },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const Counter = mongoose.model("Counter", counterSchema)

const settingSchema = new mongoose.Schema({
  key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed,
  description: String,
  category: { type: String, enum: ["general", "payment", "sms", "email", "commission", "booking"], default: "general" },
}, { strict: false, timestamps: true })
const Setting = mongoose.model("Setting", settingSchema)

const planSchema = new mongoose.Schema({
  name: String, description: String, price: Number, duration: Number,
  features: [{ name: String, included: Boolean, limit: Number }],
  maxVehicles: Number, maxDrivers: Number, maxCounters: Number, maxRoutes: Number,
  commissionRate: Number, hasLiveTracking: { type: Boolean, default: true },
  hasReporting: { type: Boolean, default: true }, hasAPIAccess: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const SubscriptionPlan = mongoose.model("SubscriptionPlan", planSchema)

const commissionSchema = new mongoose.Schema({
  name: String, type: { type: String, enum: ["percentage", "fixed"] },
  value: Number, appliesTo: { type: String, enum: ["all", "company", "route", "vehicle_type"], default: "all" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const TicketCommission = mongoose.model("TicketCommission", commissionSchema)

const districtSchema = new mongoose.Schema({
  name: { type: String, unique: true }, province: String, code: String,
  isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const District = mongoose.model("District", districtSchema)

const municipalitySchema = new mongoose.Schema({
  name: String, district: { type: mongoose.Schema.Types.ObjectId, ref: "District" },
  type: { type: String, enum: ["metropolitan", "sub-metropolitan", "municipality", "rural-municipality"] },
  wardCount: Number, isActive: { type: Boolean, default: true },
}, { strict: false, timestamps: true })
const Municipality = mongoose.model("Municipality", municipalitySchema)

const tripSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route" },
  date: Date, startTime: Date, endTime: Date,
  status: { type: String, default: "scheduled" },
  passengerCount: { type: Number, default: 0 },
  delay: { type: Number, default: 0 },
}, { strict: false, timestamps: true })
const Trip = mongoose.model("Trip", tripSchema)

const gpsLogSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },
  latitude: Number, longitude: Number, heading: Number, speed: { type: Number, default: 0 },
  battery: Number, timestamp: { type: Date, default: Date.now },
}, { strict: false })
const GPSLog = mongoose.model("GPSLog", gpsLogSchema)

const vehicleLogSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  type: { type: String, enum: ["fuel", "service", "mileage", "repair", "accident", "inspection", "other"] },
  amount: Number, quantity: Number, mileage: Number,
  description: String, odometerReading: Number,
  performedAt: { type: Date, default: Date.now },
  vendor: String,
}, { strict: false, timestamps: true })
const VehicleLog = mongoose.model("VehicleLog", vehicleLogSchema)

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
  role: { type: String, default: "driver" },
  date: Date, clockIn: Date, clockOut: Date,
  status: { type: String, default: "present" },
  workDuration: Number,
}, { strict: false, timestamps: true })
const Attendance = mongoose.model("Attendance", attendanceSchema)

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String, resource: String, resourceId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed, ip: String,
}, { strict: false, timestamps: true })
const AuditLog = mongoose.model("AuditLog", auditLogSchema)

const NEPALI_DISTRICTS = [
  { name: "Kathmandu", province: "Bagmati" },
  { name: "Lalitpur", province: "Bagmati" },
  { name: "Bhaktapur", province: "Bagmati" },
  { name: "Pokhara", province: "Gandaki" },
  { name: "Chitwan", province: "Bagmati" },
  { name: "Morang", province: "Koshi" },
  { name: "Sunsari", province: "Koshi" },
  { name: "Jhapa", province: "Koshi" },
  { name: "Rupandehi", province: "Lumbini" },
  { name: "Kaski", province: "Gandaki" },
  { name: "Bara", province: "Madhesh" },
  { name: "Parsa", province: "Madhesh" },
  { name: "Rautahat", province: "Madhesh" },
  { name: "Dang", province: "Lumbini" },
  { name: "Banke", province: "Lumbini" },
  { name: "Kailali", province: "Sudurpashchim" },
  { name: "Kanchanpur", province: "Sudurpashchim" },
  { name: "Sindhupalchok", province: "Bagmati" },
  { name: "Nuwakot", province: "Bagmati" },
  { name: "Makwanpur", province: "Bagmati" },
  { name: "Tanahu", province: "Gandaki" },
  { name: "Syangja", province: "Gandaki" },
  { name: "Gulmi", province: "Lumbini" },
  { name: "Palpa", province: "Lumbini" },
  { name: "Sindhuli", province: "Bagmati" },
]

const DISTRICT_MUNICIPALITIES = {
  "Kathmandu": [
    { name: "Kathmandu Metropolitan", type: "metropolitan", wardCount: 32 },
    { name: "Kirtipur Municipality", type: "municipality", wardCount: 9 },
  ],
  "Lalitpur": [
    { name: "Lalitpur Metropolitan", type: "metropolitan", wardCount: 29 },
    { name: "Godavari Municipality", type: "municipality", wardCount: 16 },
  ],
  "Bhaktapur": [
    { name: "Bhaktapur Municipality", type: "metropolitan", wardCount: 18 },
    { name: "Thimi Municipality", type: "sub-metropolitan", wardCount: 12 },
  ],
  "Pokhara": [
    { name: "Pokhara Metropolitan", type: "metropolitan", wardCount: 33 },
  ],
  "Chitwan": [
    { name: "Bharatpur Metropolitan", type: "metropolitan", wardCount: 29 },
    { name: "Ratnanagar Municipality", type: "municipality", wardCount: 15 },
  ],
  "Morang": [
    { name: "Biratnagar Metropolitan", type: "metropolitan", wardCount: 19 },
    { name: "Rangeli Municipality", type: "municipality", wardCount: 10 },
  ],
  "Sunsari": [
    { name: "Itahari Sub-Metropolitan", type: "sub-metropolitan", wardCount: 20 },
    { name: "Inaruwa Municipality", type: "municipality", wardCount: 15 },
  ],
  "Jhapa": [
    { name: "Birtamod Municipality", type: "municipality", wardCount: 12 },
    { name: "Damak Municipality", type: "municipality", wardCount: 10 },
  ],
  "Rupandehi": [
    { name: "Bhairahawa Municipality", type: "sub-metropolitan", wardCount: 19 },
  ],
  "Kaski": [
    { name: "Pokhara Metropolitan", type: "metropolitan", wardCount: 33 },
  ],
}

const CITIES = ["Kathmandu", "Lalitpur", "Pokhara", "Chitwan", "Biratnagar", "Butwal", "Dhangadhi", "Bharatpur", "Itahari", "Birgunj", "Janakpur", "Nepalgunj", "Hetauda", "Dharan", "Birtamod"]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB:", MONGODB_URI)

  const existing = await User.findOne({ email: "admin@sabari.com" })
  if (existing) {
    console.log("Dropping existing data for fresh seed...")
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
    console.log("All collections cleared.")
  }

  const password = await bcrypt.hash("password", 12)

  // 1. Districts
  const districts = []
  for (const d of NEPALI_DISTRICTS) {
    const dist = await District.create({ name: d.name, province: d.province, code: d.name.substring(0, 3).toUpperCase(), isActive: true })
    districts.push(dist)
  }
  console.log(`Created ${districts.length} districts`)

  // 2. Municipalities
  let muniCount = 0
  for (const dist of districts) {
    const munis = DISTRICT_MUNICIPALITIES[dist.name]
    if (munis) {
      for (const m of munis) {
        await Municipality.create({ name: m.name, district: dist._id, type: m.type, wardCount: m.wardCount, isActive: true })
        muniCount++
      }
    } else {
      await Municipality.create({ name: `${dist.name} Municipality`, district: dist._id, type: "municipality", wardCount: 15, isActive: true })
      muniCount++
    }
  }
  console.log(`Created ${muniCount} municipalities`)

  // 3. Subscription Plans
  const plans = await SubscriptionPlan.create([
    { name: "Starter", description: "For small operators", price: 1999, duration: 30, features: [{ name: "Live Tracking", included: true, limit: 5 }, { name: "Reporting", included: true, limit: 10 }, { name: "API Access", included: false }], maxVehicles: 5, maxDrivers: 10, maxCounters: 2, maxRoutes: 10, commissionRate: 8, hasLiveTracking: true, hasReporting: true, hasAPIAccess: false, isActive: true },
    { name: "Professional", description: "For growing companies", price: 4999, duration: 30, features: [{ name: "Live Tracking", included: true, limit: 25 }, { name: "Reporting", included: true, limit: 50 }, { name: "API Access", included: true, limit: 1000 }], maxVehicles: 25, maxDrivers: 50, maxCounters: 10, maxRoutes: 50, commissionRate: 5, hasLiveTracking: true, hasReporting: true, hasAPIAccess: true, isActive: true },
    { name: "Enterprise", description: "For large fleets", price: 9999, duration: 30, features: [{ name: "Live Tracking", included: true, limit: -1 }, { name: "Reporting", included: true, limit: -1 }, { name: "API Access", included: true, limit: -1 }], maxVehicles: -1, maxDrivers: -1, maxCounters: -1, maxRoutes: -1, commissionRate: 3, hasLiveTracking: true, hasReporting: true, hasAPIAccess: true, isActive: true },
  ])
  console.log(`Created ${plans.length} subscription plans`)

  // 4. Companies
  const companies = await Company.create([
    { name: "Sabari Travels Pvt. Ltd.", registrationNumber: "REG-001", address: { district: "Kathmandu", municipality: "Kathmandu Metropolitan", ward: "12", street: "New Road" }, phone: "9801000001", email: "sabari@sabari.com", website: "https://sabari.com", status: "active", subscription: { plan: plans[1]._id, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31"), status: "active" }, settings: { commissionRate: 5, allowOnlineBooking: true, allowCounterBooking: true, refundPolicy: "standard" }, isActive: true },
    { name: "Himalayan Express", registrationNumber: "REG-002", address: { district: "Pokhara", municipality: "Pokhara Metropolitan", ward: "5", street: "Lakeside" }, phone: "9801000002", email: "info@himalayan.com", status: "active", subscription: { plan: plans[1]._id, startDate: new Date("2025-03-01"), endDate: new Date("2026-03-01"), status: "active" }, settings: { commissionRate: 6, allowOnlineBooking: true, allowCounterBooking: true, refundPolicy: "flexible" }, isActive: true },
    { name: "Valley Transport", registrationNumber: "REG-003", address: { district: "Lalitpur", municipality: "Lalitpur Metropolitan", ward: "8", street: "Jawalakhel" }, phone: "9801000003", email: "info@valley.com", status: "active", subscription: { plan: plans[0]._id, startDate: new Date("2025-06-01"), endDate: new Date("2025-12-01"), status: "active" }, settings: { commissionRate: 7, allowOnlineBooking: true, allowCounterBooking: true, refundPolicy: "standard" }, isActive: true },
    { name: "Terai Link", registrationNumber: "REG-004", address: { district: "Morang", municipality: "Biratnagar Metropolitan", ward: "3", street: "Road No. 5" }, phone: "9801000004", email: "info@terailink.com", status: "pending", settings: { commissionRate: 5 }, isActive: true },
    { name: "Mountain Riders", registrationNumber: "REG-005", address: { district: "Chitwan", municipality: "Bharatpur Metropolitan", ward: "10", street: "MG Road" }, phone: "9801000005", email: "info@mountriders.com", status: "active", subscription: { plan: plans[2]._id, startDate: new Date("2025-01-01"), endDate: new Date("2026-01-01"), status: "active" }, settings: { commissionRate: 4, allowOnlineBooking: true, allowCounterBooking: true, refundPolicy: "flexible" }, isActive: true },
  ])
  console.log(`Created ${companies.length} companies`)

  // 5. Routes
  const routesData = [
    { name: "Kathmandu → Pokhara", from: "Kathmandu", to: "Pokhara", fromDistrict: "Kathmandu", toDistrict: "Kaski", distance: 200, estimatedDuration: 360, popular: true, stops: [{ name: "Dhulikhel", district: "Kavrepalanchok", order: 1, distanceFromStart: 30, estimatedArrival: "30 min" }, { name: "Sindhupalchok", district: "Sindhupalchok", order: 2, distanceFromStart: 80, estimatedArrival: "1h 20min" }] },
    { name: "Kathmandu → Chitwan", from: "Kathmandu", to: "Chitwan", fromDistrict: "Kathmandu", toDistrict: "Chitwan", distance: 165, estimatedDuration: 300, popular: true, stops: [{ name: "Hetauda", district: "Makwanpur", order: 1, distanceFromStart: 130, estimatedArrival: "2h 10min" }] },
    { name: "Kathmandu → Biratnagar", from: "Kathmandu", to: "Biratnagar", fromDistrict: "Kathmandu", toDistrict: "Morang", distance: 400, estimatedDuration: 540, popular: true, stops: [{ name: "Itahari", district: "Sunsari", order: 1, distanceFromStart: 380, estimatedArrival: "5h 30min" }] },
    { name: "Kathmandu → Butwal", from: "Kathmandu", to: "Butwal", fromDistrict: "Kathmandu", toDistrict: "Rupandehi", distance: 280, estimatedDuration: 420, popular: false },
    { name: "Pokhara → Chitwan", from: "Pokhara", to: "Chitwan", fromDistrict: "Kaski", toDistrict: "Chitwan", distance: 120, estimatedDuration: 240, popular: false },
    { name: "Kathmandu → Janakpur", from: "Kathmandu", to: "Janakpur", fromDistrict: "Kathmandu", toDistrict: "Dhanusha", distance: 400, estimatedDuration: 540, popular: false },
    { name: "Kathmandu → Dhangadhi", from: "Kathmandu", to: "Dhangadhi", fromDistrict: "Kathmandu", toDistrict: "Kailali", distance: 620, estimatedDuration: 900, popular: false },
    { name: "Kathmandu → Nepalgunj", from: "Kathmandu", to: "Nepalgunj", fromDistrict: "Kathmandu", toDistrict: "Banke", distance: 520, estimatedDuration: 720, popular: false },
    { name: "Biratnagar → Kathmandu", from: "Biratnagar", to: "Kathmandu", fromDistrict: "Morang", toDistrict: "Kathmandu", distance: 400, estimatedDuration: 540, popular: false },
    { name: "Butwal → Pokhara", from: "Butwal", to: "Pokhara", fromDistrict: "Rupandehi", toDistrict: "Kaski", distance: 180, estimatedDuration: 300, popular: false },
  ]
  const routes = await Route.create(routesData)
  console.log(`Created ${routes.length} routes`)

  // 6. Vehicles
  const vehiclesData = []
  const vehicleTypes = ["bus", "deluxe-bus", "ac-bus", "hiace", "sumo", "jeep", "ev-bus"]
  const layouts = ["2x2", "2x1", "luxury", "hiace", "sumo"]
  const brands = ["Tata", "Ashok Leyland", "Eicher", "Hyundai", "Toyota", "Mahindra", "BYD"]
  const models = ["Starbus", "Viking", "Comet", "Hiace", "Innova", "Scorpio", "eBus"]

  for (let ci = 0; ci < companies.length; ci++) {
    const c = companies[ci]
    const count = ci < 3 ? 6 : 3
    for (let i = 0; i < count; i++) {
      const typeIdx = i % vehicleTypes.length
      const vt = vehicleTypes[typeIdx]
      const cap = vt === "bus" ? 40 : vt === "deluxe-bus" ? 35 : vt === "ac-bus" ? 32 : vt === "hiace" ? 14 : vt === "sumo" ? 10 : vt === "jeep" ? 8 : 30
      vehiclesData.push({
        company: c._id,
        vehicleNumber: `Ba ${ci + 1} ${String.fromCharCode(65 + i)} ${(1000 + ci * 100 + i).toString().padStart(4, "0")}`,
        type: vt,
        brand: brands[i % brands.length],
        model: models[i % models.length],
        year: 2020 + (i % 5),
        capacity: cap,
        seatLayout: layouts[typeIdx % layouts.length],
        amenities: vt.includes("bus") ? ["WiFi", "AC", "Charging"] : ["Charging"],
        features: { wifi: vt.includes("ac") || vt === "deluxe-bus", ac: vt.includes("ac"), charging: true, blanket: vt === "ac-bus", snacks: vt === "deluxe-bus", toilet: vt.includes("bus"), entertainment: vt === "deluxe-bus" },
        insurance: { provider: "Nepal Insurance", policyNumber: `INS-${ci}${i}001`, expiryDate: new Date("2026-12-31") },
        taxExpiry: new Date("2026-06-30"),
        permitExpiry: new Date("2026-12-31"),
        status: i === count - 1 ? "maintenance" : "active",
        fuelLevel: 70 + Math.floor(Math.random() * 30),
        currentMileage: 10000 + Math.floor(Math.random() * 50000),
        fuelType: vt === "ev-bus" ? "electric" : "diesel",
        mileagePerLiter: vt === "ev-bus" ? 0 : 4 + Math.random() * 3,
        isActive: true,
      })
    }
  }
  const vehicles = await Vehicle.create(vehiclesData)
  console.log(`Created ${vehicles.length} vehicles`)

  // 7. Users (drivers, passengers, counter operators, company admins)
  const driverUsers = [
    { firstName: "Driver", lastName: "Main", email: "driver@sabari.com", phone: "9800000015", password, role: "driver", isActive: true },
  ]
  const passengerUsers = []
  for (let i = 0; i < 15; i++) {
    driverUsers.push({ firstName: ["Ram", "Shyam", "Hari", "Gopal", "Bikash", "Deepak", "Sanjay", "Rajan", "Prakash", "Nabin", "Suresh", "Manoj", "Dipak", "Arun", "Kiran"][i], lastName: ["Sharma", "Thapa", "Poudel", "Rai", "Gurung", "Magar", "Tamang", "Karki", "Adhikari", "KC", "Bhattarai", "Lama", "Shrestha", "Maharjan", "Bhandari"][i], email: `driver${i + 1}@sabari.com`, phone: `980110000${i.toString().padStart(2, "0")}`, password, role: "driver", isActive: true })
  }
  for (let i = 0; i < 10; i++) {
    passengerUsers.push({ firstName: ["Amit", "Priya", "Rahul", "Sita", "Arjun", "Neha", "Vijay", "Anita", "Ravi", "Deepa"][i], lastName: ["Sharma", "Thapa", "Poudel", "Rai", "Gurung", "Magar", "Tamang", "Karki", "Adhikari", "KC"][i], email: `passenger${i + 1}@sabari.com`, phone: `980120000${i.toString().padStart(2, "0")}`, password, role: "passenger", isActive: true })
  }
  const allDriverUsers = await User.create(driverUsers)
  const allPassengerUsers = await User.create(passengerUsers)
  console.log(`Created ${allDriverUsers.length} driver users, ${allPassengerUsers.length} passenger users`)

  // 8. Drivers
  const driversData = []
  for (let i = 0; i < 15; i++) {
    driversData.push({
      user: allDriverUsers[i]._id,
      company: companies[i % companies.length]._id,
      fullName: `${allDriverUsers[i].firstName} ${allDriverUsers[i].lastName}`,
      phone: allDriverUsers[i].phone,
      email: allDriverUsers[i].email,
      licenseNumber: `DL-${1000 + i}`,
      licenseExpiry: new Date("2027-12-31"),
      status: i < 3 ? "on_trip" : i < 6 ? "available" : "offline",
      isActive: true,
    })
  }
  const drivers = await Driver.create(driversData)
  console.log(`Created ${drivers.length} drivers`)

  // 9. Admin + Company Admin + Counter Operator users
  const adminUser = await User.create({ firstName: "Admin", lastName: "User", email: "admin@sabari.com", phone: "9800000001", password, role: "super_admin", isActive: true })
  const companyAdmins = await User.create([
    { firstName: "Sabari", lastName: "Admin", email: "company@sabari.com", phone: "9800000002", password, role: "company_admin", company: companies[0]._id, isActive: true },
    { firstName: "Himalayan", lastName: "Admin", email: "himalayan@sabari.com", phone: "9800000012", password, role: "company_admin", company: companies[1]._id, isActive: true },
    { firstName: "Valley", lastName: "Admin", email: "valley@sabari.com", phone: "9800000013", password, role: "company_admin", company: companies[2]._id, isActive: true },
  ])
  console.log(`Created admin users`)

  // 10. Counters
  const countersData = []
  const counterNames = ["Kathmandu Counter", "Lalitpur Counter", "Bhaktapur Counter", "Pokhara Counter", "Chitwan Counter", "Biratnagar Counter", "Butwal Counter", "Itahari Counter"]
  for (let i = 0; i < counterNames.length; i++) {
    countersData.push({
      company: companies[i % 3]._id,
      name: counterNames[i],
      code: `CTR-${(100 + i).toString()}`,
      address: { district: CITIES[i] || "Kathmandu", municipality: `${CITIES[i]} Municipality`, ward: `${(i + 1).toString()}`, street: "Main Road" },
      phone: `980130000${i}`,
      email: `counter${i + 1}@sabari.com`,
      status: "active",
      isActive: true,
    })
  }
  const counters = await Counter.create(countersData)
  console.log(`Created ${counters.length} counters`)

  // Assign counter operators
  const counterOperators = await User.create([
    { firstName: "Counter", lastName: "Ktm", email: "counter@sabari.com", phone: "9800000003", password, role: "counter_operator", company: companies[0]._id, counter: counters[0]._id, isActive: true },
    { firstName: "Counter", lastName: "PKR", email: "counter2@sabari.com", phone: "9800000014", password, role: "counter_operator", company: companies[1]._id, counter: counters[3]._id, isActive: true },
  ])
  // Assign operators to counters
  counters[0].operators = [counterOperators[0]._id]
  await counters[0].save()
  counters[3].operators = [counterOperators[1]._id]
  await counters[3].save()
  console.log(`Created counter operators`)

  // 11. Schedules
  const schedulesData = []
  const times = ["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
  const fares = [800, 1200, 1500, 600, 1000, 1800, 700, 900, 1100, 1400]
  for (let i = 0; i < routes.length; i++) {
    const v = vehicles[i % vehicles.length]
    const d = drivers[i % drivers.length]
    schedulesData.push({
      company: v.company,
      vehicle: v._id,
      driver: d._id,
      route: routes[i]._id,
      departureTime: times[i % times.length],
      arrivalTime: `${parseInt(times[i % times.length]) + Math.floor(routes[i].estimatedDuration / 60)}:${(routes[i].estimatedDuration % 60).toString().padStart(2, "0")}`,
      frequency: "daily",
      fare: fares[i % fares.length],
      discountedFare: Math.floor(fares[i % fares.length] * 0.85),
      status: "scheduled",
      date: new Date(),
      isActive: true,
    })
  }
  const schedules = await Schedule.create(schedulesData)
  console.log(`Created ${schedules.length} schedules`)

  // 12. Bookings (spread across last 30 days)
  const bookingsData = []
  const paymentMethods = ["esewa", "khalti", "fonepay", "imepay", "connectips", "cash"]
  const statuses = ["confirmed", "completed", "cancelled", "confirmed", "confirmed", "completed"]
  const sources = ["online", "counter", "online", "online", "counter"]
  const names = ["Ram Sharma", "Sita Thapa", "Hari Poudel", "Gopal Rai", "Bikash Gurung", "Deepak Magar", "Sanjay Tamang", "Rajan Karki", "Prakash Adhikari", "Nabin KC", "Amit Shrestha", "Priya Maharjan", "Rahul Bhandari", "Sita Lama", "Arjun Bhattarai"]

  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const jDate = new Date()
    jDate.setDate(jDate.getDate() - daysAgo)
    jDate.setHours(0, 0, 0, 0)

    const sched = schedules[i % schedules.length]
    const pm = paymentMethods[i % paymentMethods.length]
    const st = statuses[i % statuses.length]
    const seats = [`${(i % 4) + 1}${String.fromCharCode(65 + (i % 4))}`]
    const fare = sched.fare
    const commission = Math.floor(fare * 0.05)

    bookingsData.push({
      company: sched.company,
      schedule: sched._id,
      route: sched.route,
      vehicle: sched.vehicle,
      passengers: [{ name: names[i % names.length], phone: `9801${(100000 + i).toString().slice(-6)}`, seatNumber: seats[0], status: "confirmed" }],
      source: sources[i % sources.length],
      counter: sources[i % sources.length] === "counter" ? counters[i % counters.length]._id : undefined,
      totalAmount: fare,
      commission,
      paymentStatus: st === "cancelled" ? "refunded" : "paid",
      paymentMethod: pm,
      bookingStatus: st,
      journeyDate: jDate,
      cancellation: st === "cancelled" ? { cancelledAt: new Date(), reason: "Change of plans", refundAmount: fare, refundStatus: "processed" } : undefined,
      isActive: true,
    })
  }
  const bookings = await Booking.create(bookingsData)
  console.log(`Created ${bookings.length} bookings`)

  // 13. Payments
  const paymentsData = bookings.filter(b => b.paymentStatus === "paid").map(b => ({
    booking: b._id,
    transactionId: `TXN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    amount: b.totalAmount,
    method: b.paymentMethod || "cash",
    status: "success",
    paidAt: b.createdAt || new Date(),
  }))
  if (paymentsData.length > 0) await Payment.create(paymentsData)
  console.log(`Created ${paymentsData.length} payments`)

  // 14. Expenses
  const expensesData = []
  const expenseTypes = ["fuel", "maintenance", "salary", "toll", "parking", "food"]
  for (let i = 0; i < 40; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const eDate = new Date()
    eDate.setDate(eDate.getDate() - daysAgo)
    expensesData.push({
      company: companies[i % companies.length]._id,
      vehicle: vehicles[i % vehicles.length]._id,
      type: expenseTypes[i % expenseTypes.length],
      amount: [2000, 500, 25000, 200, 100, 300][i % expenseTypes.length],
      description: ["Diesel fill-up", "Oil change", "Driver salary", "Toll fee", "Parking fee", "Lunch break"][i % expenseTypes.length],
      date: eDate,
    })
  }
  await Expense.create(expensesData)
  console.log(`Created ${expensesData.length} expenses`)

  // 15. Settings - Payment Gateways
  const gatewaySettings = []
  const gateways = ["esewa", "khalti", "fonepay", "imepay", "connectips"]
  const gatewayNames = ["eSewa", "Khalti", "Fonepay", "IME Pay", "ConnectIPS"]
  for (let i = 0; i < gateways.length; i++) {
    const g = gateways[i]
    gatewaySettings.push(
      { key: `gateway_${g}_merchant_id`, value: `MERCHANT-${gatewayNames[i].toUpperCase()}-${100 + i}`, description: `${gatewayNames[i]} Merchant ID`, category: "payment" },
      { key: `gateway_${g}_secret_key`, value: `sk_live_${g}_key_${Math.random().toString(36).slice(2, 14)}`, description: `${gatewayNames[i]} Secret Key`, category: "payment" },
      { key: `gateway_${g}_merchant_name`, value: "Sabari Travels Pvt. Ltd.", description: `${gatewayNames[i]} Merchant Name`, category: "payment" },
      { key: `gateway_${g}_is_active`, value: i < 3 ? "true" : "false", description: `${gatewayNames[i]} Enabled`, category: "payment" },
    )
  }
  console.log(`Prepared ${gatewaySettings.length} gateway settings`)

  // 16. Settings - SMS
  const smsSettings = [
    { key: "sms_provider", value: "twilio", description: "SMS Gateway Provider", category: "sms" },
    { key: "sms_api_key", value: "sk_twilio_a1b2c3d4e5f6g7h8i9j0", description: "Twilio API Key", category: "sms" },
    { key: "sms_sender_id", value: "SABARI", description: "SMS Sender ID", category: "sms" },
    { key: "sms_is_active", value: "true", description: "SMS Gateway Enabled", category: "sms" },
  ]

  // 17. Settings - Email
  const emailSettings = [
    { key: "email_provider", value: "smtp", description: "Email Provider", category: "email" },
    { key: "email_host", value: "smtp.gmail.com", description: "SMTP Host", category: "email" },
    { key: "email_port", value: "587", description: "SMTP Port", category: "email" },
    { key: "email_user", value: "noreply@sabari.com", description: "Email Username", category: "email" },
    { key: "email_pass", value: "app_password_placeholder", description: "Email Password", category: "email" },
    { key: "email_from", value: "Sabari <noreply@sabari.com>", description: "From Address", category: "email" },
    { key: "email_is_active", value: "true", description: "Email Service Enabled", category: "email" },
  ]

  // 18. Settings - General / System
  const generalSettings = [
    { key: "site_name", value: "Sabari", description: "Platform Name", category: "general" },
    { key: "site_url", value: "https://sabari.com", description: "Platform URL", category: "general" },
    { key: "support_phone", value: "9800000000", description: "Support Phone", category: "general" },
    { key: "support_email", value: "support@sabari.com", description: "Support Email", category: "general" },
    { key: "currency", value: "NPR", description: "Currency", category: "general" },
    { key: "timezone", value: "Asia/Kathmandu", description: "Timezone", category: "general" },
  ]

  // 19. Settings - Booking
  const bookingSettings = [
    { key: "booking_advance_days", value: "30", description: "Max days in advance for booking", category: "booking" },
    { key: "booking_cancellation_hours", value: "2", description: "Hours before departure for free cancellation", category: "booking" },
    { key: "booking_auto_cancel_minutes", value: "15", description: "Minutes to auto-cancel unpaid bookings", category: "booking" },
  ]

  // 20. Settings - Commission
  const commissionSettings = [
    { key: "platform_commission_rate", value: "5", description: "Default Platform Commission Rate (%)", category: "commission" },
    { key: "counter_commission_rate", value: "3", description: "Counter Operator Commission Rate (%)", category: "commission" },
  ]

  const allSettings = [...gatewaySettings, ...smsSettings, ...emailSettings, ...generalSettings, ...bookingSettings, ...commissionSettings]
  await Setting.create(allSettings)
  console.log(`Created ${allSettings.length} settings`)

  // 21. Ticket Commissions
  const commissions = await TicketCommission.create([
    { name: "Platform Fee", type: "percentage", value: 5, appliesTo: "all", isActive: true },
    { name: "Counter Commission", type: "percentage", value: 3, appliesTo: "all", isActive: true },
    { name: "Online Booking Bonus", type: "fixed", value: 50, appliesTo: "all", isActive: true },
    { name: "Premium Route Fee", type: "percentage", value: 8, appliesTo: "route", isActive: true },
    { name: "Deluxe Bus Surcharge", type: "fixed", value: 100, appliesTo: "vehicle_type", isActive: true },
  ])
  console.log(`Created ${commissions.length} ticket commissions`)

  // 22. Trips
  const tripsData = []
  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 15)
    const tDate = new Date()
    tDate.setDate(tDate.getDate() - daysAgo)
    const v = vehicles[i % vehicles.length]
    const d = drivers[i % drivers.length]
    tripsData.push({
      company: v.company,
      vehicle: v._id,
      driver: d._id,
      schedule: schedules[i % schedules.length]._id,
      route: routes[i % routes.length]._id,
      date: tDate,
      startTime: new Date(tDate.getTime() + 6 * 3600000),
      endTime: new Date(tDate.getTime() + 12 * 3600000),
      status: i < 20 ? "completed" : "scheduled",
      passengerCount: Math.floor(Math.random() * 35) + 5,
      delay: Math.floor(Math.random() * 30),
    })
  }
  const trips = await Trip.create(tripsData)
  console.log(`Created ${trips.length} trips`)

  // 23. GPS Logs
  const gpsData = []
  const ktmLat = 27.7172
  const ktmLng = 85.3240
  for (let i = 0; i < 50; i++) {
    const v = vehicles[i % vehicles.length]
    const d = drivers[i % drivers.length]
    gpsData.push({
      driver: d._id,
      vehicle: v._id,
      company: v.company,
      trip: trips[i % trips.length]._id,
      latitude: ktmLat + (Math.random() - 0.5) * 0.5,
      longitude: ktmLng + (Math.random() - 0.5) * 0.5,
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 80),
      battery: 30 + Math.floor(Math.random() * 70),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
    })
  }
  await GPSLog.create(gpsData)
  console.log(`Created ${gpsData.length} GPS logs`)

  // 24. Vehicle Logs
  const vLogsData = []
  const logTypes = ["fuel", "service", "mileage", "repair", "inspection"]
  for (let i = 0; i < 25; i++) {
    const v = vehicles[i % vehicles.length]
    vLogsData.push({
      vehicle: v._id,
      company: v.company,
      type: logTypes[i % logTypes.length],
      amount: [3000, 5000, 0, 8000, 0][i % logTypes.length],
      quantity: [40, 1, 0, 1, 0][i % logTypes.length],
      mileage: v.currentMileage + Math.floor(Math.random() * 1000),
      description: ["Refill diesel", "Routine service", "Odometer check", "Brake pad replacement", "Annual inspection"][i % logTypes.length],
      odometerReading: 20000 + i * 1500,
      vendor: ["NOC", "Authorized Workshop", "", "AutoCare", "DOTM"][i % logTypes.length],
      performedAt: new Date(Date.now() - i * 86400000 * 2),
    })
  }
  await VehicleLog.create(vLogsData)
  console.log(`Created ${vLogsData.length} vehicle logs`)

  // 25. Attendance
  const attendanceData = []
  for (let i = 0; i < 20; i++) {
    const dDate = new Date()
    dDate.setDate(dDate.getDate() - i)
    const u = allDriverUsers[i % allDriverUsers.length]
    attendanceData.push({
      user: u._id,
      company: companies[0]._id,
      role: "driver",
      date: dDate,
      clockIn: new Date(dDate.getTime() + 6 * 3600000 + Math.random() * 1800000),
      clockOut: new Date(dDate.getTime() + 14 * 3600000 + Math.random() * 3600000),
      status: Math.random() > 0.2 ? "present" : "late",
      workDuration: 7 + Math.floor(Math.random() * 3),
    })
  }
  await Attendance.create(attendanceData)
  console.log(`Created ${attendanceData.length} attendance records`)

  // 26. Audit Logs
  const auditData = []
  const actions = ["login", "booking_created", "booking_cancelled", "payment_initiated", "2fa_enabled", "user_registered", "settings_updated"]
  const resources = ["auth", "booking", "booking", "payment", "2fa", "user", "setting"]
  for (let i = 0; i < 25; i++) {
    auditData.push({
      user: [adminUser._id, companyAdmins[0]._id, counterOperators[0]._id, ...allPassengerUsers.map(u => u._id)][i % (3 + allPassengerUsers.length)],
      action: actions[i % actions.length],
      resource: resources[i % resources.length],
      details: { ip: `192.168.1.${10 + i}`, timestamp: new Date(Date.now() - i * 3600000) },
      ip: `192.168.1.${10 + i}`,
    })
  }
  await AuditLog.create(auditData)
  console.log(`Created ${auditData.length} audit logs`)

  await mongoose.disconnect()
  console.log("\n=== Seed complete! ===")
  console.log("Login credentials (all passwords: password):")
  console.log("  admin@sabari.com          → super_admin")
  console.log("  company@sabari.com        → company_admin (Sabari Travels)")
  console.log("  himalayan@sabari.com      → company_admin (Himalayan Express)")
  console.log("  valley@sabari.com         → company_admin (Valley Transport)")
  console.log("  counter@sabari.com        → counter_operator (Kathmandu)")
  console.log("  counter2@sabari.com       → counter_operator (Pokhara)")
  console.log("  driver1@sabari.com        → driver")
  console.log("  passenger1@sabari.com     → passenger")
  console.log(`\nData created:`)
  console.log(`  ${districts.length} districts, ${muniCount} municipalities`)
  console.log(`  ${plans.length} subscription plans`)
  console.log(`  ${companies.length} companies`)
  console.log(`  ${routes.length} routes`)
  console.log(`  ${vehicles.length} vehicles`)
  console.log(`  ${drivers.length} drivers`)
  console.log(`  ${counters.length} counters`)
  console.log(`  ${schedules.length} schedules`)
  console.log(`  ${bookings.length} bookings`)
  console.log(`  ${paymentsData.length} payments`)
  console.log(`  ${expensesData.length} expenses`)
  console.log(`  ${allSettings.length} settings`)
  console.log(`  ${commissions.length} ticket commissions`)
  console.log(`  ${trips.length} trips`)
  console.log(`  ${gpsData.length} GPS logs`)
  console.log(`  ${vLogsData.length} vehicle logs`)
  console.log(`  ${attendanceData.length} attendance records`)
  console.log(`  ${auditData.length} audit logs`)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
