# RIBERA V2 — Software Requirements Specification
**Version:** 2.0.0  
**Date:** 2026-05-26  
**Classification:** Internal — Product & Engineering  

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Business Model](#3-business-model)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Technology Stack](#5-technology-stack)
6. [Product Surfaces — Three PWAs](#6-product-surfaces--three-pwas)
7. [Functional Requirements — Customer PWA](#7-functional-requirements--customer-pwa)
8. [Functional Requirements — Organiser PWA](#8-functional-requirements--organiser-pwa)
9. [Functional Requirements — Admin Panel](#9-functional-requirements--admin-panel)
10. [Payment Integration — DPO Pay](#10-payment-integration--dpo-pay)
11. [Authentication & Authorization — Supabase](#11-authentication--authorization--supabase)
12. [Backend API — DigitalOcean](#12-backend-api--digitalocean)
13. [Email System — Brevo SMTP](#13-email-system--brevo-smtp)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Database Schema](#15-database-schema)
16. [User Flows](#16-user-flows)
17. [UI/UX Design Direction](#17-uiux-design-direction)
18. [Infrastructure & Deployment](#18-infrastructure--deployment)
19. [Revenue Projections & Pricing Model](#19-revenue-projections--pricing-model)
20. [Milestones & Roadmap](#20-milestones--roadmap)

---

## 1. EXECUTIVE SUMMARY

Ribera V2 is the complete rebuild of the Ribera event ticketing and discovery platform, purpose-built as a **Progressive Web App (PWA)** targeting the East and Central African market. The platform consists of **three distinct product surfaces**:

| Surface | URL | Audience |
|---|---|---|
| **Customer PWA** | `ribera.app` | General public — event-goers |
| **Organiser PWA** | `organise.ribera.app` | Event promoters, venues, organisers |
| **Admin Panel** | `admin.ribera.app` | Ribera internal team |

### Core Differentiators

- **Organiser-first economics:** Organisers pay absolutely nothing — zero commission, zero listing fees, zero monthly charges.
- **Buyer-side service fee:** Ribera charges a transparent 5% service fee on top of the ticket price, paid by the buyer at checkout.
- **DPO Pay:** Full African payment coverage — mobile money (M-Pesa, Airtel, Tigo), debit/credit cards, across 21 African countries.
- **Offline-first:** Tickets stored as offline-accessible QR codes; check-in scanner works without internet.
- **Event Boosting:** Paid promotional slots for organisers who want featured placement — second revenue stream.
- **Premium design:** Apple-quality UI with glassmorphism accents, fluid animations, and a dark-first aesthetic.

---

## 2. CURRENT STATE ANALYSIS

### Ribera V1 (ribera.app)
Based on analysis of the existing platform:

| Attribute | Current State |
|---|---|
| Market | Tanzania (primary) |
| Payments | AzamPay, ClickPesa |
| Distribution | Native mobile apps (Play Store + App Store) |
| Key feature | Offline QR wallet, instant payments |
| Gap | No web-first experience, no organiser self-serve portal, limited geography |

### V2 Goals vs V1 Gaps

| Gap in V1 | V2 Solution |
|---|---|
| App store dependency | PWA — installable, no store required |
| Tanzania-only payments | DPO Pay — 21 African countries |
| No self-serve organiser tools | Full organiser PWA |
| No admin visibility | Dedicated admin panel |
| Limited analytics | Real-time dashboards for organisers and admins |
| No promotional tools | Event Boosting system |

---

## 3. BUSINESS MODEL

### 3.1 Revenue Streams

#### Stream 1 — Service Fee (Primary)
- **Who pays:** Ticket buyer
- **Amount:** 5% of ticket face value
- **When:** Added transparently at checkout
- **Example:** TZS 20,000 ticket → buyer pays TZS 21,000 → Ribera earns TZS 1,000
- **Organiser impact:** Zero. They receive 100% of the face value.
- **Competitive advantage:** Eventbrite charges organisers 3.7%–8%. We charge them nothing.

#### Stream 2 — Event Boosting (Secondary)
Organisers can purchase promotional placement for their events:

| Boost Package | Placement | Duration | Price |
|---|---|---|---|
| **Spark** | Section feature on home | 3 days | $5 / TZS 12,500 |
| **Flame** | Homepage hero banner | 7 days | $15 / TZS 37,500 |
| **Inferno** | Push notification + homepage hero | 14 days | $35 / TZS 87,500 |

#### Stream 3 — Future (Post-MVP)
- Organiser analytics premium tier
- White-label ticketing for venues
- API access for third-party integrations

### 3.2 Fee Transparency
- Service fee shown clearly on ticket detail page before purchase
- Breakdown shown in cart: "Ticket price + 5% Ribera service fee"
- Receipt shows full breakdown
- No hidden fees, no surprises

### 3.3 Payout Flow
```
Buyer pays (face value + 5%) → DPO Pay collects → 
Ribera splits → Face value paid to organiser → 5% retained by Ribera
```
Payout frequency: T+2 business days (configurable per organiser).

---

## 4. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (PWA)                        │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │  ribera.app       │ │organise.ribera   │ │admin.ribera.app │  │
│  │  (Customer PWA)  │ │.app (Org PWA)    │ │  (Admin Panel)  │  │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬────────┘  │
└───────────┼─────────────────────┼───────────────────┼───────────┘
            │                     │                   │
            └──────────────┬──────┘                   │
                           ▼                          │
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Node.js)                         │
│               DigitalOcean App Platform ($5/mo)                  │
│  REST API + WebSockets for real-time | Rate limiting | Auth MW   │
└──────┬──────────────┬────────────────┬───────────────┬──────────┘
       │              │                │               │
       ▼              ▼                ▼               ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
│ Supabase │  │   DPO Pay    │  │  Brevo   │  │   DO Spaces  │
│ Auth +   │  │  Payment     │  │  SMTP    │  │  (Images &   │
│ Postgres │  │  Gateway     │  │  Email   │  │   Assets)    │
└──────────┘  └──────────────┘  └──────────┘  └──────────────┘
```

### Architecture Principles
1. **API-first:** All three PWAs consume the same REST API
2. **Stateless backend:** JWT-based auth, horizontally scalable
3. **Offline-first client:** Service Workers cache tickets and event data
4. **Event-driven:** Supabase Realtime pushes updates to dashboards
5. **Security at DB level:** Supabase RLS enforces data isolation

---

## 5. TECHNOLOGY STACK

### 5.1 Frontend (All Three PWAs)

| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Next.js 15** (React) | SSR for SEO, App Router, PWA support |
| Styling | **Tailwind CSS v4** | Utility-first, fast iteration |
| Animations | **Framer Motion** | Premium feel, gesture support |
| State | **Zustand** | Lightweight, no boilerplate |
| Data fetching | **TanStack Query v5** | Caching, background sync |
| PWA | **next-pwa** + Workbox | Service workers, offline cache |
| QR Generation | **qrcode.react** | Client-side QR rendering |
| QR Scanning | **html5-qrcode** | Camera-based QR reader |
| Charts | **Recharts** | Analytics dashboards |
| Icons | **Lucide React** | Consistent, lightweight |
| Forms | **React Hook Form + Zod** | Validation, type safety |

### 5.2 Backend

| Layer | Technology | Rationale |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Stable, wide ecosystem |
| Framework | **Fastify** | 3× faster than Express, schema validation |
| ORM | **Prisma** | Type-safe DB queries, migrations |
| Auth middleware | **Supabase JWT verify** | Validate tokens from Supabase Auth |
| WebSockets | **Fastify WebSocket** | Real-time check-in sync |
| QR signing | **jsonwebtoken** | Signed, tamper-proof ticket QR data |
| Rate limiting | **@fastify/rate-limit** | Abuse prevention |
| File uploads | **@fastify/multipart** | Event cover images |
| Testing | **Vitest + Supertest** | Fast unit + integration tests |

### 5.3 Auth — Supabase (Auth Only)

| Feature | Usage |
|---|---|
| **Supabase Auth** | OTP/SMS, Google OAuth, Apple OAuth, JWT |
| **JWT** | Tokens verified by API middleware |

Supabase is used **for authentication only**. All application data lives in DigitalOcean Managed PostgreSQL. This avoids Supabase free-tier database pause issues while keeping auth managed and cost-free.

**Supabase Plan:** Free tier — sufficient for auth-only usage (no DB pause risk).

### 5.4 Payment — DPO Pay

| Feature | Coverage |
|---|---|
| Mobile money | M-Pesa, Airtel Money, Tigo Pesa, MTN MoMo |
| Cards | Visa, Mastercard |
| Countries | 21 African countries |
| API | REST + XML/SOAP hybrid |
| Webhooks | Payment notification callbacks |
| Currencies | TZS, KES, UGX, ZAR, GHS, and more |

### 5.5 Infrastructure — DigitalOcean

| Service | Spec | Monthly Cost |
|---|---|---|
| **App Platform** (API) | Starter — 512MB RAM, 1 vCPU | $5/mo |
| **Managed Database** | Skip — use Supabase | $0 |
| **Spaces** (CDN + Storage) | 250GB storage, 1TB transfer | $5/mo |
| **Domain** | Already owned | $0 |
| **Total DigitalOcean** | | **~$10/mo** |

> Scale path: Move App Platform to Basic ($12/mo, 1GB RAM) when traffic grows.

### 5.6 Email — Brevo

| Feature | Detail |
|---|---|
| Free tier | 300 emails/day (9,000/month) — sufficient for MVP |
| SMTP | smtp-relay.brevo.com:587 |
| SDK | Official Node.js SDK |
| Templates | Drag-and-drop editor in Brevo dashboard |
| Transactional | Order confirmations, ticket delivery, OTP |
| Marketing | Event recommendations, newsletters |

### 5.7 Total Monthly Infrastructure Cost (MVP) — $5/month

| Service | Provider | Free Tier Used | Cost |
|---|---|---|---|
| **API** (Fastify/Node.js) | DO App Platform Basic | — | **$5/mo** |
| **Customer PWA** (ribera.app) | Vercel | 100GB bandwidth, unlimited deploys | $0 |
| **Organiser PWA** (organise.ribera.app) | Vercel | same | $0 |
| **Admin Panel** (admin.ribera.app) | Vercel | same | $0 |
| **PostgreSQL Database** | Supabase | 500MB storage, free forever | $0 |
| **Auth** (OTP, OAuth) | Supabase | Unlimited MAU on free | $0 |
| **File Storage** (event images) | Supabase Storage | 1GB free | $0 |
| **Email** | Brevo SMTP | 300 emails/day free | $0 |
| **DNS + SSL + CDN** | Cloudflare | Free forever | $0 |
| **TOTAL** | | | **$5/month** |

> Supabase free tier pauses after 7 days of DB inactivity. The `/health` endpoint queries the DB and is pinged every 5 days by [cron-job.org](https://cron-job.org) (free) to prevent pause.
> Scale path: Supabase Pro ($25/mo) only when DB > 450MB or needing guaranteed uptime SLA.

---

## 6. PRODUCT SURFACES — THREE PWAS

### 6.1 Surface Separation Strategy

```
ribera.app          → Single codebase, auto-detects role
                      / → Customer experience (default)
                      Logged-in as organiser → shows organiser shortcut

organise.ribera.app → Separate Next.js app optimised for:
                      Event creation, dashboard, scanner, payouts
                      Mobile-first for on-the-go management

admin.ribera.app    → Internal tooling — simpler UI, data-dense
                      Access only with @ribera.app email domain
```

### 6.2 Shared Between All Three
- Supabase Auth (same auth provider, different role claims)
- Same API (different permission levels via RLS + middleware)
- Same design system (shared component library)
- Same PWA manifest (but different app names/icons)

---

## 7. FUNCTIONAL REQUIREMENTS — CUSTOMER PWA

### 7.1 Event Discovery

**FR-C-001 — Homepage Feed**
- Hero section: Featured/Boosted events (full-width card with gradient overlay)
- "Happening This Weekend" horizontal scroll
- Category pills: Music, Sports, Arts, Food & Drink, Nightlife, Comedy, Business, Other
- "Near You" section (geolocation, optional — user prompted)
- Infinite scroll event grid

**FR-C-002 — Search & Filter**
- Full-text search (event name, venue, organiser)
- Filters: Category, Date range, Price range (Free / Under 10k / All), City/Town
- Sort: Date, Price (low→high), Popularity
- Search results update live as filters change

**FR-C-003 — Event Detail Page**
- Hero image (full-bleed, lazy-loaded)
- Event name, date/time, venue with map link
- Organiser profile card (tap to view all their events)
- Rich description (markdown rendered)
- Ticket tiers table (name, price, quantity remaining)
- Social proof: "X people are going"
- Share buttons: WhatsApp, Twitter/X, copy link
- Add to calendar (ICS file download)
- Embedded Google Maps preview

**FR-C-004 — Ticket Tiers**
Organiser can create up to 5 tiers per event:
- Free (no payment required, just registration)
- Standard
- VIP
- VVIP
- Early Bird (time-limited, auto-expires)

Each tier shows: name, price, what's included, availability (sold out state).

### 7.2 Authentication

**FR-C-010 — Sign Up / Login**
- Phone number + OTP (primary method for Africa)
- Email + password
- Google OAuth
- Apple OAuth (iOS Safari)
- Guest checkout (buy without account, account created post-purchase)

**FR-C-011 — Profile**
- Display name, avatar (upload or initial-based generated)
- Preferred city
- Notification preferences
- Linked payment methods (saved DPO tokenised cards)

### 7.3 Ticket Purchase Flow

**FR-C-020 — Cart**
- Select ticket tier + quantity (max 10 per transaction)
- Real-time availability (Supabase Realtime — updates if tickets sell out mid-session)
- Promo code field (organiser-defined discounts)
- Price breakdown: `Face value × qty + 5% service fee = Total`
- "Hold for 10 minutes" reservation to prevent overselling

**FR-C-021 — Checkout**
1. Confirm attendee details (name, email/phone)
2. Select payment method:
   - Mobile money (enter phone, push notification sent)
   - Card (tokenised via DPO, optional save)
3. Review order summary
4. Pay Now → DPO payment modal/redirect
5. Processing screen (webhook confirms payment)
6. Success screen → tickets in wallet

**FR-C-022 — Ticket Delivery**
- Immediate: tickets appear in app wallet
- Email: beautifully designed ticket PDF with QR code (Brevo)
- WhatsApp: optional ticket share link

**FR-C-023 — Wallet / My Tickets**
- List of purchased tickets (upcoming + past)
- Each ticket: event name, date, QR code, tier
- QR code cached offline via Service Worker
- Ticket detail: tap to fullscreen QR for scanning
- Transferable ticket (send to another phone number)

**FR-C-024 — Refund / Cancellation**
- Buyer can request refund up to 24 hours before event (if organiser allows)
- Refund initiated via DPO Pay reversal API
- Ribera service fee is non-refundable (shown upfront)

### 7.4 Discovery & Engagement

**FR-C-030 — Saved Events (Wishlist)**
- Bookmark events without buying
- Notifications when event is about to sell out or price changes

**FR-C-031 — Notifications**
- Push notifications (PWA Web Push)
- In-app notification center
- Types: Event reminder (1 day, 1 hour before), Ticket purchased, New events from followed organisers, Boost events in your area

**FR-C-032 — Follow Organisers**
- Follow/unfollow organisers
- Feed of events from followed organisers

**FR-C-033 — Event Recommendations**
- Based on: past purchases, saved events, category preferences, location
- "You might like" section

---

## 8. FUNCTIONAL REQUIREMENTS — ORGANISER PWA

> URL: `organise.ribera.app`  
> Access: Any verified organiser account  
> Tone: Professional, efficient, mobile-first (they manage events on the go)

### 8.1 Onboarding

**FR-O-001 — Organiser Verification**
- Sign up with name, organisation name, email, phone
- Upload: national ID or business registration (image upload to Supabase Storage)
- Admin reviews and approves (manual for MVP, automated later)
- Welcome email via Brevo with getting-started guide
- Profile: organiser bio, logo, banner image, social links, website

**FR-O-002 — Dashboard Home**
- Summary cards: Total events, tickets sold this month, revenue this month, upcoming events
- Quick actions: Create Event, View Scanner, Withdraw Funds
- Recent activity feed
- Upcoming events list

### 8.2 Event Management

**FR-O-010 — Create Event Wizard**
Step 1: Basic Info
- Event name (max 100 chars)
- Category (dropdown)
- Short description (shown on cards)
- Full description (rich text / markdown)
- Cover image upload (min 1600×900px)
- Optional: gallery images (up to 5)

Step 2: Date & Location
- Start date/time, end date/time
- Timezone (auto-detected, editable)
- Venue name + full address
- Google Maps location picker
- Online event option (Zoom/YouTube link)
- Recurring event option (daily, weekly)

Step 3: Tickets
- Add up to 5 ticket tiers
- Per tier: name, description, price (TZS/KES/USD), quantity, sale start/end date
- Free ticket option
- Group tickets (e.g., "Table of 6")
- Promo codes: % or fixed amount off, max uses, expiry

Step 4: Settings
- Minimum age requirement
- Ticket transfer allowed (yes/no)
- Refund policy (no refunds / 24h / 48h before event)
- Custom questions at checkout (e.g., dietary requirements, T-shirt size)
- Publish now or save as draft

**FR-O-011 — Edit Event**
- Edit all fields pre-event (restrictions if tickets already sold)
- Cannot reduce ticket quantity below already-sold amount
- Change notification sent to ticket holders if date/venue changes

**FR-O-012 — Cancel Event**
- Requires organiser confirmation
- Triggers auto-refund to all buyers
- Mass email via Brevo to all attendees
- Event marked as cancelled on platform

**FR-O-013 — Duplicate Event**
- Clone all settings of a past/current event
- Update date, then publish
- Useful for recurring events (weekly parties, monthly markets)

### 8.3 Sales Dashboard

**FR-O-020 — Real-Time Sales**
- Live counter: tickets sold / total tickets
- Revenue gauge (gross sales, before organiser payout)
- Sales by tier breakdown (bar chart)
- Sales over time (line chart — hourly on day of event, daily otherwise)
- Geographic breakdown (where buyers are from)

**FR-O-021 — Attendee List**
- Full list of ticket holders
- Columns: name, email, phone, tier, purchase date, check-in status
- Search and filter
- Export to CSV
- Mark attendees manually as checked-in (fallback)

**FR-O-022 — Promo Code Performance**
- Per-code stats: uses, revenue impact, conversion rate

### 8.4 QR Code Scanner (Event Day)

**FR-O-030 — Scanner Mode**
- Dedicated full-screen scanner interface
- Open device camera → reads QR codes
- Instant feedback:
  - ✅ Green flash + sound → valid, first scan
  - ❌ Red flash + sound → invalid / already used / wrong event
  - ⚠️ Yellow flash → valid but different ticket tier (VIP at standard gate)
- Shows: attendee name, ticket tier, timestamp
- Works offline — attendee list synced to device on scanner open
- Syncs all scans when connection restored
- Multiple devices can scan simultaneously (all see same check-in state via Realtime)

**FR-O-031 — Check-in Stats (Live)**
- Real-time: X checked in / Y total
- Rate: check-ins per minute (useful for queue management)
- Capacity percentage gauge

### 8.5 Payouts

**FR-O-040 — Payout Dashboard**
- Pending balance (tickets sold, not yet paid out)
- Available balance (T+2 from sale)
- Withdrawal history
- Per-event earnings breakdown

**FR-O-041 — Withdraw Funds**
- Bank transfer (Tanzanian bank accounts)
- Mobile money (M-Pesa, Airtel)
- Minimum withdrawal: TZS 10,000
- Processing time: 1–3 business days

### 8.6 Event Boosting

**FR-O-050 — Boost an Event**
- "Boost" button on any event card in dashboard
- Choose package: Spark / Flame / Inferno (see §3.1)
- Preview: see where your event will be placed
- Pay via DPO Pay (same gateway)
- Boost goes live immediately after payment
- Boost performance stats: impressions, clicks, conversion rate

---

## 9. FUNCTIONAL REQUIREMENTS — ADMIN PANEL

> URL: `admin.ribera.app`  
> Access: Ribera team only (email domain enforcement + 2FA required)

### 9.1 Platform Dashboard

**FR-A-001 — Overview**
- Total events (live, draft, cancelled)
- Total tickets sold (all time, this month)
- Total GMV (gross merchandise value)
- Ribera revenue (5% fees collected)
- Active users (MAU, DAU)
- New registrations (customers + organisers)

### 9.2 Organiser Management

**FR-A-010 — Organiser List**
- All organiser accounts
- Status: pending verification / verified / suspended
- Quick approve / reject verification requests
- View organiser's events, revenue, withdrawal history

**FR-A-011 — Organiser Verification Queue**
- Pending verifications in chronological order
- View uploaded ID documents
- Approve → sends welcome email
- Reject → sends rejection reason email (template in Brevo)

### 9.3 Event Moderation

**FR-A-020 — Event Review**
- All events flagged by users
- Manual review queue
- Approve / Remove / Request changes
- Ability to feature events (adds to homepage boost without charge)

**FR-A-021 — Event List**
- All events across all organisers
- Filter: status, category, organiser, date
- View any event as a user would see it

### 9.4 User Management

**FR-A-030 — User List**
- All customer accounts
- Search by email, phone, name
- View purchase history
- Suspend account (blocks login)
- Issue refund manually

### 9.5 Financial Management

**FR-A-040 — Revenue Dashboard**
- Daily/weekly/monthly fee revenue (5% collected)
- Pending organiser payouts
- Boost revenue
- DPO reconciliation view

**FR-A-041 — Payout Approval**
- Review organiser withdrawal requests
- Mark as processed
- Record payment reference

### 9.6 Boost Campaign Management

**FR-A-050 — Active Boosts**
- All currently running boosts
- Placement preview
- Expiry dates
- Extend or cancel boosts

**FR-A-051 — Boost Analytics**
- Total boost revenue this month
- Most popular packages
- ROI metrics for organisers (to use in marketing)

### 9.7 System Settings

**FR-A-060 — Configuration**
- Service fee percentage (currently 5%) — editable without redeploy
- Boost package prices and descriptions
- Supported cities/regions
- Event categories (add/remove/rename)
- Feature flags (turn on/off features per environment)

---

## 10. PAYMENT INTEGRATION — DPO PAY

### 10.1 DPO Pay Overview
DPO Pay (formerly Direct Pay Online) is Africa's leading payment gateway, covering 21 countries with support for mobile money and card payments.

- **API Base URL:** `https://secure.3gdirectpay.com/API/v6/`
- **Auth:** Company token (stored in environment variable)
- **Flow:** Create Token → Redirect to payment page → Webhook callback

### 10.2 Payment Flow

```
1. Customer clicks "Pay Now"
   └─ Backend: POST /payment/create-token
      └─ DPO API: CreateToken request
         └─ Returns: TransactionToken

2. Frontend redirects to DPO payment page
   └─ URL: https://secure.3gdirectpay.com/payv2.php?ID={TransactionToken}

3. Customer completes payment on DPO page

4. DPO sends webhook to: /webhooks/dpo/payment-callback
   └─ Backend verifies payment: VerifyToken request
   └─ Updates order status in DB
   └─ Generates QR ticket
   └─ Sends confirmation email via Brevo
   └─ Releases ticket to buyer wallet
   └─ Credits organiser balance (face value)
   └─ Records Ribera fee (5%)
```

### 10.3 DPO API Calls

| Action | DPO Method | Description |
|---|---|---|
| Initiate payment | `createToken` | Create payment session |
| Verify payment | `verifyToken` | Confirm payment success |
| Refund | `refundToken` | Reverse a completed payment |
| Check status | `getTransactionStatus` | Poll for payment status |

### 10.4 Security
- Webhook signature verified with DPO secret
- All payment tokens single-use, expire in 30 minutes
- Card data never touches Ribera servers (DPO handles PCI compliance)
- HTTPS enforced on all payment endpoints

### 10.5 Supported Countries & Currencies (Phase 1)

| Country | Currency | Mobile Money |
|---|---|---|
| Tanzania | TZS | M-Pesa, Airtel, Tigo |
| Kenya | KES | M-Pesa, Airtel |
| Uganda | UGX | MTN MoMo, Airtel |
| Rwanda | RWF | MTN MoMo |
| South Africa | ZAR | Cards only (Phase 2) |

---

## 11. AUTHENTICATION & AUTHORIZATION — SUPABASE

### 11.1 Auth Methods

| Method | Use Case |
|---|---|
| Phone OTP | Primary — most African users don't have email |
| Email + Password | Secondary |
| Google OAuth | For users with Google accounts |
| Apple OAuth | For iOS Safari users |

### 11.2 User Roles

```sql
-- Stored in Supabase Auth metadata + profiles table
enum user_role {
  customer,      -- default on signup
  organiser,     -- after verification approved
  admin          -- internal team only
}
```

### 11.3 Role-Based Access Control

| Role | Customer PWA | Organiser PWA | Admin Panel |
|---|---|---|---|
| `customer` | Full access | Redirect to signup | Denied |
| `organiser` | Full access | Full access | Denied |
| `admin` | Full access | Full access | Full access |

### 11.4 Row Level Security Policies (Key Tables)

```sql
-- Events: organisers see only their own in management
CREATE POLICY "organiser_owns_event" ON events
  FOR ALL USING (organiser_id = auth.uid());

-- Orders: users see only their own orders
CREATE POLICY "user_owns_orders" ON orders
  FOR ALL USING (user_id = auth.uid());

-- Tickets: users see only their own tickets
CREATE POLICY "user_owns_tickets" ON tickets
  FOR ALL USING (buyer_id = auth.uid());

-- Admin bypass: admin role can see everything
CREATE POLICY "admin_all" ON events
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
```

### 11.5 JWT Structure
```json
{
  "sub": "user-uuid",
  "role": "organiser",
  "email": "user@example.com",
  "phone": "+255712345678",
  "organiser_id": "org-uuid",
  "iat": 1716739200,
  "exp": 1716825600
}
```

Custom claims injected via Supabase Auth Hook (Edge Function) on login.

---

## 12. BACKEND API — DIGITALOCEAN

### 12.1 Deployment
- **Platform:** DigitalOcean App Platform (Starter — $5/mo)
- **Runtime:** Node.js 20
- **Framework:** Fastify
- **Auto-deploy:** from GitHub main branch
- **Environment:** All secrets stored as DO App Platform env vars (encrypted)

### 12.2 API Structure

```
/api/v1/
├── auth/
│   ├── POST /verify-token        # Validate Supabase JWT
│   └── POST /refresh             # Refresh session
├── events/
│   ├── GET  /                    # List events (paginated, filtered)
│   ├── GET  /:id                 # Single event detail
│   ├── POST /                    # Create event (organiser+)
│   ├── PUT  /:id                 # Update event (owner only)
│   └── DELETE /:id               # Cancel event (owner only)
├── tickets/
│   ├── GET  /my                  # My purchased tickets
│   ├── GET  /:id/qr              # Get QR data for ticket
│   └── POST /:id/transfer        # Transfer ticket to another user
├── orders/
│   ├── POST /                    # Create order & reserve tickets
│   ├── GET  /:id                 # Order status
│   └── POST /:id/cancel          # Cancel order
├── payment/
│   ├── POST /create-token        # Init DPO payment session
│   ├── POST /verify              # Verify completed payment
│   └── POST /refund              # Request refund
├── scanner/
│   ├── GET  /event/:id/attendees # Download attendee list for offline
│   └── POST /check-in            # Mark ticket as checked in
├── organiser/
│   ├── GET  /dashboard           # Organiser stats
│   ├── GET  /events              # Their events
│   ├── GET  /payouts             # Payout history
│   └── POST /withdraw            # Request payout
├── boost/
│   ├── GET  /packages            # Available boost packages
│   └── POST /purchase            # Buy a boost
├── admin/
│   ├── GET  /overview            # Platform stats
│   ├── GET  /organisers          # All organisers
│   ├── PUT  /organisers/:id/verify # Approve/reject
│   └── GET  /revenue             # Financial overview
└── webhooks/
    └── POST /dpo/callback        # DPO payment webhook
```

### 12.3 Key Middleware
- `authenticateJWT` — Supabase JWT verification on protected routes
- `requireRole(role)` — Role check (customer/organiser/admin)
- `rateLimiter` — 100 req/min general, 10 req/min payment endpoints
- `validateSchema` — Zod schema validation on all request bodies
- `requestLogger` — Structured JSON logs to DO App Platform logs

---

## 13. EMAIL SYSTEM — BREVO SMTP

### 13.1 Transactional Emails (Auto-sent)

| Trigger | Template Name | Key Content |
|---|---|---|
| Ticket purchased | `ticket-confirmation` | PDF attachment with QR code, order summary |
| Event cancelled | `event-cancelled` | Refund info, apology, alternative events |
| Event updated | `event-updated` | What changed, new details |
| Organiser verified | `organiser-welcome` | Getting started guide, dashboard link |
| Organiser rejected | `organiser-rejected` | Reason, how to re-apply |
| Payout processed | `payout-sent` | Amount, reference, expected arrival |
| OTP / Magic link | `auth-otp` | 6-digit OTP code |
| Refund issued | `refund-confirmation` | Amount, timeline |

### 13.2 Marketing Emails (Manual / Scheduled)
- "Events This Weekend" — weekly digest
- "New events from organisers you follow" — triggered
- "Your event is tomorrow!" — reminder 24h before

### 13.3 SMTP Configuration
```
Host: smtp-relay.brevo.com
Port: 587
Security: STARTTLS
Auth: Username (Brevo account email) + API key as password
From: tickets@ribera.app
Reply-to: support@ribera.app
```

### 13.4 Ticket PDF Email
- Branded Ribera header
- Event name, date, venue
- QR code (large, centered)
- Ticket tier and holder name
- Unique ticket ID
- Barcode (backup to QR)
- Footer: help links, social media

---

## 14. NON-FUNCTIONAL REQUIREMENTS

### 14.1 Performance

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.5s (3G connection) |
| Time to Interactive | < 3s |
| Core Web Vitals LCP | < 2.5s |
| Lighthouse PWA Score | > 90 |
| API response time (p50) | < 200ms |
| API response time (p99) | < 1000ms |
| Ticket QR render | < 100ms |

### 14.2 Reliability

| Metric | Target |
|---|---|
| API uptime | 99.5% |
| Payment success rate | 99% (dependent on DPO) |
| Offline ticket access | 100% (cached in service worker) |
| Check-in scanner offline | Works for up to 72h without internet |

### 14.3 Scalability

| Scenario | Capacity |
|---|---|
| Concurrent users (MVP) | 500 |
| Concurrent users (6 months) | 5,000 |
| Tickets per transaction batch | Up to 10 |
| Events per organiser | Unlimited |
| Check-in scans per second | 10 per scanner device |

### 14.4 Security

- All traffic HTTPS/TLS 1.3
- JWT expiry: 1 hour access token, 7 days refresh token
- Rate limiting on auth endpoints: 5 attempts per 15 minutes per IP
- Payment data: never stored on Ribera servers
- QR codes: signed JWTs (tamper-evident, expire 30 days)
- Admin panel: 2FA enforced (TOTP)
- OWASP Top 10 compliance
- CORS: whitelist only ribera.app domains

### 14.5 Accessibility

- WCAG 2.1 AA compliance
- Screen reader compatible (ARIA labels)
- High contrast mode support
- Minimum touch target: 44×44px
- Text scale support (up to 200%)

### 14.6 PWA Requirements

| Feature | Specification |
|---|---|
| Install prompt | Shown after 3rd visit or after ticket purchase |
| App icon | 192×192, 512×512 PNG |
| Splash screen | Ribera branded, dark background |
| Offline page | Custom offline page with wallet access |
| Background sync | Sync pending actions when back online |
| Push notifications | Web Push (Chrome, Firefox, Safari 16.4+) |
| Service worker | Stale-while-revalidate caching strategy |

---

## 15. DATABASE SCHEMA

### Core Tables

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  avatar_url  TEXT,
  phone       TEXT UNIQUE,
  role        user_role DEFAULT 'customer',
  city        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Organisers
CREATE TABLE organisers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id) UNIQUE,
  org_name      TEXT NOT NULL,
  bio           TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  website       TEXT,
  social_links  JSONB DEFAULT '{}',
  verified      BOOLEAN DEFAULT false,
  verified_at   TIMESTAMPTZ,
  id_doc_url    TEXT,
  balance       BIGINT DEFAULT 0, -- in smallest currency unit (cents/coins)
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id    UUID REFERENCES organisers(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  gallery_urls    TEXT[] DEFAULT '{}',
  category        TEXT NOT NULL,
  venue_name      TEXT,
  address         TEXT,
  lat             DECIMAL(10,8),
  lng             DECIMAL(11,8),
  online_url      TEXT,
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ,
  timezone        TEXT DEFAULT 'Africa/Dar_es_Salaam',
  status          event_status DEFAULT 'draft',
  min_age         INT DEFAULT 0,
  allow_transfer  BOOLEAN DEFAULT true,
  refund_policy   TEXT DEFAULT '24h',
  published_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Ticket Tiers
CREATE TABLE ticket_tiers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         BIGINT NOT NULL, -- in TZS (or local currency)
  currency      CHAR(3) DEFAULT 'TZS',
  quantity      INT NOT NULL,
  sold          INT DEFAULT 0,
  sale_starts   TIMESTAMPTZ,
  sale_ends     TIMESTAMPTZ,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Promo Codes
CREATE TABLE promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percent','fixed')),
  discount_value BIGINT NOT NULL,
  max_uses      INT,
  used_count    INT DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, code)
);

-- Orders
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES profiles(id),
  event_id        UUID REFERENCES events(id),
  status          order_status DEFAULT 'pending',
  subtotal        BIGINT NOT NULL, -- face value total
  service_fee     BIGINT NOT NULL, -- 5% of subtotal
  total           BIGINT NOT NULL, -- subtotal + service_fee
  currency        CHAR(3) DEFAULT 'TZS',
  promo_code_id   UUID REFERENCES promo_codes(id),
  discount_amount BIGINT DEFAULT 0,
  dpo_token       TEXT,            -- DPO transaction token
  dpo_ref         TEXT,            -- DPO payment reference
  attendee_name   TEXT,
  attendee_email  TEXT,
  attendee_phone  TEXT,
  custom_fields   JSONB DEFAULT '{}',
  reserved_until  TIMESTAMPTZ,     -- 10-min hold
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Tickets (individual seats/passes)
CREATE TABLE tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES events(id),
  tier_id       UUID REFERENCES ticket_tiers(id),
  buyer_id      UUID REFERENCES profiles(id),
  holder_id     UUID REFERENCES profiles(id),  -- may differ after transfer
  qr_token      TEXT UNIQUE NOT NULL,  -- signed JWT for QR
  status        ticket_status DEFAULT 'valid',
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID,  -- scanner device/user
  transferred_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Boosts
CREATE TABLE boosts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID REFERENCES events(id),
  organiser_id  UUID REFERENCES organisers(id),
  package       TEXT NOT NULL,  -- spark, flame, inferno
  placement     TEXT NOT NULL,
  price_paid    BIGINT NOT NULL,
  currency      CHAR(3) DEFAULT 'TZS',
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  dpo_ref       TEXT,
  status        boost_status DEFAULT 'active',
  impressions   INT DEFAULT 0,
  clicks        INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Payouts
CREATE TABLE payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id    UUID REFERENCES organisers(id),
  amount          BIGINT NOT NULL,
  currency        CHAR(3) DEFAULT 'TZS',
  method          TEXT,  -- bank_transfer, mpesa, airtel
  account_details JSONB,
  status          payout_status DEFAULT 'pending',
  requested_at    TIMESTAMPTZ DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  admin_note      TEXT,
  reference       TEXT
);

-- Enum Types
CREATE TYPE user_role AS ENUM ('customer', 'organiser', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE order_status AS ENUM ('pending', 'reserved', 'paid', 'cancelled', 'refunded');
CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled', 'transferred');
CREATE TYPE boost_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
```

### Key Indexes
```sql
CREATE INDEX idx_events_organiser ON events(organiser_id);
CREATE INDEX idx_events_status_starts ON events(status, starts_at);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_buyer ON tickets(buyer_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_token);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_boosts_active ON boosts(status, ends_at) WHERE status = 'active';
```

---

## 16. USER FLOWS

### 16.1 Customer — Buy a Ticket

```
Homepage → Browse events → Tap event card
  → Event detail page → "Get Tickets"
    → Select tier + quantity → Cart
      → Apply promo code (optional)
        → Review: subtotal + 5% service fee = total
          → Continue → Fill attendee details
            → Choose payment: Mobile Money / Card
              → DPO payment page
                → Payment success
                  → Confirmation screen 🎉
                    → Ticket in wallet (QR ready offline)
                    → Confirmation email sent
```

### 16.2 Organiser — Create & Publish Event

```
Organiser dashboard → "Create Event"
  → Step 1: Basic Info (name, category, description, image)
    → Step 2: Date & Location
      → Step 3: Ticket Tiers (add 1–5 tiers)
        → Step 4: Settings (refund, age, transfer)
          → Preview → "Publish" → Event live on ribera.app
            → Share links generated
              → Optional: Boost event for more visibility
```

### 16.3 Organiser — Event Day Check-in

```
Organiser PWA → "Scanner" → Select event
  → Attendee list synced offline (cached)
    → Camera opens in scanner mode
      → Customer shows QR ticket
        → Scan → ✅ "John Doe — VIP — Valid"
          → Tap to confirm or auto-confirm after 2s
            → Next attendee
```

### 16.4 Refund Flow

```
Customer: Order history → Select order → "Request Refund"
  → Reason (optional) → Confirm → Request submitted
    → Admin notified → Review → Approve
      → DPO refundToken API called
        → Money back to original payment method (3–5 days)
          → Email confirmation sent to customer
```

---

## 17. UI/UX DESIGN DIRECTION

### 17.1 Design Philosophy
**"Premium African Digital" —** The aesthetic of Apple-level polish meets the vibrancy of African event culture. Bold typography, rich imagery, dark-first UI with luminous colour accents.

### 17.2 Visual Identity

| Element | Specification |
|---|---|
| **Primary colour** | Electric Blue `#0066FF` |
| **Accent** | Warm Gold `#F5A623` |
| **Background (dark)** | `#0A0A0F` (near-black) |
| **Surface** | `#141420` (elevated cards) |
| **Text primary** | `#FFFFFF` |
| **Text secondary** | `#8A8AA0` |
| **Success** | `#22C55E` |
| **Error** | `#EF4444` |

### 17.3 Typography

| Use | Font | Weight |
|---|---|---|
| Headings | **Inter** (or Clash Display for hero) | 700–900 |
| Body | **Inter** | 400–500 |
| Mono (ticket IDs) | **JetBrains Mono** | 400 |

### 17.4 Key Design Patterns

**Event Cards:**
- Full-bleed hero image with gradient overlay
- Event name in white bold over image
- Date pill (coloured by category), venue, price badge
- Sold-out state: grayscale + "Sold Out" overlay

**Ticket Wallet:**
- Dark card with subtle gradient border (glassmorphism)
- Event thumbnail on left, QR code on right (tap to expand)
- Tier badge with colour coding
- "Valid" badge pulsing green animation

**Scanner UI:**
- Full-screen black background
- Animated scan frame with corner brackets (Apple Wallet-style)
- Large typography for feedback ("VALID" in green, "ALREADY USED" in red)
- Haptic feedback (vibrate API) for success/failure

**Organiser Dashboard:**
- Dark sidebar on desktop, bottom nav on mobile
- Stat cards with subtle glow in brand colour
- Charts: minimal, dark-background, electric blue lines

### 17.5 Animations
- Page transitions: slide + fade (120ms)
- Card hover: scale 1.02, shadow lift
- QR ticket reveal: flip card animation
- Success state: confetti burst (canvas-confetti)
- Loading: skeleton screens (never spinners)
- Scanner feedback: colour flash fills entire screen

### 17.6 Mobile-First Breakpoints
```
Mobile:  320–767px   (primary — most users)
Tablet:  768–1023px
Desktop: 1024px+     (organiser dashboard, admin panel)
```

---

## 18. INFRASTRUCTURE & DEPLOYMENT

### 18.1 Environment Setup

| Environment | URL | Purpose |
|---|---|---|
| Development | localhost:3000, :3001, :3002 | Local dev |
| Staging | staging.ribera.app | Pre-prod testing |
| Production | ribera.app | Live |

### 18.2 DigitalOcean App Platform Setup

```yaml
# .do/app.yaml
name: ribera-api
services:
  - name: api
    github:
      repo: your-org/ribera-api
      branch: main
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    instance_size_slug: apps-s-1vcpu-0.5gb  # $5/mo starter
    instance_count: 1
    http_port: 3000
    health_check:
      http_path: /health
    envs:
      - key: SUPABASE_URL
        scope: RUN_TIME
        type: SECRET
      - key: SUPABASE_SERVICE_KEY
        scope: RUN_TIME
        type: SECRET
      - key: DPO_COMPANY_TOKEN
        scope: RUN_TIME
        type: SECRET
      - key: BREVO_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: QR_JWT_SECRET
        scope: RUN_TIME
        type: SECRET
```

### 18.3 CI/CD Pipeline

```
GitHub Push → GitHub Actions:
  1. Run tests (Vitest)
  2. Type check (tsc --noEmit)
  3. Lint (ESLint)
  4. Build (Next.js / Fastify)
  5. Deploy to DO App Platform (auto on main branch)
  6. Notify Slack on success/failure
```

### 18.4 Monitoring (Free Tier)
- **Uptime:** UptimeRobot (free)
- **Error tracking:** Sentry (free tier — 5K events/month)
- **Logs:** DigitalOcean App Platform built-in logs
- **Analytics:** Plausible or self-hosted Umami (privacy-first)

### 18.5 Backup Strategy
- Supabase: daily automatic backups (included)
- DigitalOcean Spaces: versioning enabled
- Database dumps: weekly to Spaces (automated script)

---

## 19. REVENUE PROJECTIONS & PRICING MODEL

### 19.1 MVP Revenue Scenarios (Month 6)

| Scenario | Monthly Tickets | Avg Ticket Price | GMV | Ribera Revenue (5%) |
|---|---|---|---|---|
| Conservative | 500 | TZS 15,000 | TZS 7.5M | TZS 375,000 (~$145) |
| Moderate | 2,000 | TZS 20,000 | TZS 40M | TZS 2,000,000 (~$775) |
| Optimistic | 10,000 | TZS 25,000 | TZS 250M | TZS 12,500,000 (~$4,800) |

### 19.2 Boost Revenue (Month 6 estimate)
- 20 active organisers × avg 2 boosts/month × avg $10/boost = **$400/month**

### 19.3 Break-even Point
- Infrastructure cost: ~$10/month
- Break-even: ~7 tickets sold at TZS 15,000 each
- **This platform is essentially self-sustaining from day 1 with minimal sales.**

---

## 20. MILESTONES & ROADMAP

### Phase 1 — MVP (Weeks 1–8)
**Goal:** Core ticketing loop working end-to-end

| Week | Deliverable |
|---|---|
| 1–2 | Supabase setup, auth (OTP + Google), DB schema, RLS policies |
| 2–3 | Fastify API: events, tickets, orders endpoints |
| 3–4 | DPO Pay integration (create token, webhook, verify) |
| 4–5 | Customer PWA: homepage, event detail, checkout, wallet |
| 5–6 | Organiser PWA: create event, basic dashboard, QR scanner |
| 6–7 | Brevo email templates, ticket PDF generation |
| 7–8 | Admin panel: organiser verification, event list |
| 8 | Deploy to DigitalOcean, end-to-end testing, soft launch |

### Phase 2 — Growth (Weeks 9–16)
| Feature | Priority |
|---|---|
| Event Boosting system | High |
| Organiser payout system | High |
| Push notifications (Web Push) | High |
| Promo codes | Medium |
| Follow organisers | Medium |
| Social sharing (WhatsApp deep links) | Medium |
| Ticket transfer | Medium |
| Multi-currency (KES, UGX) | Medium |
| Advanced analytics dashboard | Low |

### Phase 3 — Scale (Month 6+)
- Native-quality PWA optimisations
- Dedicated check-in app (Organiser PWA installed as PWA on scanner tablets)
- Kenya market launch (KES, local payment methods)
- White-label offering for venues
- API for third-party integrations
- Loyalty/points programme

---

## APPENDIX A — THIRD-PARTY SERVICE LINKS

| Service | Link | Purpose |
|---|---|---|
| Supabase | supabase.com | Auth + Database |
| DPO Pay API | docs.dpopay.com | Payments |
| Brevo | brevo.com | Email |
| DigitalOcean | digitalocean.com | Hosting |
| DigitalOcean Spaces | digitalocean.com/products/spaces | CDN + Storage |

## APPENDIX B — ENVIRONMENT VARIABLES

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# DPO Pay
DPO_COMPANY_TOKEN=
DPO_SERVICE_TYPE=
DPO_CURRENCY=TZS
DPO_ENVIRONMENT=production  # or sandbox

# Brevo
BREVO_API_KEY=
BREVO_SMTP_USER=
BREVO_SMTP_KEY=
FROM_EMAIL=tickets@ribera.app

# App
QR_JWT_SECRET=          # Used to sign ticket QR tokens
APP_URL=https://ribera.app
ADMIN_EMAIL_DOMAIN=ribera.app

# DigitalOcean Spaces
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_ENDPOINT=
DO_SPACES_BUCKET=

# Feature flags
ENABLE_BOOST=true
SERVICE_FEE_PERCENT=5
```

---

*Document prepared by Claude Code for Ribera Product Team — May 2026*  
*Based on: ribera.app product analysis, DPO Pay API documentation, Supabase architecture patterns, DigitalOcean pricing, Brevo SMTP capabilities, and competitive analysis of leading African and global event ticketing platforms.*
