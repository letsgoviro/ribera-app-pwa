'use strict';

// Load env vars from API .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, 'apps/api/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) return;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
});

const { PrismaClient } = require('/Users/apple/Downloads/RIBERA_APP_PWA_NEW/apps/api/node_modules/@prisma/client');

const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const ORGANISER_ID = '40b4c273-4538-4212-9e9a-11499a786f57';

// Helper: date N days ago
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const events = [
  {
    title: 'Afro Beats Night — Nairobi',
    slug: 'afro-beats-night-nairobi',
    category: 'music',
    event_type: 'paid',
    venue_name: 'Carnivore Grounds',
    address: 'Carnivore Grounds, Nairobi, Kenya',
    description: 'The biggest Afrobeats night in East Africa — 5 DJs, live performances, and a crowd of 2,000+ dancing until dawn.',
    cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    starts_at: daysAgo(30),
    timezone: 'Africa/Nairobi',
    tiers: [
      { name: 'General', price: 1500n, currency: 'KES', quantity: 800, sold: 780, tier_type: 'general', sort_order: 0 },
      { name: 'VIP', price: 4500n, currency: 'KES', quantity: 100, sold: 95, tier_type: 'vip', sort_order: 1 },
      { name: 'VVIP Table for 8', price: 25000n, currency: 'KES', quantity: 20, sold: 18, tier_type: 'table', max_per_order: 1, seats_per_unit: 8, sort_order: 2 },
    ],
  },
  {
    title: 'Lagos Fashion Week 2025',
    slug: 'lagos-fashion-week-2025',
    category: 'arts',
    event_type: 'paid',
    venue_name: 'Eko Hotel Convention Centre',
    address: 'Eko Hotel Convention Centre, Lagos, Nigeria',
    description: "Africa's premier fashion showcase — 40+ designers, celebrity appearances, and live runway shows across 3 days.",
    cover_image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
    starts_at: daysAgo(45),
    timezone: 'Africa/Lagos',
    tiers: [
      { name: 'Day Pass', price: 15000n, currency: 'NGN', quantity: 500, sold: 498, tier_type: 'general', sort_order: 0 },
      { name: 'Premium', price: 45000n, currency: 'NGN', quantity: 200, sold: 190, tier_type: 'vip', sort_order: 1 },
      { name: "Designer's Table", price: 120000n, currency: 'NGN', quantity: 30, sold: 28, tier_type: 'table', max_per_order: 1, sort_order: 2 },
    ],
  },
  {
    title: 'Cape Town Jazz Festival — After Party',
    slug: 'cape-town-jazz-after-party',
    category: 'music',
    event_type: 'paid',
    venue_name: 'The Lookout, V&A Waterfront',
    address: 'The Lookout, V&A Waterfront, Cape Town, South Africa',
    description: 'Official after-party of the Cape Town Jazz Festival. 3 stages, world-class jazz fusion, and ocean views at midnight.',
    cover_image_url: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=600&fit=crop',
    starts_at: daysAgo(60),
    timezone: 'Africa/Johannesburg',
    tiers: [
      { name: 'General', price: 350n, currency: 'ZAR', quantity: 600, sold: 590, tier_type: 'general', sort_order: 0 },
      { name: 'VIP Lounge', price: 900n, currency: 'ZAR', quantity: 80, sold: 75, tier_type: 'vip', sort_order: 1 },
    ],
  },
  {
    title: 'East Africa Tech Summit — Kigali',
    slug: 'east-africa-tech-summit-kigali',
    category: 'business',
    event_type: 'paid',
    venue_name: 'Kigali Convention Centre',
    address: 'Kigali Convention Centre, Kigali, Rwanda',
    description: "The region's leading technology conference — 80+ speakers, startup pitches, VC networking, and keynotes on AI, fintech, and climate tech.",
    cover_image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    starts_at: daysAgo(75),
    timezone: 'Africa/Kigali',
    tiers: [
      { name: 'Standard Pass', price: 80n, currency: 'USD', quantity: 1000, sold: 945, tier_type: 'general', sort_order: 0 },
      { name: 'Speaker Access', price: 200n, currency: 'USD', quantity: 150, sold: 142, tier_type: 'vip', sort_order: 1 },
      { name: 'Investor Pass', price: 500n, currency: 'USD', quantity: 50, sold: 48, tier_type: 'vip', sort_order: 2 },
    ],
  },
  {
    title: 'Nyama Choma Festival — Kampala',
    slug: 'nyama-choma-festival-kampala',
    category: 'food_drink',
    event_type: 'paid',
    venue_name: 'Lugogo Cricket Oval',
    address: 'Lugogo Cricket Oval, Kampala, Uganda',
    description: "Uganda's biggest food festival — 50+ vendors, live cooking battles, traditional music, and the famous nyama choma competition.",
    cover_image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop',
    starts_at: daysAgo(90),
    timezone: 'Africa/Kampala',
    tiers: [
      { name: 'Entry', price: 30000n, currency: 'UGX', quantity: 3000, sold: 2850, tier_type: 'general', sort_order: 0 },
      { name: 'Tasting Pass', price: 80000n, currency: 'UGX', quantity: 500, sold: 480, tier_type: 'vip', sort_order: 1 },
    ],
  },
  {
    title: 'Accra Beach Carnival',
    slug: 'accra-beach-carnival',
    category: 'nightlife',
    event_type: 'paid',
    venue_name: 'Labadi Beach',
    address: 'Labadi Beach, Accra, Ghana',
    description: "Ghana's wildest beach party — soca, afrobeats, highlife, and dancehall with the ocean as your backdrop. 3,000 revellers, sunset to sunrise.",
    cover_image_url: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800&h=600&fit=crop',
    starts_at: daysAgo(105),
    timezone: 'Africa/Accra',
    tiers: [
      { name: 'Beach Entry', price: 150n, currency: 'GHS', quantity: 2000, sold: 1980, tier_type: 'general', sort_order: 0 },
      { name: 'VIP Cabana', price: 800n, currency: 'GHS', quantity: 50, sold: 48, tier_type: 'vip', sort_order: 1 },
      { name: 'Premium Table', price: 3500n, currency: 'GHS', quantity: 15, sold: 14, tier_type: 'table', max_per_order: 1, sort_order: 2 },
    ],
  },
  {
    title: 'Dar Comedy Night — Kilimanjaro Edition',
    slug: 'dar-comedy-night-kili-edition',
    category: 'comedy',
    event_type: 'paid',
    venue_name: 'Diamond Jubilee Hall',
    address: 'Diamond Jubilee Hall, Dar es Salaam, Tanzania',
    description: "Tanzania's funniest night — 6 comedians, international guests, and a sold-out crowd of 800 for the legendary Kilimanjaro Edition.",
    cover_image_url: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&h=600&fit=crop',
    starts_at: daysAgo(120),
    timezone: 'Africa/Dar_es_Salaam',
    tiers: [
      { name: 'General', price: 15000n, currency: 'TZS', quantity: 600, sold: 598, tier_type: 'general', sort_order: 0 },
      { name: 'VIP', price: 45000n, currency: 'TZS', quantity: 100, sold: 99, tier_type: 'vip', sort_order: 1 },
    ],
  },
  {
    title: 'Nairobi Half Marathon — Charity Run',
    slug: 'nairobi-half-marathon-charity',
    category: 'sports',
    event_type: 'paid',
    venue_name: 'Uhuru Park',
    address: 'Uhuru Park, Nairobi, Kenya',
    description: "5,000 runners, 21km through Nairobi's iconic streets. All proceeds go to the Kenya Wildlife Conservation Fund.",
    cover_image_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
    starts_at: daysAgo(140),
    timezone: 'Africa/Nairobi',
    tiers: [
      { name: '5K Fun Run', price: 500n, currency: 'KES', quantity: 2000, sold: 1950, tier_type: 'general', sort_order: 0 },
      { name: 'Half Marathon', price: 1500n, currency: 'KES', quantity: 2000, sold: 1890, tier_type: 'standing', sort_order: 1 },
      { name: 'Elite Entry', price: 5000n, currency: 'KES', quantity: 100, sold: 98, tier_type: 'vip', sort_order: 2 },
    ],
  },
  {
    title: 'Johannesburg Art Week — Opening Night',
    slug: 'joburg-art-week-opening',
    category: 'arts',
    event_type: 'paid',
    venue_name: 'Maboneng Precinct Gallery',
    address: 'Maboneng Precinct Gallery, Johannesburg, South Africa',
    description: 'The opening gala of Johannesburg Art Week — 30 artists, live painting, art auctions, and champagne receptions under the city lights.',
    cover_image_url: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&h=600&fit=crop',
    starts_at: daysAgo(160),
    timezone: 'Africa/Johannesburg',
    tiers: [
      { name: 'General', price: 250n, currency: 'ZAR', quantity: 400, sold: 398, tier_type: 'general', sort_order: 0 },
      { name: "Collector's Pass", price: 1200n, currency: 'ZAR', quantity: 60, sold: 57, tier_type: 'vip', sort_order: 1 },
      { name: 'Patron Table', price: 8000n, currency: 'ZAR', quantity: 10, sold: 9, tier_type: 'table', max_per_order: 1, sort_order: 2 },
    ],
  },
  {
    title: 'Mombasa Wellness Retreat — Women Only',
    slug: 'mombasa-wellness-retreat',
    category: 'other',
    event_type: 'paid',
    venue_name: 'Diani Beach Resort',
    address: 'Diani Beach Resort, Mombasa, Kenya',
    description: 'A 2-day wellness journey for African women — yoga, sound healing, nutrition workshops, beach meditation, and sisterhood circles.',
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    starts_at: daysAgo(180),
    timezone: 'Africa/Nairobi',
    tiers: [
      { name: 'Day Pass', price: 3500n, currency: 'KES', quantity: 200, sold: 195, tier_type: 'general', sort_order: 0 },
      { name: 'Full Retreat', price: 8500n, currency: 'KES', quantity: 100, sold: 98, tier_type: 'vip', sort_order: 1 },
    ],
  },
];

async function main() {
  console.log('Finding existing events for organiser...');
  const existingEvents = await db.event.findMany({
    where: { organiser_id: ORGANISER_ID },
    select: { id: true },
  });
  const eventIds = existingEvents.map(e => e.id);
  console.log(`Found ${eventIds.length} existing events.`);

  if (eventIds.length > 0) {
    console.log('Deleting tickets...');
    await db.ticket.deleteMany({ where: { event_id: { in: eventIds } } });
    console.log('Deleting orders...');
    await db.order.deleteMany({ where: { event_id: { in: eventIds } } });
    console.log('Deleting ticket tiers...');
    await db.ticketTier.deleteMany({ where: { event_id: { in: eventIds } } });
    console.log('Deleting promo codes...');
    await db.promoCode.deleteMany({ where: { event_id: { in: eventIds } } });
    console.log('Deleting boosts...');
    await db.boost.deleteMany({ where: { event_id: { in: eventIds } } });
    console.log('Deleting events...');
    const deleted = await db.event.deleteMany({ where: { organiser_id: ORGANISER_ID } });
    console.log(`Deleted ${deleted.count} existing events.`);
  }

  console.log('Creating 10 African past events...');

  for (const ev of events) {
    const publishedAt = new Date(ev.starts_at.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week before
    const endsAt = new Date(ev.starts_at.getTime() + 4 * 60 * 60 * 1000); // 4h duration

    const created = await db.event.create({
      data: {
        organiser_id: ORGANISER_ID,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        cover_image_url: ev.cover_image_url,
        category: ev.category,
        event_type: ev.event_type,
        venue_name: ev.venue_name,
        address: ev.address,
        starts_at: ev.starts_at,
        ends_at: endsAt,
        timezone: ev.timezone,
        status: 'completed',
        published_at: publishedAt,
        tiers: {
          create: ev.tiers.map(t => ({
            name: t.name,
            price: t.price,
            currency: t.currency,
            quantity: t.quantity,
            sold: t.sold,
            tier_type: t.tier_type,
            max_per_order: t.max_per_order ?? 10,
            seats_per_unit: t.seats_per_unit ?? 1,
            sort_order: t.sort_order,
          })),
        },
      },
    });

    console.log(`  Created: ${created.title} (${created.id})`);
  }

  console.log('\nDone! 10 events created successfully.');
}

main()
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
