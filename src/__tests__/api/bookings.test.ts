import { describe, it, expect, beforeAll } from "vitest"
import { GET, POST } from "@/app/api/bookings/route"
import { Booking } from "@/lib/models"
import {
  createTestUser, createTestVehicle, createTestRoute, createTestSchedule,
  createTestBooking, authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Bookings API", () => {
  let testUser: any, testToken: string, companyId: string
  let vehicleId: string, routeId: string, scheduleId: string

  beforeAll(async () => {
    const data = await createTestUser()
    testUser = data.user
    testToken = data.token
    companyId = data.company._id.toString()

    const vehicle = await createTestVehicle(companyId)
    vehicleId = vehicle._id.toString()

    const route = await createTestRoute(companyId)
    routeId = route._id.toString()

    const schedule = await createTestSchedule(companyId, routeId, vehicleId)
    scheduleId = schedule._id.toString()
  })

  describe("POST /api/bookings", () => {
    it("creates a booking", async () => {
      const req = mockNextRequest("/api/bookings", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          schedule: scheduleId,
          route: routeId,
          vehicle: vehicleId,
          passengers: [{ name: "Passenger One", email: "p1@test.com", phone: "9800000020", seatNumber: "1A" }],
          journeyDate: new Date().toISOString(),
          totalAmount: 1000,
          paymentMethod: "esewa",
        }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.booking).toBeDefined()
      expect(body.booking.totalAmount).toBe(1000)
    })

    it("rejects without auth", async () => {
      const req = mockNextRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ schedule: scheduleId }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })

  describe("GET /api/bookings", () => {
    beforeAll(async () => {
      await createTestBooking(companyId, scheduleId, vehicleId, routeId)
    })

    it("lists bookings for company admin", async () => {
      const req = mockNextRequest("/api/bookings", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.bookings.length).toBeGreaterThanOrEqual(1)
    })

    it("filters by status", async () => {
      const req = mockNextRequest("/api/bookings?status=confirmed", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      body.bookings.forEach((b: any) => {
        expect(b.bookingStatus).toBe("confirmed")
      })
    })
  })
})
