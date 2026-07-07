import { describe, it, expect, beforeAll } from "vitest"
import { GET, POST } from "@/app/api/company/expenses/route"
import { DELETE as deleteExpense } from "@/app/api/company/expenses/[id]/route"
import {
  createTestUser, createTestExpense, authHeader, mockNextRequest,
} from "../helpers/seed"

describe("Expenses API", () => {
  let testUser: any, testToken: string, companyId: string

  beforeAll(async () => {
    const data = await createTestUser()
    testUser = data.user
    testToken = data.token
    companyId = data.company._id.toString()
  })

  describe("POST /api/company/expenses", () => {
    it("creates an expense", async () => {
      const req = mockNextRequest("/api/company/expenses", {
        method: "POST",
        headers: { ...authHeader(testToken) },
        body: JSON.stringify({
          type: "fuel",
          amount: 5000,
          description: "Diesel",
          date: new Date().toISOString(),
        }),
      })
      const res = await POST(req)
      const body = await res.json()
      expect(res.status).toBe(201)
      expect(body.expense).toBeDefined()
      expect(body.expense.amount).toBe(5000)
    })
  })

  describe("GET /api/company/expenses", () => {
    beforeAll(async () => {
      await createTestExpense(companyId, { amount: 3000, type: "maintenance" })
    })

    it("lists expenses with summary", async () => {
      const req = mockNextRequest("/api/company/expenses", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(Array.isArray(body.expenses)).toBe(true)
      expect(body.summary).toBeDefined()
      expect(body.total).toBeDefined()
    })

    it("filters by category", async () => {
      const req = mockNextRequest("/api/company/expenses?type=fuel", {
        headers: { ...authHeader(testToken) },
      })
      const res = await GET(req)
      const body = await res.json()
      expect(res.status).toBe(200)
      body.expenses.forEach((e: any) => {
        expect(e.type).toBe("fuel")
      })
    })
  })

  describe("DELETE /api/company/expenses/:id", () => {
    it("deletes an expense", async () => {
      const expense = await createTestExpense(companyId)
      const req = mockNextRequest(`/api/company/expenses/${expense._id}`, {
        method: "DELETE",
        headers: { ...authHeader(testToken) },
      })
      const res = await deleteExpense(req, { params: Promise.resolve({ id: expense._id.toString() }) })
      expect(res.status).toBe(200)
    })
  })
})
