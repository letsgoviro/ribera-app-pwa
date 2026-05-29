import axios from 'axios'

// DPO environment config
// Production:  DPO_API_URL=https://secure.3gdirectpay.com/API/v6/
// Sandbox:     DPO_API_URL=https://secure1.sandbox.directpay.online/API/v6/
// Mock (dev):  DPO_ENVIRONMENT=mock  — skips real DPO call, returns a local payment page
const DPO_BASE_URL = process.env['DPO_API_URL'] ?? 'https://secure.3gdirectpay.com/API/v6/'
const DPO_PAYMENT_BASE = process.env['DPO_PAYMENT_URL'] ?? 'https://secure.3gdirectpay.com/payv2.php'
const COMPANY_TOKEN = process.env['DPO_COMPANY_TOKEN']!
const SERVICE_TYPE = process.env['DPO_SERVICE_TYPE']!
const IS_MOCK = process.env['DPO_ENVIRONMENT'] === 'mock'

// DPO result codes
const DPO_SUCCESS = '000'

interface CreateTokenParams {
  amount: number
  currency: string
  reference: string
  description: string
  customerEmail?: string
  customerPhone?: string
  redirectUrl: string
  backUrl: string
}

interface CreateTokenResult {
  transactionToken: string
  paymentUrl: string
}

function buildXml(content: string) {
  return `<?xml version="1.0" encoding="utf-8"?><API3G>${content}</API3G>`
}

export async function createPaymentToken(params: CreateTokenParams): Promise<CreateTokenResult> {
  // ── Mock mode for local development ─────────────────────────────────────────
  // Set DPO_ENVIRONMENT=mock in .env to bypass real DPO API calls.
  // The mock payment page at /checkout/mock-pay?token=... simulates the DPO flow.
  if (IS_MOCK) {
    const mockToken = `MOCK-${params.reference}-${Date.now()}`
    const apiBase = process.env['API_URL'] ?? 'http://localhost:3001'
    const mockPayUrl = `${apiBase}/api/v1/payment/mock-pay?token=${mockToken}&ref=${params.reference}&amount=${params.amount}&currency=${params.currency}&redirect=${encodeURIComponent(params.redirectUrl)}`
    return { transactionToken: mockToken, paymentUrl: mockPayUrl }
  }

  const now = new Date()
  const serviceDate = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 19)}`

  // DPO requires amount as decimal string with 2 decimal places
  // Prices are stored as whole currency units (TZS has no fractional unit)
  const amountFormatted = params.amount.toFixed(2)

  const customerXml = params.customerEmail
    ? `<Customers><Customer><CustomerEmail>${params.customerEmail}</CustomerEmail>${params.customerPhone ? `<CustomerPhone>${params.customerPhone}</CustomerPhone>` : ''}</Customer></Customers>`
    : ''

  const xml = buildXml(
    `<CompanyToken>${COMPANY_TOKEN}</CompanyToken>
<Request>createToken</Request>
<Transaction>
  <PaymentAmount>${amountFormatted}</PaymentAmount>
  <PaymentCurrency>${params.currency}</PaymentCurrency>
  <CompanyRef>${params.reference}</CompanyRef>
  <RedirectURL>${params.redirectUrl}</RedirectURL>
  <BackURL>${params.backUrl}</BackURL>
  <CompanyRefUnique>0</CompanyRefUnique>
  <PTL>30</PTL>
</Transaction>
<Services>
  <Service>
    <ServiceType>${SERVICE_TYPE}</ServiceType>
    <ServiceDescription>${params.description}</ServiceDescription>
    <ServiceDate>${serviceDate}</ServiceDate>
  </Service>
</Services>${customerXml}`
  )

  const response = await axios.post(DPO_BASE_URL, xml, {
    headers: { 'Content-Type': 'application/xml' },
    timeout: 30000,
  })

  const tokenMatch = response.data.match(/<TransToken>([^<]+)<\/TransToken>/)
  const resultMatch = response.data.match(/<Result>([^<]+)<\/Result>/)
  const explanationMatch = response.data.match(/<ResultExplanation>([^<]+)<\/ResultExplanation>/)

  const result = resultMatch?.[1]
  const explanation = explanationMatch?.[1] ?? 'Unknown DPO error'

  if (!tokenMatch || result !== DPO_SUCCESS) {
    const code = result ?? 'NO_RESULT'
    const msg = getDpoErrorMessage(code, explanation)
    throw new Error(msg)
  }

  const transactionToken = tokenMatch[1] as string
  return {
    transactionToken,
    paymentUrl: `${DPO_PAYMENT_BASE}?ID=${transactionToken}`,
  }
}

export async function verifyPayment(transactionToken: string): Promise<boolean> {
  // Mock: any MOCK-prefixed token is always "paid"
  if (IS_MOCK || transactionToken.startsWith('MOCK-')) return true

  const xml = buildXml(
    `<CompanyToken>${COMPANY_TOKEN}</CompanyToken>
<Request>verifyToken</Request>
<TransactionToken>${transactionToken}</TransactionToken>`
  )

  const response = await axios.post(DPO_BASE_URL, xml, {
    headers: { 'Content-Type': 'application/xml' },
    timeout: 30000,
  })

  const resultMatch = response.data.match(/<Result>([^<]+)<\/Result>/)
  return resultMatch?.[1] === DPO_SUCCESS
}

export async function refundPayment(transactionToken: string, amount: number): Promise<boolean> {
  // DPO refund amount must be decimal string (whole TZS units)
  const amountFormatted = amount.toFixed(2)
  const xml = buildXml(
    `<CompanyToken>${COMPANY_TOKEN}</CompanyToken>
<Request>refundToken</Request>
<TransactionToken>${transactionToken}</TransactionToken>
<refundAmount>${amountFormatted}</refundAmount>`
  )

  const response = await axios.post(DPO_BASE_URL, xml, {
    headers: { 'Content-Type': 'application/xml' },
    timeout: 30000,
  })

  const resultMatch = response.data.match(/<Result>([^<]+)<\/Result>/)
  return resultMatch?.[1] === DPO_SUCCESS
}

/** Map DPO result codes to user-friendly messages (per official DPO gateway docs) */
function getDpoErrorMessage(code: string, explanation: string): string {
  const codeMap: Record<string, string> = {
    '000': 'Payment successful',
    '801': 'Payment gateway error: missing company token.',
    '802': 'Payment gateway error: invalid or inactive company token. Please contact support.',
    '803': 'Payment gateway error: invalid request type.',
    '804': 'Payment gateway error: XML formatting error.',
    '901': 'Payment gateway error: field exceeds maximum length.',
    '902': 'Payment gateway error: missing mandatory fields.',
    '904': 'Payment gateway error: unsupported currency.',
    '905': 'Payment gateway error: transaction exceeds limit.',
    '906': 'Payment gateway error: monthly merchant limit exceeded.',
    '922': 'Payment gateway error: invalid provider reference.',
    '940': 'This order reference has already been paid.',
    '950': 'Payment gateway error: required tag missing.',
    '960': 'Payment gateway error: duplicate tag in request.',
  }
  return codeMap[code] ?? `Payment gateway error (${code}): ${explanation}`
}
