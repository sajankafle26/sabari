import { describe, it, expect, beforeAll } from "vitest"
import { POST as cancelHandler } from "@/app/api/bookings/[id]/cancel/route"
import { GET as refundsList } from "@/app/api/admin/refunds/route"
import { POST as refundProcess } from "@/app/api/admin/refunds/process/route"
import { Booking } from "@/lib/models"
import {
  createTestUser, createTestVehicle, createTestRoute, createTestSchedule,
  createTestBooking, createTestSuperAdmin, authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Refunds API", () => {
  let adminUser: any, adminToken: string
  let companyUser: any, companyToken: string, companyId: string
  let vehicleId: string, routeId: string, scheduleId: string

  beforeAll(async () => {
    const companyData = await createTestUser()
    companyUser = companyData.user
    companyToken = companyData.token
    companyId = companyData.company._id.toString()

    const superData = await createTestSuperAdmin()
    adminUser = superData.user
    adminToken = superData.token

    const vehicle = await createTestVehicle(companyId)
    vehicleId = vehicle._id.toString()
    const route = await createTestRoute(companyId)
    routeId = route._id.toString()
    const schedule = await createTestSchedule(companyId, routeId, vehicleId)
    scheduleId = schedule._id.toString()
  })

  describe("POST /api/bookings/:id/cancel", () => {
    it("cancels a booking with refund calculation", async () => {
      const booking = await createTestBooking(companyId, scheduleId, vehicleId, routeId, {
        journeyDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days later
      })

      const req = mockNextRequest(`/api/bookings/${booking._id}/cancel`, {
        method: "POST",
        headers: { ...authHeader(companyToken) },
        body: JSON.stringify({ reason: "Changed plans" }),
      })
      const res = await cancelHandler(req, { params: Promise.resolve({ id: booking._id.toString() }) })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.refundAmount).toBe(1000)
      expect(body.refundPercentage).toBe(100)
    })
  })

  describe("GET /api/admin/refunds", () => {
    it("lists refunds for super admin", async () => {
      const req = mockNextRequest("/api/admin/refunds", {
        headers: { ...authHeader(adminToken) },
      })
      const res = await refundsList(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.refunds)).toBe(true)
    })
  })

  describe("POST /api/admin/refunds/process", () => {
    it("processes a refund for a cancelled booking", async () => {
      const booking = await createTestBooking(companyId, scheduleId, vehicleId, routeId, {
        bookingStatus: "cancelled",
        cancellation: {
          reason: "Customer request",
          cancelledAt: new Date(),
          cancelledBy: companyUser._id,
          refundAmount: 900,
          refundStatus: "pending",
        },
      })

      const req = mockNextRequest("/api/admin/refunds/process", {
        method: "POST",
        headers: { ...authHeader(adminToken) },
        body: JSON.stringify({ bookingId: booking._id.toString(), amount: 900 }),
      })
      const res = await refundProcess(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.message).toContain("processed")
    })
  })
})
