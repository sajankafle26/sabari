import { describe, it, expect, beforeAll } from "vitest"
import { GET, POST } from "@/app/api/parcels/route"
import { GET as trackParcel } from "@/app/api/parcels/track/[trackingId]/route"
import {
  createTestUser, createTestRoute, createTestParcel,
  authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Parcels API", () => {
  let testUser: any, testToken: string, companyId: string, routeId: string

  beforeAll(async () => {
    const data = await createTestUser()
    testUser = data.user
    testToken = data.token
    companyId = data.company._id.toString()
    const route = await createTestRoute(companyId)
    routeId = route._id.toString()
  })

  describe("POST /api/parcels", () => {
    it("creates a parcel", async () => {
      const req = mockNextRequest("/api/parcels", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          company: companyId,
          route: routeId,
          sender: { name: "Sender A", phone: "9800000030", address: "Ktm" },
          receiver: { name: "Receiver B", phone: "9800000031", address: "Pkr" },
          description: "Documents",
          weight: 2.0,
          amount: 500,
        }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.parcel).toBeDefined()
      expect(body.parcel.trackingId).toBeDefined()
    })
  })

  describe("GET /api/parcels", () => {
    beforeAll(async () => {
      await createTestParcel(companyId, routeId)
    })

    it("lists parcels with pagination", async () => {
      const req = mockNextRequest("/api/parcels", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.parcels)).toBe(true)
      expect(body.total).toBeDefined()
      expect(body.page).toBe(1)
    })

    it("filters by status", async () => {
      const req = mockNextRequest("/api/parcels?status=pending", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      body.parcels.forEach((p: any) => {
        expect(p.status).toBe("pending")
      })
    })
  })

  describe("GET /api/parcels/track/:trackingId", () => {
    it("tracks a parcel by tracking ID (public)", async () => {
      const parcel = await createTestParcel(companyId, routeId)
      const req = mockNextRequest(`/api/parcels/track/${parcel.trackingId}`)
      const res = await trackParcel(req, { params: Promise.resolve({ trackingId: parcel.trackingId }) })
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.parcel.trackingId).toBe(parcel.trackingId)
    })

    it("returns 404 for unknown tracking ID", async () => {
      const req = mockNextRequest("/api/parcels/track/INVALID")
      const res = await trackParcel(req, { params: Promise.resolve({ trackingId: "INVALID" }) })
      expect(res.status).toBe(404)
    })
  })
})
