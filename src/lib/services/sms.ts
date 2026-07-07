import { Setting } from "@/lib/models"
import { connectDB } from "@/lib/db"

export interface SMSConfig {
  provider: string
  apiKey: string
  senderId: string
  active: boolean
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function getSMSConfig(): Promise<SMSConfig> {
  await connectDB()
  const providerSetting = await Setting.findOne({ key: "sms_provider" })
  const apiKeySetting = await Setting.findOne({ key: "sms_api_key" })
  const senderIdSetting = await Setting.findOne({ key: "sms_sender_id" })
  const activeSetting = await Setting.findOne({ key: "sms_is_active" })

  return {
    provider: (providerSetting?.value as string) || "console",
    apiKey: (apiKeySetting?.value as string) || "",
    senderId: (senderIdSetting?.value as string) || "Sabari",
    active: activeSetting?.value === "true",
  }
}

export async function sendSMS(
  to: string,
  message: string,
  config?: SMSConfig
): Promise<SMSResult> {
  const cfg = config || (await getSMSConfig())

  if (!cfg.active) {
    console.log(`[SMS] Skipping - SMS service is disabled. Would send to ${to}: ${message.substring(0, 50)}...`)
    return { success: true, messageId: "disabled" }
  }

  switch (cfg.provider) {
    case "twilio":
      return sendViaTwilio(to, message, cfg)
    case "sparrow":
      return sendViaSparrow(to, message, cfg)
    case "sms-np":
      return sendViaSMSNepal(to, message, cfg)
    case "console":
    default:
      console.log(`[SMS] ${to}: ${message}`)
      return { success: true, messageId: `console-${Date.now()}` }
  }
}

async function sendViaTwilio(to: string, message: string, cfg: SMSConfig): Promise<SMSResult> {
  try {
    let twilio: any
    try {
      twilio = require("twilio")
    } catch {
      return { success: false, error: "twilio package not installed. Run: npm install twilio" }
    }
    const [accountSid, authToken] = cfg.apiKey.split(":")
    if (!accountSid || !authToken) {
      return { success: false, error: "Invalid Twilio credentials format. Use AccountSid:AuthToken" }
    }
    const client = twilio(accountSid, authToken)
    const result = await client.messages.create({
      body: message,
      from: cfg.senderId,
      to,
    })
    return { success: true, messageId: result.sid }
  } catch (error: any) {
    console.error(`[SMS Twilio] Failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function sendViaSparrow(to: string, message: string, cfg: SMSConfig): Promise<SMSResult> {
  try {
    const response = await fetch("https://api.sparrowsms.com/v2/sms/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: cfg.apiKey,
        from: cfg.senderId,
        to,
        text: message,
      }),
    })
    const data = await response.json()
    if (data.response_code === 200) {
      return { success: true, messageId: String(data.message_id || data.response_code) }
    }
    return { success: false, error: data.response_message || "Sparrow SMS failed" }
  } catch (error: any) {
    console.error(`[SMS Sparrow] Failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function sendViaSMSNepal(to: string, message: string, cfg: SMSConfig): Promise<SMSResult> {
  try {
    const response = await fetch("https://sms.nepal.net/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: cfg.apiKey,
        sender: cfg.senderId,
        to,
        message,
      }),
    })
    const data = await response.json()
    return { success: data.status === "success", messageId: data.messageId || String(Date.now()) }
  } catch (error: any) {
    console.error(`[SMS Nepal] Failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export function bookingConfirmationSMS(params: {
  name: string
  bookingId: string
  from: string
  to: string
  date: string
  time: string
  seats: string
}): string {
  return `Dear ${params.name}, your booking ${params.bookingId} for ${params.from} → ${params.to} on ${params.date} at ${params.time} (Seats: ${params.seats}) is confirmed. Thank you for choosing Sabari!`
}
