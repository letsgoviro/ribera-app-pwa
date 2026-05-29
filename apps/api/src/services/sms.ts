/**
 * Brevo Transactional SMS Service
 * Uses Brevo REST API — charges per message (requires SMS credits on Brevo account).
 * Profit model: cost is bundled into Boost "Inferno" package price (TZS 87,500).
 * Brevo SMS docs: https://developers.brevo.com/reference/sendtransacsms
 *
 * SMS credits: Brevo free plan has 0 SMS credits — buy from Brevo dashboard → SMS credits.
 */
import axios from 'axios'

const BREVO_API_KEY = process.env['BREVO_API_KEY']!
const SMS_SENDER = process.env['SMS_SENDER'] ?? 'Ribera'

interface SmsParams {
  to: string   // E.164 format e.g. +255760727437
  content: string
}

async function sendSms(params: SmsParams): Promise<void> {
  // Normalise phone: strip spaces, ensure + prefix
  let phone = params.to.replace(/\s+/g, '')
  if (!phone.startsWith('+')) {
    // Tanzania numbers: 07xx → +25507xx
    phone = phone.startsWith('0') ? '+255' + phone.slice(1) : '+255' + phone
  }

  const response = await axios.post(
    'https://api.brevo.com/v3/transactionalSMS/sms',
    {
      sender: SMS_SENDER,
      recipient: phone,
      content: params.content,
      type: 'transactional',
    },
    {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      timeout: 15000,
      // Don't throw on 4xx — handle manually so we can surface credit errors
      validateStatus: () => true,
    }
  )

  if (response.status >= 400) {
    const body = response.data as { code?: string; message?: string }
    const msg = body?.message ?? `Brevo SMS error ${response.status}`
    console.error('Brevo SMS error:', body)
    throw new Error(msg)
  }
}

/** Send SMS ticket confirmation to a single buyer */
export async function sendTicketSmsConfirmation(params: {
  phone: string
  name: string
  eventTitle: string
  ticketId: string
  tierName: string
}) {
  const shortId = params.ticketId.slice(0, 8).toUpperCase()
  await sendSms({
    to: params.phone,
    content: `Hi ${params.name.split(' ')[0]}! Your Ribera ticket is confirmed.\n\nEvent: ${params.eventTitle}\nTier: ${params.tierName}\nID: ${shortId}\n\nShow QR at door: ribera.app/wallet`,
  })
}

/** Blast SMS to all attendees (Inferno boost package) */
export async function sendSmsBlast(params: {
  eventTitle: string
  attendees: { phone: string; name: string }[]
}) {
  if (params.attendees.length === 0) return

  // Process sequentially with 200ms gap to respect Brevo rate limits
  for (const attendee of params.attendees) {
    if (!attendee.phone) continue
    await sendSms({
      to: attendee.phone,
      content: `Hi ${attendee.name.split(' ')[0]}! Just a reminder: ${params.eventTitle} is coming up. Open Ribera to see your ticket: ribera.app/wallet`,
    })
    await new Promise(r => setTimeout(r, 200))
  }
}

/** Send SMS payout notification to organiser */
export async function sendPayoutSms(params: {
  phone: string
  name: string
  amount: number
  currency: string
}) {
  await sendSms({
    to: params.phone,
    content: `Hi ${params.name.split(' ')[0]}! Your Ribera payout of ${params.currency} ${params.amount.toLocaleString()} has been processed. Check your organiser dashboard for details.`,
  })
}
