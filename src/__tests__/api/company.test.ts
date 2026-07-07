import { describe, it, expect, beforeAll } from "vitest"
import { GET as dashboardHandler } from "@/app/api/company/dashboard/route"
import { GET as vehiclesList, POST as vehiclesCreate } from "@/app/api/company/vehicles/route"
import { GET as driversList, POST as driversCreate } from "@/app/api/company/drivers/route"
import {
  createTestUser, createTestVehicle, createTestDriver,
  authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Company API", () => {
  let testUser: any, testToken: string, companyId: string

  beforeAll(async () => {
    const data = await createTestUser()
    testUser = data.user
    testToken = data.token
    companyId = data.company._id.toString()
  })

  describe("GET /api/company/dashboard", () => {
    it("returns dashboard stats", async () => {
      const req = mockNextRequest("/api/company/dashboard", {
        headers: { ...authHeader(testToken) },
      })
      const res = await dashboardHandler(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.totalVehicles).toBeDefined()
      expect(body.totalDrivers).toBeDefined()
      expect(body.todayRevenue).toBeDefined()
    })
  })

  describe("Vehicles", () => {
    it("creates a vehicle", async () => {
      const req = mockNextRequest("/api/company/vehicles", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          vehicleNumber: "BA 1 JA 5678",
          type: "hiace",
          capacity: 15,
        }),
      })
      const res = await vehiclesCreate(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.vehicle).toBeDefined()
    })

    it("lists vehicles", async () => {
      const req = mockNextRequest("/api/company/vehicles", {
        headers: { ...authHeader(testToken) },
      })
      const res = await vehiclesList(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.vehicles)).toBe(true)
    })
  })

  describe("Drivers", () => {
    it("creates a driver", async () => {
      const req = mockNextRequest("/api/company/drivers", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          fullName: "New Driver",
          phone: "9800000050",
          licenseNumber: "LIC-99999",
        }),
      })
      const res = await driversCreate(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.driver).toBeDefined()
    })

    it("lists drivers", async () => {
      const req = mockNextRequest("/api/company/drivers", {
        headers: { ...authHeader(testToken) },
      })
      const res = await driversList(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.drivers)).toBe(true)
    })
  })
})
