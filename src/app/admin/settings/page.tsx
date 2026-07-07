"use client"

import { useState, useEffect } from "react"
import { Save, Settings2 } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"

interface Setting {
  key: string
  value: string
  description: string
}

const defaultSettings: Record<string, Setting[]> = {
  general: [
    { key: "appName", value: "", description: "Application name displayed across the platform" },
    { key: "supportPhone", value: "", description: "Primary customer support phone number" },
    { key: "supportEmail", value: "", description: "Primary customer support email address" },
    { key: "address", value: "", description: "Company physical address" },
  ],
  booking: [
    { key: "defaultCommission", value: "", description: "Default commission percentage for bookings" },
    { key: "maxPassengersPerBooking", value: "", description: "Maximum passengers allowed per booking" },
    { key: "allowCancellation", value: "false", description: "Allow users to cancel bookings" },
    { key: "cancellationTimeLimit", value: "", description: "Hours before departure within which cancellation is allowed" },
    { key: "allowSeatSelection", value: "false", description: "Allow users to select specific seats" },
  ],
  payment: [],
  sms: [],
  email: [],
  commission: [],
}

const categoryLabels: Record<string, string> = {
  general: "General Settings",
  booking: "Booking Settings",
  payment: "Payment Settings",
  sms: "SMS Settings",
  email: "Email Settings",
  commission: "Commission Settings",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/api/admin/settings")
      const raw: Record<string, any> = data.data ?? data
      const grouped: Record<string, Setting[]> = { ...defaultSettings }
      for (const [key, value] of Object.entries(raw)) {
        const category = getCategory(key)
        if (!grouped[category]) grouped[category] = []
        const existing = grouped[category].find((s) => s.key === key)
        if (existing) {
          existing.value = String(value ?? "")
        } else {
          grouped[category].push({ key, value: String(value ?? ""), description: "" })
        }
      }
      setSettings(grouped)
    } catch {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const getCategory = (key: string): string => {
    if (["appName", "supportPhone", "supportEmail", "address"].includes(key)) return "general"
    if (key.startsWith("payment") || key.startsWith("gateway")) return "payment"
    if (key.startsWith("sms")) return "sms"
    if (key.startsWith("email")) return "email"
    if (key.startsWith("commission")) return "commission"
    return "booking"
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateValue = (category: string, key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: prev[category].map((s) =>
        s.key === key ? { ...s, value } : s
      ),
    }))
  }

  const handleSave = async (category: string) => {
    try {
      setSaving(category)
      const payload: Record<string, any> = {}
      for (const s of settings[category]) {
        payload[s.key] = s.value
      }
      await api.post("/api/admin/settings", payload)
      toast.success(`${categoryLabels[category] ?? category} saved`)
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(null)
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

  const categories = Object.entries(settings).filter(
    ([_, entries]) => entries.length > 0
  )

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">System Settings</h1>
            <p className="text-zinc-500 text-sm mt-1">Configure global system settings</p>
          </div>
        </div>

        {categories.map(([category, entries]) => (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-violet-600" />
                    {categoryLabels[category] ?? category}
                  </CardTitle>
                  <CardDescription>Manage {category} configuration</CardDescription>
                </div>
                <Button onClick={() => handleSave(category)} loading={saving === category}>
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {entries.map((setting) => (
                <div key={setting.key} className="space-y-1.5">
                  {setting.key === "allowCancellation" || setting.key === "allowSeatSelection" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={setting.key}
                        checked={setting.value === "true"}
                        onChange={(e) =>
                          updateValue(category, setting.key, e.target.checked ? "true" : "false")
                        }
                        className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <label htmlFor={setting.key} className="text-sm font-medium text-zinc-700">
                          {setting.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-zinc-500">{setting.description}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Input
                      label={setting.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      type={
                        setting.key.toLowerCase().includes("phone") || setting.key.includes("maxPassengers") || setting.key.includes("commission") || setting.key.includes("timeLimit")
                          ? "number"
                          : setting.key.toLowerCase().includes("email")
                          ? "email"
                          : "text"
                      }
                      value={setting.value}
                      onChange={(e) => updateValue(category, setting.key, e.target.value)}
                      placeholder={setting.key}
                    />
                  )}
                  {setting.description && (
                    <p className="text-xs text-zinc-500 px-1">{setting.description}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  )
}
