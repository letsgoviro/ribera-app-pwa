// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'organiser' | 'admin'
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'paid' | 'free' | 'donation' | 'online' | 'hybrid'
export type OrderStatus = 'pending' | 'reserved' | 'paid' | 'cancelled' | 'refunded'
export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'transferred'
export type TierType = 'general' | 'vip' | 'table' | 'seat' | 'standing' | 'online'
export type BoostStatus = 'active' | 'expired' | 'cancelled'
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type BoostPackage = 'spark' | 'flame' | 'inferno'
export type Currency = 'TZS' | 'KES' | 'UGX' | 'RWF' | 'ZAR' | 'USD'

// ─── User / Auth ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
  city: string | null
  created_at: string
}

export interface JwtPayload {
  sub: string
  role: UserRole
  email?: string
  phone?: string
  organiser_id?: string
  iat: number
  exp: number
}

// ─── Organiser ───────────────────────────────────────────────────────────────

export interface Organiser {
  id: string
  user_id: string
  org_name: string
  bio: string | null
  logo_url: string | null
  banner_url: string | null
  website: string | null
  id_doc_url: string | null
  social_links: Record<string, string>
  verified: boolean
  verified_at: string | null
  balance: number
  created_at: string
}

// ─── Event ────────────────────────────────────────────────────────────────────

export type EventCategory =
  | 'music'
  | 'sports'
  | 'arts'
  | 'food_drink'
  | 'nightlife'
  | 'comedy'
  | 'business'
  | 'other'

export interface Event {
  id: string
  organiser_id: string
  organiser?: Pick<Organiser, 'id' | 'org_name' | 'logo_url' | 'verified'>
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  gallery_urls: string[]
  category: EventCategory
  event_type: EventType
  venue_name: string | null
  address: string | null
  lat: number | null
  lng: number | null
  online_url: string | null
  venue_code: string | null
  timetable_url: string | null
  starts_at: string
  ends_at: string | null
  timezone: string
  status: EventStatus
  min_age: number
  allow_transfer: boolean
  refund_policy: string
  published_at: string | null
  cancelled_at: string | null
  created_at: string
  tiers?: TicketTier[]
  total_tickets?: number
  tickets_sold?: number
}

// ─── Ticket Tier ─────────────────────────────────────────────────────────────

export interface TicketTier {
  id: string
  event_id: string
  name: string
  description: string | null
  price: number
  currency: Currency
  quantity: number
  sold: number
  tier_type: TierType
  max_per_order: number
  seats_per_unit: number   // e.g. 8 for "Table for 8"
  sale_starts: string | null
  sale_ends: string | null
  sort_order: number
  available: number
}

// ─── Promo Code ───────────────────────────────────────────────────────────────

export interface PromoCode {
  id: string
  event_id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
}

// ─── Order ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  tier_id: string
  tier_name: string
  quantity: number
  unit_price: number
}

export interface Order {
  id: string
  user_id: string
  event_id: string
  event?: Pick<Event, 'id' | 'title' | 'starts_at' | 'cover_image_url' | 'venue_name'>
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  service_fee: number
  total: number
  currency: Currency
  promo_code_id: string | null
  discount_amount: number
  attendee_name: string
  attendee_email: string
  attendee_phone: string
  custom_fields: Record<string, string>
  dpo_token: string | null
  paid_at: string | null
  reserved_until: string | null
  created_at: string
}

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface Ticket {
  id: string
  order_id: string
  event_id: string
  event?: Pick<Event, 'id' | 'title' | 'starts_at' | 'ends_at' | 'cover_image_url' | 'venue_name' | 'address'>
  tier_id: string
  tier?: Pick<TicketTier, 'id' | 'name' | 'price' | 'currency' | 'tier_type' | 'seats_per_unit'>
  buyer_id: string
  holder_id: string
  qr_token: string
  status: TicketStatus
  checked_in_at: string | null
  transferred_at: string | null
  created_at: string
}

// ─── Boost ────────────────────────────────────────────────────────────────────

export interface BoostPackageDetail {
  id: BoostPackage
  name: string
  placement: string
  duration_days: number
  price_usd: number
  price_tzs: number
  description: string
}

export interface Boost {
  id: string
  event_id: string
  organiser_id: string
  package: BoostPackage
  placement: string
  price_paid: number
  currency: Currency
  starts_at: string
  ends_at: string
  status: BoostStatus
  impressions: number
  clicks: number
  created_at: string
}

// ─── Payout ───────────────────────────────────────────────────────────────────

export interface Payout {
  id: string
  organiser_id: string
  amount: number
  currency: Currency
  method: string
  account_details: Record<string, string>
  status: PayoutStatus
  requested_at: string
  processed_at: string | null
  reference: string | null
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface ApiError {
  error: string
  code?: string
  statusCode: number
}

// ─── DPO Pay ─────────────────────────────────────────────────────────────────

export interface DpoCreateTokenResponse {
  transaction_token: string
  payment_url: string
}

export interface DpoPaymentResult {
  success: boolean
  reference: string
  amount: number
  currency: string
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

export type ScanResult = 'valid' | 'already_used' | 'wrong_event' | 'cancelled' | 'invalid'

export interface ScanResponse {
  result: ScanResult
  ticket_id?: string
  holder_name?: string
  tier_name?: string
  checked_in_at?: string
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface OrganiserStats {
  total_events: number
  live_events: number
  tickets_sold_month: number
  revenue_month: number
  currency: Currency
  upcoming_events: Pick<Event, 'id' | 'title' | 'starts_at' | 'tickets_sold' | 'total_tickets'>[]
}

export interface AdminStats {
  total_events: number
  total_tickets_sold: number
  total_gmv: number
  ribera_revenue: number
  mau: number
  new_organisers_month: number
  pending_verifications: number
}
