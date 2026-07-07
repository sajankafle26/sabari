import { describe, it, expect, beforeAll } from "vitest"
import { GET as methodsHandler } from "@/app/api/payments/methods/route"
import { POST as initiateHandler } from "@/app/api/payments/initiate/route"
import {
  createTestUser, createTestBooking, createTestVehicle, createTestRoute,
  createTestSchedule, authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Payments API", () => {
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

  describe("GET /api/payments/methods", () => {
    it("returns available payment methods", async () => {
      const req = mockNextRequest("/api/payments/methods")
      const res = await methodsHandler(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.methods)).toBe(true)
      expect(body.methods.length).toBeGreaterThanOrEqual(5)
    })
  })

  describe("POST /api/payments/initiate", () => {
    it("initiates a payment with esewa", async () => {
      const booking = await createTestBooking(companyId, scheduleId, vehicleId, routeId)

      const req = mockNextRequest("/api/payments/initiate", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          bookingId: booking._id.toString(),
          gateway: "esewa",
          amount: 1000,
        }),
      })
      const res = await initiateHandler(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.transactionId).toBeDefined()
    })

    it("rejects missing fields", async () => {
      const req = mockNextRequest("/api/payments/initiate", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({ gateway: "esewa" }),
      })
      const res = await initiateHandler(req)
      expect(res.status).toBe(400)
    })
  })
})
