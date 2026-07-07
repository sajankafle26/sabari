"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push("/auth/login")
    }, 1500)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600 mb-4">
            <Bus className="h-7 w-7 text-zinc-900" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Create an account</h1>
          <p className="text-zinc-500 mt-1">Join Sabari for seamless travel booking</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" placeholder="John" />
                <Input label="Last Name" placeholder="Doe" />
              </div>
              <Input label="Email" type="email" placeholder="you@example.com" />
              <Input label="Phone" type="tel" placeholder="98XXXXXXXX" />
              <Input label="Password" type="password" placeholder="Create a password" />
              <Input label="Confirm Password" type="password" placeholder="Confirm your password" />

              <label className="flex items-start gap-2 text-sm text-zinc-500">
                <input type="checkbox" className="mt-0.5 rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500" />
                <span>I agree to the{" "}<Link href="#" className="text-violet-600">Terms of Service</Link>{" "}and{" "}<Link href="#" className="text-violet-600">Privacy Policy</Link></span>
              </label>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                <UserPlus className="h-4 w-4" />
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-violet-600 hover:text-violet-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
