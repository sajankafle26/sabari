"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

interface User {
  _id: string
  firstName?: string
  lastName?: string
  email: string
  role: "super_admin" | "company_admin" | "counter_operator" | "driver" | "passenger"
  phone?: string
  company?: string
  counter?: string
  isActive?: boolean
  twoFactorEnabled?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; pendingToken?: string; message?: string; user?: User }>
  verify2FA: (pendingToken: string, code: string) => Promise<{ success: boolean; message?: string; user?: User }>
  logout: () => void
  getDashboardUrl: (overrideUser?: User | null) => string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  verify2FA: async () => ({ success: false }),
  logout: () => {},
  getDashboardUrl: () => "/dashboard",
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sabari_user")
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem("sabari_user")
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await axios.post("/api/auth/login", { email, password })
      if (data.requires2FA) {
        return { success: true, requires2FA: true, pendingToken: data.pendingToken, message: data.message }
      }
      localStorage.setItem("sabari_token", data.token)
      localStorage.setItem("sabari_user", JSON.stringify(data.user))
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Login failed" }
    }
  }, [])

  const verify2FA = useCallback(async (pendingToken: string, code: string) => {
    try {
      const { data } = await axios.post("/api/auth/2fa/verify-login", { pendingToken, code })
      localStorage.setItem("sabari_token", data.token)
      localStorage.setItem("sabari_user", JSON.stringify(data.user))
      setUser(data.user)
      return { success: true, user: data.user }
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || "Verification failed" }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("sabari_token")
    localStorage.removeItem("sabari_user")
    setUser(null)
    router.push("/auth/login")
  }, [router])

  const getDashboardUrl = useCallback((overrideUser?: User | null) => {
    const u = overrideUser ?? user
    if (!u) return "/auth/login"
    switch (u.role) {
      case "super_admin": return "/admin"
      case "company_admin": return "/company"
      case "counter_operator": return "/counter"
      case "driver": return "/dashboard"
      default: return "/my-bookings"
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, logout, getDashboardUrl }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
