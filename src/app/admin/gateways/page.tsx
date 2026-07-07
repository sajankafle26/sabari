"use client"

import { useState, useEffect } from "react"
import { Save, Eye, EyeOff, Wallet } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { toast } from "sonner"

interface GatewayConfig {
  key: string
  value: string
  description: string
}

interface Gateway {
  id: string
  name: string
  isActive: boolean
  merchantId: string
  secretKey: string
  merchantName: string
}

const defaultGateways = ["eSewa", "Khalti", "Fonepay", "IME Pay", "ConnectIPS"]

const gatewayFieldKeys: Record<string, string[]> = {
  eSewa: ["gateway_esewa_merchant_id", "gateway_esewa_secret_key", "gateway_esewa_merchant_name", "gateway_esewa_is_active"],
  Khalti: ["gateway_khalti_merchant_id", "gateway_khalti_secret_key", "gateway_khalti_merchant_name", "gateway_khalti_is_active"],
  Fonepay: ["gateway_fonepay_merchant_id", "gateway_fonepay_secret_key", "gateway_fonepay_merchant_name", "gateway_fonepay_is_active"],
  "IME Pay": ["gateway_imepay_merchant_id", "gateway_imepay_secret_key", "gateway_imepay_merchant_name", "gateway_imepay_is_active"],
  ConnectIPS: ["gateway_connectips_merchant_id", "gateway_connectips_secret_key", "gateway_connectips_merchant_name", "gateway_connectips_is_active"],
}

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<Record<string, Gateway>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  const fetchGateways = async () => {
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

      const parsed: Record<string, Gateway> = {}
      for (const gw of defaultGateways) {
        const keys = gatewayFieldKeys[gw]
        parsed[gw] = {
          id: gw.toLowerCase().replace(/\s+/g, "_"),
          name: gw,
          merchantId: raw[keys[0]] ?? "",
          secretKey: raw[keys[1]] ?? "",
          merchantName: raw[keys[2]] ?? "",
          isActive: raw[keys[3]] === "true",
        }
      }
      setGateways(parsed)
    } catch {
      toast.error("Failed to load gateways")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGateways()
  }, [])

  const updateGateway = (name: string, field: keyof Gateway, value: any) => {
    setGateways((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }))
  }

  const handleSave = async (name: string) => {
    try {
      setSaving(name)
      const gw = gateways[name]
      const keys = gatewayFieldKeys[name]
      const payload: Record<string, string> = {
        [keys[0]]: gw.merchantId,
        [keys[1]]: gw.secretKey,
        [keys[2]]: gw.merchantName,
        [keys[3]]: gw.isActive ? "true" : "false",
      }
      await api.post("/admin/settings", payload)
      toast.success(`${name} gateway saved`)
    } catch {
      toast.error(`Failed to save ${name} gateway`)
    } finally {
      setSaving(null)
    }
  }

  const toggleSecret = (name: string) => {
    setShowSecrets((prev) => ({ ...prev, [name]: !prev[name] }))
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
            <h1 className="text-2xl font-bold text-zinc-900">Payment Gateways</h1>
            <p className="text-zinc-500 text-sm mt-1">Configure payment gateway credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {defaultGateways.map((name) => {
            const gw = gateways[name]
            if (!gw) return null
            return (
              <Card key={name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-violet-600" />
                        {name}
                      </CardTitle>
                      <CardDescription>Configure {name} payment gateway</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gw.isActive}
                          onChange={(e) => updateGateway(name, "isActive", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                      </label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Merchant Name</label>
                    <input
                      type="text"
                      value={gw.merchantName}
                      onChange={(e) => updateGateway(name, "merchantName", e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Merchant ID / API Key</label>
                    <input
                      type={showSecrets[name] ? "text" : "password"}
                      value={gw.merchantId}
                      onChange={(e) => updateGateway(name, "merchantId", e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-zinc-700">Secret Key</label>
                    <div className="relative">
                      <input
                        type={showSecrets[name] ? "text" : "password"}
                        value={gw.secretKey}
                        onChange={(e) => updateGateway(name, "secretKey", e.target.value)}
                        className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 pr-10 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret(name)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-200"
                      >
                        {showSecrets[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      onClick={() => handleSave(name)}
                      loading={saving === name}
                      className="w-full"
                    >
                      <Save className="h-4 w-4" />
                      Save {name} Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
