import { OTP, User } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { sendSMS, getSMSConfig } from "./sms"

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5

export function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getOTPExpiry(): Date {
  const date = new Date()
  date.setMinutes(date.getMinutes() + OTP_EXPIRY_MINUTES)
  return date
}

export async function sendOTP(
  userId: string,
  phone: string,
  purpose: "setup" | "login" | "disable"
): Promise<{ success: boolean; message: string }> {
  await connectDB()

  await OTP.deleteMany({ user: userId, purpose, verified: false })

  const code = generateOTPCode()
  const expiresAt = getOTPExpiry()

  await OTP.create({ user: userId, code, purpose, expiresAt })

  const smsConfig = await getSMSConfig()
  if (smsConfig.active) {
    const message = `Your Sabari verification code is: ${code}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
    await sendSMS(phone, message, smsConfig)
  } else {
    console.log(`[OTP] ${purpose} code for user ${userId}: ${code}`)
  }

  return { success: true, message: `OTP sent to ${phone.slice(0, -4)}****` }
}

export async function verifyOTP(
  userId: string,
  code: string,
  purpose: "setup" | "login" | "disable"
): Promise<{ success: boolean; message: string }> {
  await connectDB()

  const otp = await OTP.findOne({
    user: userId,
    purpose,
    verified: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 })

  if (!otp) {
    return { success: false, message: "No valid OTP found. Request a new code." }
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await OTP.deleteOne({ _id: otp._id })
    return { success: false, message: "Too many failed attempts. Request a new code." }
  }

  if (otp.code !== code) {
    otp.attempts += 1
    await otp.save()
    return { success: false, message: "Invalid verification code." }
  }

  otp.verified = true
  await otp.save()

  return { success: true, message: "Code verified successfully." }
}

export async function enable2FA(userId: string): Promise<{ success: boolean; message: string }> {
  await connectDB()
  await User.findByIdAndUpdate(userId, { twoFactorEnabled: true })
  return { success: true, message: "Two-factor authentication enabled." }
}

export async function disable2FA(userId: string): Promise<{ success: boolean; message: string }> {
  await connectDB()
  await User.findByIdAndUpdate(userId, {
    twoFactorEnabled: false,
    twoFactorSecret: undefined,
  })
  return { success: true, message: "Two-factor authentication disabled." }
}
