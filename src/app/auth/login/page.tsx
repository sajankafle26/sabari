"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bus, Eye, EyeOff, LogIn, ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/context/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login, verify2FA, getDashboardUrl } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("admin@sabari.com")
  const [password, setPassword] = useState("password")

  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpMessage, setOtpMessage] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await login(email, password)
    setLoading(false)
    if (result.success && result.requires2FA && result.pendingToken) {
      setPendingToken(result.pendingToken)
      setOtpMessage(result.message || "Verification code sent to your phone")
      return
    }
    if (result.success) {
      router.push(getDashboardUrl(result.user))
    } else {
      setError(result.message || "Login failed")
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingToken) return
    setOtpLoading(true)
    setError("")
    const result = await verify2FA(pendingToken, otp)
    setOtpLoading(false)
    if (result.success) {
      router.push(getDashboardUrl(result.user))
    } else {
      setError(result.message || "Verification failed")
    }
  }

  if (pendingToken) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25 mb-4">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">Two-Factor Auth</h1>
            <p className="text-zinc-500 mt-1">{otpMessage}</p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 space-y-4">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
              />
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <Button type="submit" size="lg" className="w-full" loading={otpLoading}>
                <ShieldCheck className="h-4 w-4" />
                Verify & Sign In
              </Button>
            </form>
            <button
              onClick={() => setPendingToken(null)}
              className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 transition-colors w-full pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25 mb-4">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900">Welcome back</h1>
          <p className="text-zinc-500 mt-1">Sign in to your Sabari account</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-500 cursor-pointer hover:text-zinc-700 transition-colors">
                <input type="checkbox" className="rounded border-zinc-300 bg-zinc-50 text-violet-600 focus:ring-violet-500" />
                Remember me
              </label>
              <Link href="#" className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-violet-600 hover:text-violet-700 font-medium transition-colors">
                Register
              </Link>
            </p>
          </div>

          <div className="pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 text-center mb-3 uppercase tracking-wider font-medium">Demo Credentials</p>
            <div className="rounded-lg border border-zinc-200 overflow-hidden text-xs">
              <div className="grid grid-cols-3 bg-zinc-50 px-3 py-1.5 font-medium text-zinc-500">
                <span>Role</span><span>Email</span><span className="text-right">Password</span>
              </div>
              {[
                { role: "Admin", email: "admin@sabari.com", color: "text-purple-600" },
                { role: "Company", email: "company@sabari.com", color: "text-blue-600" },
                { role: "Counter", email: "counter@sabari.com", color: "text-cyan-600" },
                { role: "Driver", email: "driver@sabari.com", color: "text-green-600" },
                { role: "Passenger", email: "passenger@sabari.com", color: "text-amber-600" },
              ].map((d, i) => (
                <div key={d.role} className={`grid grid-cols-3 px-3 py-1.5 items-center ${i < 4 ? "border-t border-zinc-100" : ""}`}>
                  <span className={`${d.color} font-semibold`}>{d.role}</span>
                  <span className="text-zinc-600">{d.email}</span>
                  <span className="text-zinc-400 text-right">password</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
