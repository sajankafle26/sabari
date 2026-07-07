"use client"

import { useState, useEffect } from "react"
import { Save, Send, Eye, EyeOff, Mail } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"

const emailFieldKeys = {
  host: "email_host",
  port: "email_port",
  username: "email_username",
  password: "email_password",
  fromAddress: "email_from_address",
  fromName: "email_from_name",
  isActive: "email_is_active",
}

export default function EmailPage() {
  const [host, setHost] = useState("")
  const [port, setPort] = useState("587")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [fromAddress, setFromAddress] = useState("")
  const [fromName, setFromName] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/api/admin/settings")
      const raw: Record<string, string> = data.data ?? data
      setHost(raw[emailFieldKeys.host] ?? "")
      setPort(raw[emailFieldKeys.port] ?? "587")
      setUsername(raw[emailFieldKeys.username] ?? "")
      setPassword(raw[emailFieldKeys.password] ?? "")
      setFromAddress(raw[emailFieldKeys.fromAddress] ?? "")
      setFromName(raw[emailFieldKeys.fromName] ?? "")
      setIsActive(raw[emailFieldKeys.isActive] === "true")
    } catch {
      toast.error("Failed to load email settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload: Record<string, string> = {
        [emailFieldKeys.host]: host,
        [emailFieldKeys.port]: port,
        [emailFieldKeys.username]: username,
        [emailFieldKeys.password]: password,
        [emailFieldKeys.fromAddress]: fromAddress,
        [emailFieldKeys.fromName]: fromName,
        [emailFieldKeys.isActive]: isActive ? "true" : "false",
      }
      await api.post("/api/admin/settings", payload)
      toast.success("Email settings saved")
    } catch {
      toast.error("Failed to save email settings")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      await api.post("/api/admin/settings/email/test")
      toast.success("Test email sent successfully")
    } catch {
      toast.error("Failed to send test email")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 text-violet-600 animate-spin" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Email Settings</h1>
            <p className="text-zinc-500 text-sm mt-1">Configure SMTP email settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-violet-600" />
              SMTP Configuration
            </CardTitle>
            <CardDescription>Set up your email server for transactional emails</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g. smtp.gmail.com"
              />
              <Input
                label="Port"
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="587"
              />
            </div>

            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="SMTP username"
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="SMTP password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="From Address"
                type="email"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="noreply@example.com"
              />
              <Input
                label="From Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Sabari"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="emailActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="emailActive" className="text-sm font-medium text-zinc-700">Active</label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
              <Button variant="secondary" onClick={handleTest} loading={testing}>
                <Send className="h-4 w-4" />
                Test Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
