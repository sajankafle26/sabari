import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import {
  User, Company, Vehicle, Driver, Route, Schedule, Booking, Parcel,
  Payment, Notification, Expense, Counter, Trip,
} from "@/lib/models"

const JWT_SECRET = "test-jwt-secret"

export async function createTestCompany() {
  return Company.create({
    name: "Test Travels",
    registrationNumber: "REG-001",
    email: "test@company.com",
    phone: "9800000000",
    address: "Kathmandu",
    isActive: true,
  })
}

export async function createTestUser(overrides: Record<string, any> = {}) {
  const company = await createTestCompany()
  const user = await User.create({
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "9800000001",
    password: "password123",
    role: "company_admin",
    company: company._id,
    isActive: true,
    ...overrides,
  })
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
  return { user, company, token }
}

export async function createTestCounterOperator(companyId: string) {
  const counter = await Counter.create({
    name: "Test Counter",
    company: companyId,
    phone: "9800000002",
    address: "Kathmandu",
    isActive: true,
  })
  const user = await User.create({
    firstName: "Counter",
    lastName: "Op",
    email: "counter@example.com",
    phone: "9800000003",
    password: "password123",
    role: "counter_operator",
    company: companyId,
    counter: counter._id,
    isActive: true,
  })
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role, counter: counter._id },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
  return { user, counter, token }
}

export async function createTestSuperAdmin() {
  const user = await User.create({
    firstName: "Super",
    lastName: "Admin",
    email: "admin@example.com",
    phone: "9800000099",
    password: "password123",
    role: "super_admin",
    isActive: true,
  })
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  )
  return { user, token }
}

export async function createTestVehicle(companyId: string) {
  return Vehicle.create({
    company: companyId,
    vehicleNumber: "BA 1 JA 1234",
    type: "bus",
    capacity: 40,
    status: "active",
  })
}

export async function createTestDriver(companyId: string) {
  return Driver.create({
    company: companyId,
    fullName: "Test Driver",
    phone: "9800000010",
    licenseNumber: "LIC-12345",
    status: "available",
  })
}

export async function createTestRoute(companyId: string) {
  return Route.create({
    company: companyId,
    name: "Kathmandu → Pokhara",
    from: "Kathmandu",
    to: "Pokhara",
    distance: 200,
    estimatedDuration: 8,
    isActive: true,
  })
}

export async function createTestSchedule(companyId: string, routeId: string, vehicleId: string) {
  return Schedule.create({
    company: companyId,
    route: routeId,
    vehicle: vehicleId,
    departureTime: "06:00",
    arrivalTime: "14:00",
    fare: 1000,
    date: new Date(),
    status: "scheduled",
  })
}

let bookingCounter = 0

export async function createTestBooking(companyId: string, scheduleId: string, vehicleId: string, routeId: string, overrides: Record<string, any> = {}) {
  bookingCounter++
  return Booking.create({
    company: companyId,
    schedule: scheduleId,
    vehicle: vehicleId,
    route: routeId,
    bookingId: `BK-TEST-${String(bookingCounter).padStart(3, "0")}`,
    passengers: [{ name: "Passenger One", email: "p1@test.com", phone: "9800000020", seatNumber: "1A" }],
    journeyDate: new Date(),
    totalAmount: 1000,
    bookedBy: new mongoose.Types.ObjectId(),
    source: "online",
    paymentMethod: "esewa",
    bookingStatus: "confirmed",
    paymentStatus: "paid",
    ...overrides,
  })
}

export async function createTestParcel(companyId: string, routeId: string) {
  return Parcel.create({
    company: companyId,
    route: routeId,
    trackingId: `PRC-TEST-${Date.now()}${Math.floor(Math.random() * 1000)}`,
    sender: { name: "Sender", phone: "9800000030", address: "Ktm" },
    receiver: { name: "Receiver", phone: "9800000031", address: "Pkr" },
    description: "Documents",
    weight: 1.5,
    amount: 500,
    status: "pending",
    createdBy: new mongoose.Types.ObjectId(),
    statusHistory: [{ status: "pending", timestamp: new Date(), updatedBy: new mongoose.Types.ObjectId(), note: "Created" }],
  })
}

export async function createTestExpense(companyId: string, overrides: Record<string, any> = {}) {
  return Expense.create({
    company: companyId,
    type: "fuel",
    amount: 5000,
    description: "Diesel for trip",
    date: new Date(),
    ...overrides,
  })
}

export async function createTestPayment(bookingId: string) {
  return Payment.create({
    booking: bookingId,
    amount: 1000,
    gateway: "esewa",
    status: "paid",
    transactionRef: "TXN-001",
  })
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

export function mockNextRequest(url: string, options: RequestInit = {}): Request {
  return new Request(`http://localhost:3000${url}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })
}
