"use client"

import { useState, useEffect } from "react"
import { Save, Send, Eye, EyeOff, MessageSquare } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"

const smsProviders = ["twilio", "sparrow", "sms-np", "other"]

const smsFieldKeys = {
  provider: "sms_provider",
  apiKey: "sms_api_key",
  senderId: "sms_sender_id",
  isActive: "sms_is_active",
}

export default function SmsPage() {
  const [provider, setProvider] = useState("twilio")
  const [apiKey, setApiKey] = useState("")
  const [senderId, setSenderId] = useState("")
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/admin/settings")
      const grouped = data.settings ?? data.data ?? {}
      const raw: Record<string, string> = {}
      for (const category of Object.values(grouped) as any[]) {
        if (Array.isArray(category)) {
          for (const s of category) {
            raw[s.key] = s.value
          }
        }
      }
      setProvider(raw[smsFieldKeys.provider] ?? "twilio")
      setApiKey(raw[smsFieldKeys.apiKey] ?? "")
      setSenderId(raw[smsFieldKeys.senderId] ?? "")
      setIsActive(raw[smsFieldKeys.isActive] === "true")
    } catch {
      toast.error("Failed to load SMS settings")
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
        [smsFieldKeys.provider]: provider,
        [smsFieldKeys.apiKey]: apiKey,
        [smsFieldKeys.senderId]: senderId,
        [smsFieldKeys.isActive]: isActive ? "true" : "false",
      }
      await api.post("/admin/settings", payload)
      toast.success("SMS settings saved")
    } catch {
      toast.error("Failed to save SMS settings")
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      setTesting(true)
      await api.post("/admin/settings/sms/test")
      toast.success("Test SMS sent successfully")
    } catch {
      toast.error("Failed to send test SMS")
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
            <h1 className="text-2xl font-bold text-zinc-900">SMS Gateway</h1>
            <p className="text-zinc-500 text-sm mt-1">Configure SMS provider settings</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-600" />
              SMS Configuration
            </CardTitle>
            <CardDescription>Set up your SMS gateway provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                {smsProviders.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Enter SMS API key"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-200"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Input
              label="Sender ID"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="e.g. SABARI"
            />

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="smsActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
              />
              <label htmlFor="smsActive" className="text-sm font-medium text-zinc-700">Active</label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
              <Button variant="secondary" onClick={handleTest} loading={testing}>
                <Send className="h-4 w-4" />
                Test SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
