import nodemailer from "nodemailer"
import { Setting } from "@/lib/models"
import { connectDB } from "@/lib/db"

export interface EmailConfig {
  host: string
  port: number
  username: string
  password: string
  fromAddress: string
  fromName: string
  secure: boolean
  active: boolean
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function getEmailConfig(): Promise<EmailConfig> {
  await connectDB()
  const hostSetting = await Setting.findOne({ key: "email_host" })
  const portSetting = await Setting.findOne({ key: "email_port" })
  const usernameSetting = await Setting.findOne({ key: "email_username" })
  const passwordSetting = await Setting.findOne({ key: "email_password" })
  const fromAddressSetting = await Setting.findOne({ key: "email_from_address" })
  const fromNameSetting = await Setting.findOne({ key: "email_from_name" })
  const activeSetting = await Setting.findOne({ key: "email_is_active" })

  return {
    host: (hostSetting?.value as string) || "smtp.gmail.com",
    port: Number(portSetting?.value) || 587,
    username: (usernameSetting?.value as string) || "",
    password: (passwordSetting?.value as string) || "",
    fromAddress: (fromAddressSetting?.value as string) || "noreply@sabari.com",
    fromName: (fromNameSetting?.value as string) || "Sabari",
    secure: Number(portSetting?.value) === 465,
    active: activeSetting?.value === "true",
  }
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  config?: EmailConfig
): Promise<EmailResult> {
  const cfg = config || (await getEmailConfig())

  if (!cfg.active) {
    console.log(`[Email] Skipping - email service is disabled. Would send to ${to}: ${subject}`)
    return { success: true, messageId: "disabled" }
  }

  if (!cfg.username || !cfg.password) {
    console.log(`[Email] No credentials configured. Would send to ${to}: ${subject}`)
    return { success: true, messageId: "no-credentials" }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.username,
        pass: cfg.password,
      },
    })

    const recipients = Array.isArray(to) ? to.join(", ") : to
    const info = await transporter.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromAddress}>`,
      to: recipients,
      subject,
      html,
    })

    console.log(`[Email] Sent: ${info.messageId} -> ${recipients}`)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error(`[Email] Failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export function bookingConfirmationEmail(params: {
  name: string
  bookingId: string
  from: string
  to: string
  date: string
  time: string
  seats: string
  amount: number
  vehicle: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">${params.name}</p>
      </div>
      <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
        <p style="margin: 0 0 16px;">Your ticket has been booked successfully.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Booking ID</td><td style="text-align: right; font-weight: bold;">${params.bookingId}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Route</td><td style="text-align: right;">${params.from} → ${params.to}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Date & Time</td><td style="text-align: right;">${params.date} at ${params.time}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Seats</td><td style="text-align: right;">${params.seats}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Vehicle</td><td style="text-align: right;">${params.vehicle}</td></tr>
          <tr><td style="padding: 8px 0; border-top: 1px solid #27272a; color: #a1a1aa;">Amount Paid</td><td style="text-align: right; border-top: 1px solid #27272a; font-weight: bold; color: #a78bfa;">Rs. ${params.amount.toLocaleString()}</td></tr>
        </table>
        <p style="margin: 20px 0 0; color: #71717a; font-size: 12px;">Thank you for choosing Sabari. Have a safe journey!</p>
      </div>
    </div>
  `
}

export function paymentConfirmationEmail(params: {
  name: string
  bookingId: string
  amount: number
  method: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #059669, #7c3aed); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Payment Successful!</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Rs. ${params.amount.toLocaleString()} via ${params.method}</p>
      </div>
      <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
        <p style="margin: 0 0 16px;">Your payment has been processed successfully.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Booking ID</td><td style="text-align: right; font-weight: bold;">${params.bookingId}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Amount</td><td style="text-align: right; font-weight: bold; color: #a78bfa;">Rs. ${params.amount.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Payment Method</td><td style="text-align: right; text-transform: capitalize;">${params.method}</td></tr>
        </table>
      </div>
    </div>
  `
}
