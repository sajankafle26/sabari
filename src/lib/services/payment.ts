import { Setting } from "@/lib/models"
import { connectDB } from "@/lib/db"

export interface GatewayConfig {
  merchantCode?: string
  secretKey?: string
  publicKey?: string
  merchantId?: string
  username?: string
  password?: string
  sandbox: boolean
}

export interface GatewayInitResult {
  success: boolean
  gateway: string
  transactionId: string
  redirectUrl?: string
  formAction?: string
  formFields?: Record<string, string>
  token?: string
  qrCode?: string
  error?: string
}

export interface GatewayVerifyResult {
  success: boolean
  transactionId: string
  gatewayRef?: string
  amount?: number
  error?: string
}

async function getGatewayConfig(gateway: string): Promise<GatewayConfig> {
  await connectDB()
  const setting = await Setting.findOne({ key: `payment_${gateway}`, category: "payment" })
  if (setting?.value) {
    return { ...setting.value, sandbox: setting.value.sandbox !== false }
  }

  const flatKeys: Record<string, string> = {
    esewa: "gateway_esewa",
    khalti: "gateway_khalti",
    fonepay: "gateway_fonepay",
    imepay: "gateway_imepay",
    connectips: "gateway_connectips",
  }
  const prefix = (flatKeys as any)[gateway]
  if (prefix) {
    const merchantIdSetting = await Setting.findOne({ key: `${prefix}_merchant_id` })
    const secretKeySetting = await Setting.findOne({ key: `${prefix}_secret_key` })
    const merchantNameSetting = await Setting.findOne({ key: `${prefix}_merchant_name` })
    const isActiveSetting = await Setting.findOne({ key: `${prefix}_is_active` })

    if (merchantIdSetting || secretKeySetting) {
      return {
        merchantCode: merchantIdSetting?.value as string || "",
        secretKey: secretKeySetting?.value as string || "",
        merchantId: merchantIdSetting?.value as string || "",
        sandbox: true,
      }
    }
  }

  return { sandbox: true }
}

function generateTransactionId(): string {
  const date = new Date()
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, "0")
  return `TXN-${year}${month}${day}-${rand}`
}

export const paymentGateways = {
  async initiate(
    gateway: string,
    bookingId: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<GatewayInitResult> {
    const config = await getGatewayConfig(gateway)
    const transactionId = generateTransactionId()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const callbackUrl = `${baseUrl}/api/payments/callback/${gateway}`
    const successUrl = `${baseUrl}/booking/confirmation?txn=${transactionId}`
    const failureUrl = `${baseUrl}/booking/payment?failed=true`

    switch (gateway) {
      case "esewa":
        return handleEsewa(config, transactionId, bookingId, amount, successUrl, failureUrl)
      case "khalti":
        return handleKhalti(config, transactionId, bookingId, amount, callbackUrl, metadata)
      case "fonepay":
        return handleFonepay(config, transactionId, bookingId, amount, successUrl, failureUrl)
      case "imepay":
        return handleImePay(config, transactionId, bookingId, amount, callbackUrl)
      case "connectips":
        return handleConnectIPS(config, transactionId, bookingId, amount, successUrl, failureUrl)
      default:
        return { success: false, gateway, transactionId, error: `Unknown gateway: ${gateway}` }
    }
  },

  async verify(gateway: string, params: Record<string, any>): Promise<GatewayVerifyResult> {
    const config = await getGatewayConfig(gateway)
    switch (gateway) {
      case "esewa":
        return verifyEsewa(config, params)
      case "khalti":
        return verifyKhalti(config, params)
      case "fonepay":
        return verifyFonepay(config, params)
      case "imepay":
        return verifyImePay(config, params)
      case "connectips":
        return verifyConnectIPS(config, params)
      default:
        return { success: false, transactionId: params.transactionId || "", error: "Unknown gateway" }
    }
  },
}

async function handleEsewa(
  config: GatewayConfig,
  transactionId: string,
  bookingId: string,
  amount: number,
  successUrl: string,
  failureUrl: string
): Promise<GatewayInitResult> {
  const merchantCode = config.merchantCode || "EPAYTEST"

  if (config.sandbox) {
    return {
      success: true,
      gateway: "esewa",
      transactionId,
      formAction: "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      formFields: {
        amt: String(amount),
        psc: "0",
        pdc: "0",
        txAmt: "0",
        tAmt: String(amount),
        pid: transactionId,
        scd: merchantCode,
        su: successUrl,
        fu: failureUrl,
      },
    }
  }

  return {
    success: true,
    gateway: "esewa",
    transactionId,
    formAction: "https://esewa.com.np/epay/main",
    formFields: {
      amt: String(amount),
      psc: "0",
      pdc: "0",
      txAmt: "0",
      tAmt: String(amount),
      pid: transactionId,
      scd: merchantCode,
      su: successUrl,
      fu: failureUrl,
    },
  }
}

async function handleKhalti(
  config: GatewayConfig,
  transactionId: string,
  _bookingId: string,
  amount: number,
  callbackUrl: string,
  metadata?: Record<string, any>
): Promise<GatewayInitResult> {
  const publicKey = config.publicKey || "test_public_key"
  const secretKey = config.secretKey || "test_secret_key"

  if (config.sandbox) {
    return {
      success: true,
      gateway: "khalti",
      transactionId,
      formAction: "https://test-pay.khalti.com/",
      formFields: {
        public_key: publicKey,
        transaction_id: transactionId,
        amount: String(amount * 100),
        product_identity: _bookingId,
        product_name: metadata?.productName || "Bus Ticket",
        product_url: metadata?.productUrl || callbackUrl,
      },
    }
  }

  return {
    success: true,
    gateway: "khalti",
    transactionId,
    formAction: "https://pay.khalti.com/",
    formFields: {
      public_key: publicKey,
      transaction_id: transactionId,
      amount: String(amount * 100),
      product_identity: _bookingId,
      product_name: metadata?.productName || "Bus Ticket",
      product_url: metadata?.productUrl || callbackUrl,
    },
  }
}

async function handleFonepay(
  config: GatewayConfig,
  transactionId: string,
  _bookingId: string,
  amount: number,
  successUrl: string,
  failureUrl: string
): Promise<GatewayInitResult> {
  const merchantId = config.merchantId || "FONEPAY_TEST"

  if (config.sandbox) {
    return {
      success: true,
      gateway: "fonepay",
      transactionId,
      formAction: "https://dev.fonepay.com.np/merchant/request",
      formFields: {
        RRN: transactionId,
        PID: _bookingId,
        MD: "P",
        AMT: String(amount),
        CRN: "NPR",
        DV: "hash_value",
        MERCHANT_ID: merchantId,
        SU: successUrl,
        FU: failureUrl,
      },
    }
  }

  return {
    success: true,
    gateway: "fonepay",
    transactionId,
    formAction: "https://client.fonepay.com.np/merchant/request",
    formFields: {
      RRN: transactionId,
      PID: _bookingId,
      MD: "P",
      AMT: String(amount),
      CRN: "NPR",
      DV: "hash_value",
      MERCHANT_ID: merchantId,
      SU: successUrl,
      FU: failureUrl,
    },
  }
}

async function handleImePay(
  config: GatewayConfig,
  transactionId: string,
  _bookingId: string,
  amount: number,
  callbackUrl: string
): Promise<GatewayInitResult> {
  if (config.sandbox) {
    return {
      success: true,
      gateway: "imepay",
      transactionId,
      formAction: "https://stg.imepay.com.np:7979/api/Web/InitPayment",
      formFields: {
        MerchantCode: config.merchantCode || "IME_TEST",
        TxnId: transactionId,
        TxnDate: new Date().toISOString().split("T")[0],
        TxnTime: new Date().toTimeString().split(" ")[0],
        TxnAmount: String(amount),
        ReferenceId: _bookingId,
        MobileNo: "",
        Particular: "Bus Ticket Booking",
        Remarks: "Online Bus Ticket",
        RouteId: callbackUrl,
      },
    }
  }

  return {
    success: true,
    gateway: "imepay",
    transactionId,
    formAction: "https://imepay.com.np:7979/api/Web/InitPayment",
    formFields: {
      MerchantCode: config.merchantCode || "",
      TxnId: transactionId,
      TxnDate: new Date().toISOString().split("T")[0],
      TxnTime: new Date().toTimeString().split(" ")[0],
      TxnAmount: String(amount),
      ReferenceId: _bookingId,
      MobileNo: "",
      Particular: "Bus Ticket Booking",
      Remarks: "Online Bus Ticket",
      RouteId: callbackUrl,
    },
  }
}

async function handleConnectIPS(
  config: GatewayConfig,
  transactionId: string,
  _bookingId: string,
  amount: number,
  successUrl: string,
  failureUrl: string
): Promise<GatewayInitResult> {
  if (config.sandbox) {
    return {
      success: true,
      gateway: "connectips",
      transactionId,
      formAction: "https://uat.connectips.com/nb/#/",
      formFields: {
        merchantId: config.merchantId || "CONNECTIPS_TEST",
        txnId: transactionId,
        amount: String(amount),
        refId: _bookingId,
        successUrl,
        failureUrl,
      },
    }
  }

  return {
    success: true,
    gateway: "connectips",
    transactionId,
    formAction: "https://connectips.com/nb/",
    formFields: {
      merchantId: config.merchantId || "",
      txnId: transactionId,
      amount: String(amount),
      refId: _bookingId,
      successUrl,
      failureUrl,
    },
  }
}

async function verifyEsewa(config: GatewayConfig, params: Record<string, any>): Promise<GatewayVerifyResult> {
  const { refId, oid, amt } = params
  if (config.sandbox) {
    return {
      success: true,
      transactionId: oid || refId || "",
      gatewayRef: refId || "",
      amount: Number(amt) || 0,
    }
  }

  try {
    const axios = require("axios")
    const verifyUrl = config.sandbox
      ? "https://rc-epay.esewa.com.np/api/epay/transrec"
      : "https://esewa.com.np/api/epay/transrec"

    const response = await axios.post(verifyUrl, {
      amt,
      scd: config.merchantCode,
      rid: refId,
      pid: oid,
    })

    if (response.data?.response_code === "success") {
      return { success: true, transactionId: oid, gatewayRef: refId, amount: Number(amt) }
    }
    return { success: false, transactionId: oid, error: "eSewa verification failed" }
  } catch (error: any) {
    return { success: false, transactionId: oid || "", error: error.message }
  }
}

async function verifyKhalti(config: GatewayConfig, params: Record<string, any>): Promise<GatewayVerifyResult> {
  const { pidx, transaction_id, amount, status } = params

  if (config.sandbox) {
    return {
      success: status === "Completed" || status === "completed",
      transactionId: transaction_id || params.transactionId || "",
      gatewayRef: pidx || "",
      amount: amount ? Number(amount) / 100 : 0,
    }
  }

  try {
    const axios = require("axios")
    const response = await axios.post(
      "https://khalti.com/api/v2/epayment/lookup/",
      { pidx },
      { headers: { Authorization: `Key ${config.secretKey}` } }
    )

    if (response.data?.status === "Completed") {
      return {
        success: true,
        transactionId: transaction_id || params.transactionId || "",
        gatewayRef: pidx,
        amount: response.data.total_amount / 100,
      }
    }
    return { success: false, transactionId: transaction_id || params.transactionId || "", error: "Khalti verification failed" }
  } catch (error: any) {
    return { success: false, transactionId: transaction_id || params.transactionId || "", error: error.message }
  }
}

async function verifyFonepay(config: GatewayConfig, params: Record<string, any>): Promise<GatewayVerifyResult> {
  const { RRN, PID, AMT, STATUS } = params
  if (config.sandbox) {
    return {
      success: STATUS === "Success" || STATUS === "success",
      transactionId: RRN || params.transactionId || "",
      gatewayRef: RRN || "",
      amount: Number(AMT) || 0,
    }
  }
  return { success: STATUS === "Success", transactionId: RRN || PID || "", gatewayRef: RRN || "", amount: Number(AMT) || 0 }
}

async function verifyImePay(config: GatewayConfig, params: Record<string, any>): Promise<GatewayVerifyResult> {
  const { ResponseCode, TxnId, Amount, RefId } = params
  if (config.sandbox) {
    return {
      success: ResponseCode === "0" || ResponseCode === "success",
      transactionId: TxnId || params.transactionId || "",
      gatewayRef: RefId || "",
      amount: Number(Amount) || 0,
    }
  }
  return { success: ResponseCode === "0", transactionId: TxnId || "", gatewayRef: RefId || "", amount: Number(Amount) || 0 }
}

async function verifyConnectIPS(config: GatewayConfig, params: Record<string, any>): Promise<GatewayVerifyResult> {
  const { txnId, amount, status, refId } = params
  if (config.sandbox) {
    return {
      success: status === "success" || status === "Success" || status === "completed",
      transactionId: txnId || params.transactionId || "",
      gatewayRef: refId || "",
      amount: Number(amount) || 0,
    }
  }
  return { success: status === "success", transactionId: txnId || "", gatewayRef: refId || "", amount: Number(amount) || 0 }
}
