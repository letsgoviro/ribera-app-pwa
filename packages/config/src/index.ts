// ─── Brand ───────────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Ribera',
  tagline: 'The Best Event Ticketing & Discovery App',
  primaryColor: '#0066FF',
  accentColor: '#F5A623',
  email: {
    support: 'support@ribera.app',
    tickets: 'tickets@ribera.app',
    noreply: 'noreply@ribera.app',
  },
  social: {
    twitter: 'https://twitter.com/riberaapp',
    instagram: 'https://instagram.com/riberaapp',
  },
} as const

// ─── Service Fee ─────────────────────────────────────────────────────────────

export const SERVICE_FEE_PERCENT = 5 // 5% added on top of ticket price, paid by buyer

// ─── Boost Packages ──────────────────────────────────────────────────────────

export const BOOST_PACKAGES = [
  {
    id: 'spark',
    name: 'Spark',
    tagline: 'Get noticed',
    placement: 'Trending section on homepage',
    duration_days: 7,
    price_usd: 10,
    price_tzs: 25_000,
    description: 'Perfect for local events — your event shows in the Trending section for a week.',
    features: [
      { label: 'Trending section placement', included: true },
      { label: 'Full attendee analytics (name, email, phone)', included: true },
      { label: '25 email reminders to existing attendees', included: true },
      { label: 'Push notification to nearby users', included: false },
      { label: 'SMS blast to attendee list', included: false },
    ],
    badge: null,
  },
  {
    id: 'flame',
    name: 'Flame',
    tagline: 'Sell faster',
    placement: 'Homepage hero banner',
    duration_days: 14,
    price_usd: 30,
    price_tzs: 75_000,
    description: 'Double the visibility — hero banner placement plus push notifications to nearby users.',
    features: [
      { label: 'Homepage hero banner (top of app)', included: true },
      { label: 'Full attendee analytics (name, email, phone)', included: true },
      { label: '50 email reminders to existing attendees', included: true },
      { label: 'Push notification to 500+ nearby users', included: true },
      { label: 'SMS blast to attendee list', included: false },
    ],
    badge: 'Popular',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    tagline: 'Sell out',
    placement: 'Hero banner + push + SMS blast',
    duration_days: 30,
    price_usd: 70,
    price_tzs: 175_000,
    description: 'The full package — hero banner, push notifications, and a direct SMS blast to your attendee list.',
    features: [
      { label: 'Homepage hero banner (top of app)', included: true },
      { label: 'Full attendee analytics (name, email, phone)', included: true },
      { label: '100 email reminders to existing attendees', included: true },
      { label: 'Push notification to 2,000+ nearby users', included: true },
      { label: 'SMS blast to your attendee list 📨', included: true },
    ],
    badge: 'Best Value',
  },
] as const

// ─── Event Categories ────────────────────────────────────────────────────────

export const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'arts', label: 'Arts & Culture', emoji: '🎨' },
  { id: 'food_drink', label: 'Food & Drink', emoji: '🍽️' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙' },
  { id: 'comedy', label: 'Comedy', emoji: '😂' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const

// ─── Limits ───────────────────────────────────────────────────────────────────

export const LIMITS = {
  maxTicketsPerOrder: 10,
  maxTiersPerEvent: 5,
  reservationMinutes: 10,
  maxGalleryImages: 5,
  minWithdrawalTzs: 10_000,
  coverImageMinWidth: 1600,
  coverImageMinHeight: 900,
} as const

// ─── Supported Currencies ─────────────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', country: 'Tanzania' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', country: 'Kenya' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', country: 'Uganda' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw', country: 'Rwanda' },
] as const

// ─── API ──────────────────────────────────────────────────────────────────────

export const API_VERSION = 'v1'
