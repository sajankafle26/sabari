import { describe, it, expect, beforeAll } from "vitest"
import { GET, POST } from "@/app/api/notifications/route"
import { GET as unreadCount } from "@/app/api/notifications/unread-count/route"
import { PUT as markRead } from "@/app/api/notifications/[id]/read/route"
import { Notification } from "@/lib/models"
import {
  createTestUser, authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Notifications API", () => {
  let testUser: any, testToken: string

  beforeAll(async () => {
    const data = await createTestUser()
    testUser = data.user
    testToken = data.token
  })

  describe("GET /api/notifications", () => {
    beforeAll(async () => {
      await Notification.create({
        recipient: testUser._id,
        title: "Test Notification",
        message: "This is a test",
        type: "system",
      })
    })

    it("lists notifications for authenticated user", async () => {
      const req = mockNextRequest("/api/notifications", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.notifications)).toBe(true)
      expect(body.unreadCount).toBeGreaterThanOrEqual(1)
    })

    it("filters unread only", async () => {
      const req = mockNextRequest("/api/notifications?unread=true", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      body.notifications.forEach((n: any) => {
        expect(n.read).toBe(false)
      })
    })
  })

  describe("GET /api/notifications/unread-count", () => {
    it("returns unread count", async () => {
      const req = mockNextRequest("/api/notifications/unread-count", {
        headers: { ...authHeader(testToken) },
      })
      const res = await unreadCount(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(typeof body.count).toBe("number")
    })
  })

  describe("POST /api/notifications", () => {
    it("creates and sends a notification", async () => {
      const req = mockNextRequest("/api/notifications", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          title: "Manual Send",
          message: "Sent via API",
          type: "system",
        }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.result).toBeDefined()
    })
  })

  describe("PUT /api/notifications/:id/read", () => {
    it("marks a notification as read", async () => {
      const notif = await Notification.create({
        recipient: testUser._id,
        title: "Read Me",
        message: "Will be marked read",
        type: "system",
      })

      const req = mockNextRequest(`/api/notifications/${notif._id}/read`, {
        method: "PUT",
        headers: { ...authHeader(testToken) },
      })
      const res = await markRead(req, { params: Promise.resolve({ id: notif._id.toString() }) })
      expect(res.status).toBe(200)

      const updated = await Notification.findById(notif._id)
      expect(updated.read).toBe(true)
    })
  })
})
