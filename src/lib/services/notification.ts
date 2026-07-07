import { Notification } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { sendEmail, getEmailConfig } from "./email"
import { sendSMS, getSMSConfig } from "./sms"
import { emitNotification } from "@/lib/socket-server"

export interface SendNotificationParams {
  recipient?: string
  recipientRole?: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  channels?: {
    sms?: boolean
    email?: boolean
    push?: boolean
    inApp?: boolean
  }
  smsPhone?: string
  emailAddress?: string
}

export async function sendNotification(params: SendNotificationParams): Promise<{
  inAppId?: string
  emailResult?: any
  smsResult?: any
}> {
  await connectDB()

  const channels = params.channels || { inApp: true }
  let inAppId: string | undefined

  if (channels.inApp !== false) {
    const notification = await Notification.create({
      recipient: params.recipient,
      recipientRole: params.recipientRole as any,
      type: params.type as any,
      title: params.title,
      message: params.message,
      data: params.data,
      sentVia: {
        sms: channels.sms === true,
        email: channels.email === true,
        push: channels.push === true,
        inApp: true,
      },
    })
    inAppId = notification._id.toString()
    if (params.recipient) {
      emitNotification(params.recipient.toString(), notification.toObject())
    }
  }

  let emailResult: any
  if (channels.email && params.emailAddress) {
    const emailConfig = await getEmailConfig()
    if (emailConfig.active) {
      emailResult = await sendEmail(
        params.emailAddress,
        params.title,
        `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h2 style="color: white; margin: 0;">${params.title}</h2>
          </div>
          <div style="background: #1a1a2e; padding: 24px; border-radius: 0 0 12px 12px; color: #e4e4e7;">
            <p>${params.message}</p>
            ${params.data ? `<pre style="background: #27272a; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${JSON.stringify(params.data, null, 2)}</pre>` : ""}
            <p style="color: #71717a; font-size: 12px; margin-top: 24px;">— Sabari Team</p>
          </div>
        </div>`,
        emailConfig
      )
    }
  }

  let smsResult: any
  if (channels.sms && params.smsPhone) {
    const smsConfig = await getSMSConfig()
    if (smsConfig.active) {
      smsResult = await sendSMS(params.smsPhone, params.message, smsConfig)
    }
  }

  return { inAppId, emailResult, smsResult }
}

export async function sendBookingConfirmation(params: {
  userId?: string
  userRole?: string
  name: string
  phone?: string
  email?: string
  bookingId: string
  from: string
  to: string
  date: string
  time: string
  seats: string
  amount: number
  vehicle: string
}) {
  const { bookingConfirmationSMS } = await import("./sms")
  const { bookingConfirmationEmail } = await import("./email")

  return sendNotification({
    recipient: params.userId,
    recipientRole: params.userRole,
    type: "seat_confirmed",
    title: "Booking Confirmed!",
    message: `Your booking ${params.bookingId} for ${params.from} → ${params.to} is confirmed.`,
    data: {
      bookingId: params.bookingId,
      from: params.from,
      to: params.to,
      date: params.date,
      time: params.time,
      seats: params.seats,
      amount: params.amount,
      vehicle: params.vehicle,
    },
    channels: {
      inApp: true,
      sms: !!params.phone,
      email: !!params.email,
    },
    smsPhone: params.phone,
    emailAddress: params.email,
  })
}

export async function sendPaymentConfirmation(params: {
  userId?: string
  userRole?: string
  name: string
  phone?: string
  email?: string
  bookingId: string
  amount: number
  method: string
}) {
  return sendNotification({
    recipient: params.userId,
    recipientRole: params.userRole,
    type: "payment_success",
    title: "Payment Successful!",
    message: `Your payment of Rs. ${params.amount.toLocaleString()} for booking ${params.bookingId} via ${params.method} was successful.`,
    data: {
      bookingId: params.bookingId,
      amount: params.amount,
      method: params.method,
    },
    channels: {
      inApp: true,
      sms: !!params.phone,
      email: !!params.email,
    },
    smsPhone: params.phone,
    emailAddress: params.email,
  })
}
