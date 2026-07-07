import { describe, it, expect, beforeAll } from "vitest"
import { POST as loginHandler } from "@/app/api/auth/login/route"
import { GET as meHandler } from "@/app/api/auth/me/route"
import { POST as registerHandler } from "@/app/api/auth/register/route"
import { User } from "@/lib/models"
import { createTestUser, authHeader, mockNextRequest } from "../helpers/seed"

describe("Auth API", () => {
  let testUser: any, testToken: string

  beforeAll(async () => {
    const data = await createTestUser({ email: "auth-test@example.com" })
    testUser = data.user
    testToken = data.token
  })

  describe("POST /api/auth/register", () => {
    it("registers a new passenger", async () => {
      const req = mockNextRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: "New",
          lastName: "User",
          email: "new@example.com",
          phone: "9800000100",
          password: "password123",
        }),
      })
      const res = await registerHandler(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.message).toBe("Registration successful")
    })

    it("rejects duplicate email", async () => {
      const req = mockNextRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Dup",
          lastName: "User",
          email: "new@example.com",
          phone: "9800000101",
          password: "password123",
        }),
      })
      const res = await registerHandler(req)
      expect(res.status).toBe(409)
    })
  })

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const req = mockNextRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "auth-test@example.com", password: "password123" }),
      })
      const res = await loginHandler(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.token).toBeDefined()
      expect(body.user).toBeDefined()
    })

    it("rejects invalid password", async () => {
      const req = mockNextRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "auth-test@example.com", password: "wrongpassword" }),
      })
      const res = await loginHandler(req)
      expect(res.status).toBe(401)
    })

    it("rejects missing fields", async () => {
      const req = mockNextRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "auth-test@example.com" }),
      })
      const res = await loginHandler(req)
      expect(res.status).toBe(400)
    })
  })

  describe("GET /api/auth/me", () => {
    it("returns current user profile", async () => {
      const req = mockNextRequest("/api/auth/me", {
        headers: { ...authHeader(testToken) },
      })
      const res = await meHandler(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.user.email).toBe("auth-test@example.com")
    })

    it("rejects without auth", async () => {
      const req = mockNextRequest("/api/auth/me")
      const res = await meHandler(req)
      expect(res.status).toBe(401)
    })
  })
})
