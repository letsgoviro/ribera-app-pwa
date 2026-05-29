/**
 * Email service using Brevo REST API (@getbrevo/brevo SDK).
 * BREVO_API_KEY = xkeysib-... REST API key from Brevo dashboard → Settings → API Keys.
 */
import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env['BREVO_API_KEY']!)

const FROM = {
  email: process.env['FROM_EMAIL'] ?? 'support@riberaapp.me',
  name:  process.env['FROM_NAME']  ?? 'Ribera',
}

// TEST MODE: Set TEST_EMAIL_OVERRIDE in .env to redirect all emails to one inbox.
// Subjects get [TEST] prefix so you can identify them. Real recipients are logged but not emailed.
const TEST_OVERRIDE = process.env['TEST_EMAIL_OVERRIDE'] ?? null
const IS_DEV_EMAIL  = process.env['NODE_ENV'] !== 'production'

interface SendEmailParams {
  to: { email: string; name?: string }[]
  subject: string
  htmlContent: string
  textContent?: string
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  let recipients = params.to
  let subject    = params.subject

  if (TEST_OVERRIDE) {
    // Redirect all mail to override address — log original recipients
    console.log(`[EMAIL TEST] Would send "${subject}" to: ${params.to.map(t => t.email).join(', ')}`)
    recipients = [{ email: TEST_OVERRIDE, name: 'Test Inbox' }]
    subject    = `[TEST → ${params.to[0]?.email ?? 'unknown'}] ${subject}`
  } else if (IS_DEV_EMAIL) {
    console.log(`[EMAIL DEV] Sending "${subject}" to: ${params.to.map(t => t.email).join(', ')}`)
  }

  const email = new brevo.SendSmtpEmail()
  email.sender      = FROM
  email.to          = recipients
  email.subject     = params.subject
  email.htmlContent = params.htmlContent
  if (params.textContent) email.textContent = params.textContent

  try {
    await apiInstance.sendTransacEmail(email)
  } catch (err) {
    console.error('Brevo email error:', err)
    throw err
  }
}

export async function sendTicketConfirmation(params: {
  email: string
  name: string
  eventTitle: string
  eventDate: string
  venueName: string
  ticketId: string
  tierName: string
  qrToken: string
  orderId: string
}) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Your tickets for ${params.eventTitle} 🎉`,
    htmlContent: ticketConfirmationHtml(params),
  })
}

export async function sendEventCancellation(params: {
  email: string
  name: string
  eventTitle: string
  eventDate: string
  refundAmount: string
  currency: string
}) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Important: ${params.eventTitle} has been cancelled`,
    htmlContent: cancellationHtml(params),
  })
}

export async function sendOrganiserWelcome(params: { email: string; name: string; orgName: string }) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Welcome to Ribera, ${params.orgName}! 🎊`,
    htmlContent: organiserWelcomeHtml(params),
  })
}

export async function sendEventReminders(params: {
  eventTitle: string
  attendees: { email: string; name: string }[]
}) {
  if (params.attendees.length === 0) return
  // Send in batches to avoid rate limits
  const batchSize = 20
  for (let i = 0; i < params.attendees.length; i += batchSize) {
    const batch = params.attendees.slice(i, i + batchSize)
    await Promise.allSettled(
      batch.map((attendee) =>
        sendEmail({
          to: [{ email: attendee.email, name: attendee.name }],
          subject: `Reminder: ${params.eventTitle} is coming up! 🎟️`,
          htmlContent: eventReminderHtml({ ...attendee, eventTitle: params.eventTitle }),
        })
      )
    )
  }
}

export async function sendPayoutConfirmation(params: {
  email: string
  name: string
  orgName: string
  amount: number
  currency: string
  reference: string
}) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Payout confirmed — ${params.currency} ${params.amount.toLocaleString()}`,
    htmlContent: payoutConfirmationHtml(params),
  })
}

export async function sendOrganiserRejected(params: { email: string; name: string; reason: string }) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: 'Your Ribera organiser application',
    htmlContent: organiserRejectedHtml(params),
  })
}

// Sent to organiser whenever someone buys a ticket for their event
export async function sendOrganiserSaleNotification(params: {
  email: string
  name: string
  eventTitle: string
  attendeeName: string
  tierName: string
  quantity: number
  grossAmount: number  // total paid by buyer
  netAmount: number    // organiser earns (after fee)
  currency: string
  orderId: string
  totalSold: number
  totalCapacity: number
}) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `New sale: ${params.quantity}× ${params.tierName} for ${params.eventTitle} 🎟️`,
    htmlContent: organiserSaleNotificationHtml(params),
  })
}

// Sent to organiser when boost payment is confirmed and boost goes live
export async function sendBoostActivated(params: {
  email: string
  name: string
  eventTitle: string
  packageName: string
  durationDays: number
  endsAt: string
}) {
  await sendEmail({
    to: [{ email: params.email, name: params.name }],
    subject: `Your Boost is LIVE: ${params.eventTitle} ⚡`,
    htmlContent: boostActivatedHtml(params),
  })
}

// ─── HTML Templates ───────────────────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0A0F; color: #e5e5f0; margin: 0; padding: 0; line-height: 1.6; }
    .wrap { max-width: 580px; margin: 0 auto; padding: 0 20px 40px; }
    .header { padding: 32px 0 24px; }
    .logo-text { font-size: 22px; font-weight: 900; color: #0066FF; letter-spacing: -0.5px; }
    .card { background: #141420; border-radius: 14px; padding: 22px 24px; margin: 18px 0; border: 1px solid #1e1e30; }
    .row-label { color: #6b6b85; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px; }
    .row-value { color: #fff; font-size: 15px; font-weight: 600; }
    .chip { display: inline-block; background: rgba(0,102,255,0.15); color: #4d8fff; padding: 3px 11px; border-radius: 100px; font-size: 12px; font-weight: 700; }
    .btn { display: inline-block; background: #0066FF; color: #fff !important; text-decoration: none; padding: 13px 26px; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 20px; }
    .divider { border: none; border-top: 1px solid #1e1e30; margin: 18px 0; }
    .muted { color: #6b6b85; font-size: 13px; }
    .footer { color: #40405a; font-size: 12px; margin-top: 44px; padding-top: 20px; border-top: 1px solid #1a1a28; text-align: center; }
    .footer a { color: #40405a; }
    .money-big { font-size: 30px; font-weight: 900; color: #22C55E; }
    .danger { color: #EF4444; }
    .warn { color: #F59E0B; }
    p { margin: 12px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <span class="logo-text">Ribera</span>
    </div>
    ${content}
    <div class="footer">
      <p>Tanzania's favourite event ticketing app 🇹🇿</p>
      <p><a href="https://ribera.app">ribera.app</a> &nbsp;·&nbsp; <a href="mailto:support@riberaapp.me">support@riberaapp.me</a></p>
    </div>
  </div>
</body>
</html>`
}

function ticketConfirmationHtml(p: Parameters<typeof sendTicketConfirmation>[0]) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">You're all set, ${firstName}! 🎉</h1>
    <p style="color: #9090aa;">We've got your spot locked in. Here's everything you need for the big night.</p>

    <div class="card">
      <div style="font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 14px;">${p.eventTitle}</div>
      <div style="display: flex; gap: 24px; flex-wrap: wrap;">
        <div>
          <div class="row-label">Date &amp; Time</div>
          <div class="row-value">${p.eventDate}</div>
        </div>
        <div>
          <div class="row-label">Venue</div>
          <div class="row-value">${p.venueName}</div>
        </div>
      </div>
      <hr class="divider">
      <div>
        <div class="row-label">Your ticket</div>
        <div class="row-value"><span class="chip">${p.tierName}</span></div>
      </div>
    </div>

    <p class="muted" style="margin-top: 6px;">Your QR code is waiting in the Ribera app — just open <strong style="color:#e5e5f0;">My Tickets</strong> and show it at the door. No printing needed.</p>

    <a href="http://localhost:3000/wallet" class="btn">Open My Tickets →</a>

    <p class="muted" style="margin-top: 18px;">Questions? Just reply to this email and a real human will help.</p>
  `)
}

function cancellationHtml(p: Parameters<typeof sendEventCancellation>[0]) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">We're sorry, ${firstName} 😔</h1>
    <p style="color: #9090aa;"><strong style="color:#fff;">${p.eventTitle}</strong> on ${p.eventDate} has unfortunately been cancelled by the organiser.</p>

    <div class="card" style="border-color: #1a3a1a;">
      <div class="row-label">Your refund</div>
      <div class="money-big">${p.currency} ${p.refundAmount}</div>
      <p class="muted" style="margin-top: 10px;">This will be returned to your original payment method. It typically takes 3–5 business days to appear, depending on your bank.</p>
    </div>

    <p class="muted">We know this is disappointing. There are still plenty of great events happening — come find your next one.</p>

    <a href="http://localhost:3000" class="btn">Browse Events →</a>
  `)
}

function organiserWelcomeHtml(p: Parameters<typeof sendOrganiserWelcome>[0]) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">Welcome to Ribera, ${firstName}! 🎊</h1>
    <p style="color: #9090aa;">Your organiser account for <strong style="color:#fff;">${p.orgName}</strong> has been approved. You're ready to go — here's everything you can do right now.</p>

    <div class="card">
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e1e30;">
        <span style="font-size: 20px;">📅</span>
        <strong style="color:#fff; margin-left: 8px;">Create your first event</strong>
        <p class="muted" style="margin: 4px 0 0 28px;">Set it up in minutes — add your poster, ticket tiers, and go live.</p>
      </div>
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e1e30;">
        <span style="font-size: 20px;">📊</span>
        <strong style="color:#fff; margin-left: 8px;">Watch sales roll in</strong>
        <p class="muted" style="margin: 4px 0 0 28px;">Your dashboard shows real-time ticket sales, revenue, and check-ins.</p>
      </div>
      <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #1e1e30;">
        <span style="font-size: 20px;">📱</span>
        <strong style="color:#fff; margin-left: 8px;">Scan tickets on the door</strong>
        <p class="muted" style="margin: 4px 0 0 28px;">Use the built-in QR scanner — no extra hardware or apps needed.</p>
      </div>
      <div>
        <span style="font-size: 20px;">💸</span>
        <strong style="color:#fff; margin-left: 8px;">Get paid fast</strong>
        <p class="muted" style="margin: 4px 0 0 28px;">Request a payout any time from your dashboard. We process within 2 business days.</p>
      </div>
    </div>

    <a href="http://localhost:3002" class="btn">Open Your Dashboard →</a>

    <p class="muted" style="margin-top: 18px;">Need a hand getting set up? Reply to this email — we're here to help.</p>
  `)
}

function eventReminderHtml(p: { name: string; eventTitle: string }) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">It's almost time, ${firstName}! 🎟️</h1>
    <p style="color: #9090aa;"><strong style="color:#fff;">${p.eventTitle}</strong> is just around the corner. Here's how to make sure you get in smoothly.</p>

    <div class="card">
      <p style="color: #fff; font-weight: 700; margin: 0 0 10px;">Getting in is easy:</p>
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
        <div style="width: 24px; height: 24px; background: #0066FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">1</div>
        <p class="muted" style="margin: 2px 0 0;">Open the <strong style="color:#e5e5f0;">Ribera app</strong> on your phone</p>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
        <div style="width: 24px; height: 24px; background: #0066FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">2</div>
        <p class="muted" style="margin: 2px 0 0;">Tap <strong style="color:#e5e5f0;">My Tickets</strong> at the bottom</p>
      </div>
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 24px; height: 24px; background: #0066FF; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0;">3</div>
        <p class="muted" style="margin: 2px 0 0;">Show your <strong style="color:#e5e5f0;">QR code</strong> to the team at the entrance</p>
      </div>
    </div>

    <a href="http://localhost:3000/wallet" class="btn">Show My Ticket →</a>

    <p class="muted" style="margin-top: 18px;">Have a fantastic time! 🙌</p>
  `)
}

function payoutConfirmationHtml(p: Parameters<typeof sendPayoutConfirmation>[0]) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">Your money is on its way, ${firstName}! 💸</h1>
    <p style="color: #9090aa;">We've processed your payout from <strong style="color:#fff;">${p.orgName}</strong>. Here are the details.</p>

    <div class="card">
      <div class="row-label">Amount sent</div>
      <div class="money-big">${p.currency} ${p.amount.toLocaleString()}</div>
      <hr class="divider">
      <div class="row-label">Reference</div>
      <div class="row-value" style="font-family: monospace; font-size: 13px; letter-spacing: 0.5px;">${p.reference}</div>
    </div>

    <p class="muted">Funds usually arrive within 1–2 business days. If you haven't received it after 3 days, just reply to this email and we'll sort it out.</p>

    <a href="http://localhost:3002/payouts" class="btn">View Payout History →</a>
  `)
}

function organiserRejectedHtml(p: Parameters<typeof sendOrganiserRejected>[0]) {
  const firstName = p.name.split(' ')[0]
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">About your application, ${firstName}</h1>
    <p style="color: #9090aa;">Thank you for applying to become a Ribera organiser. After reviewing your application, we weren't able to approve it right now.</p>

    <div class="card" style="border-color: #3a1a1a;">
      <div class="row-label">What we found</div>
      <p style="color: #e5e5f0; margin: 6px 0 0; font-size: 14px;">${p.reason}</p>
    </div>

    <p class="muted">This isn't a permanent decision. Once you've addressed the issue above, you're welcome to apply again. We want to help you get on the platform — just reply to this email and we can guide you through it.</p>

    <a href="mailto:support@riberaapp.me" class="btn">Talk to Us →</a>
  `)
}

function organiserSaleNotificationHtml(p: Parameters<typeof sendOrganiserSaleNotification>[0]) {
  const soldPct = p.totalCapacity > 0 ? Math.round((p.totalSold / p.totalCapacity) * 100) : 0
  const firstName = p.name.split(' ')[0]
  const fee = p.grossAmount - p.netAmount
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">Ka-ching! New sale 🎉</h1>
    <p style="color: #9090aa;">Good news, ${firstName} — <strong style="color:#fff;">${p.attendeeName}</strong> just grabbed <strong style="color:#fff;">${p.quantity} × ${p.tierName}</strong> for <strong style="color:#fff;">${p.eventTitle}</strong>.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <div class="row-label">Tickets sold so far</div>
          <div class="row-value">${p.totalSold} of ${p.totalCapacity}</div>
        </div>
        <div style="text-align: right;">
          <div class="row-label">Sold out</div>
          <div class="row-value">${soldPct}%</div>
        </div>
      </div>
      <div style="height: 8px; background: #1e1e30; border-radius: 4px; overflow: hidden;">
        <div style="height: 100%; background: linear-gradient(90deg, #0066FF, #4d8fff); border-radius: 4px; width: ${soldPct}%; transition: width 0.3s;"></div>
      </div>
    </div>

    <div class="card">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="color: #6b6b85; padding: 7px 0;">Buyer paid</td>
          <td style="text-align: right; color: #e5e5f0; font-weight: 600;">${p.currency} ${p.grossAmount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="color: #6b6b85; padding: 7px 0;">Ribera fee (5%)</td>
          <td style="text-align: right;" class="danger">−${p.currency} ${fee.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #1e1e30;"></td>
          <td style="border-top: 1px solid #1e1e30;"></td>
        </tr>
        <tr>
          <td style="color: #fff; font-weight: 700; font-size: 16px; padding-top: 10px;">Your cut</td>
          <td style="text-align: right; padding-top: 10px;" class="money-big" style="font-size: 22px;">${p.currency} ${p.netAmount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <a href="http://localhost:3002/events/${p.orderId}" class="btn">See Full Dashboard →</a>
  `)
}

function boostActivatedHtml(p: Parameters<typeof sendBoostActivated>[0]) {
  return baseHtml(`
    <h1 style="font-size: 26px; font-weight: 800; color: #fff; margin: 0 0 6px;">Your boost just went live! ⚡</h1>
    <p style="color: #9090aa;"><strong style="color:#fff;">${p.eventTitle}</strong> is now in front of more people with the <strong style="color:#F59E0B;">${p.packageName}</strong> package.</p>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <div class="row-label">Package</div>
          <div class="row-value warn">⚡ ${p.packageName}</div>
        </div>
        <div>
          <div class="row-label">Duration</div>
          <div class="row-value">${p.durationDays} days</div>
        </div>
        <div>
          <div class="row-label">Expires</div>
          <div class="row-value">${p.endsAt}</div>
        </div>
      </div>
    </div>

    <div class="card" style="background: rgba(0,102,255,0.06); border-color: rgba(0,102,255,0.2);">
      <p style="color: #fff; font-weight: 700; margin: 0 0 12px; font-size: 14px;">What's active right now:</p>
      <p class="muted" style="margin: 0 0 8px;">🔝 &nbsp;<strong style="color:#e5e5f0;">Featured placement</strong> — your event shows first in search &amp; discover</p>
      <p class="muted" style="margin: 0 0 8px;">📧 &nbsp;<strong style="color:#e5e5f0;">Email reminders sent</strong> — existing attendees have been notified</p>
      <p class="muted" style="margin: 0;">📊 &nbsp;<strong style="color:#e5e5f0;">Analytics unlocked</strong> — see names, emails &amp; phones on your attendee list</p>
    </div>

    <a href="http://localhost:3002/events" class="btn">Track Performance →</a>

    <p class="muted" style="margin-top: 18px;">Questions about your boost? Just reply — we're watching. 🙌</p>
  `)
}
