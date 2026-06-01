-- Ribera V2 — Initial schema migration
-- Generated from prisma/schema.prisma for DigitalOcean Managed PostgreSQL

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('customer', 'organiser', 'admin');
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'cancelled', 'completed');
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'reserved', 'paid', 'cancelled', 'refunded');
CREATE TYPE "TicketStatus" AS ENUM ('valid', 'used', 'cancelled', 'transferred');
CREATE TYPE "BoostStatus" AS ENUM ('pending', 'active', 'expired', 'cancelled');
CREATE TYPE "SmsCampaignStatus" AS ENUM ('not_applicable', 'pending_credits', 'sent');
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE "EventType" AS ENUM ('paid', 'free', 'donation', 'online', 'hybrid');
CREATE TYPE "TierType" AS ENUM ('general', 'vip', 'table', 'seat', 'standing', 'online');

-- ─── Profiles ─────────────────────────────────────────────────────────────────

CREATE TABLE "profiles" (
    "id"           UUID         PRIMARY KEY,
    "display_name" TEXT,
    "avatar_url"   TEXT,
    "phone"        TEXT         UNIQUE,
    "role"         "UserRole"   NOT NULL DEFAULT 'customer',
    "city"         TEXT,
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ─── Organisers ──────────────────────────────────────────────────────────────

CREATE TABLE "organisers" (
    "id"           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"      UUID         NOT NULL UNIQUE REFERENCES "profiles"("id") ON DELETE CASCADE,
    "org_name"     TEXT         NOT NULL,
    "full_name"    TEXT,
    "bio"          TEXT,
    "logo_url"     TEXT,
    "banner_url"   TEXT,
    "website"      TEXT,
    "social_links" JSONB        NOT NULL DEFAULT '{}',
    "verified"     BOOLEAN      NOT NULL DEFAULT false,
    "verified_at"  TIMESTAMPTZ,
    "id_doc_url"   TEXT,
    "phone"        TEXT,
    "balance"      BIGINT       NOT NULL DEFAULT 0,
    "payout_details" JSONB      NOT NULL DEFAULT '{}',
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX "organisers_user_id_idx" ON "organisers"("user_id");

-- ─── Events ───────────────────────────────────────────────────────────────────

CREATE TABLE "events" (
    "id"              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    "organiser_id"    UUID         NOT NULL REFERENCES "organisers"("id") ON DELETE CASCADE,
    "title"           TEXT         NOT NULL,
    "slug"            TEXT         NOT NULL UNIQUE,
    "description"     TEXT,
    "cover_image_url" TEXT,
    "gallery_urls"    TEXT[]       NOT NULL DEFAULT '{}',
    "category"        TEXT         NOT NULL,
    "event_type"      "EventType"  NOT NULL DEFAULT 'paid',
    "venue_name"      TEXT,
    "address"         TEXT,
    "lat"             DECIMAL(10,8),
    "lng"             DECIMAL(11,8),
    "online_url"      TEXT,
    "venue_code"      TEXT,
    "timetable_url"   TEXT,
    "starts_at"       TIMESTAMPTZ  NOT NULL,
    "ends_at"         TIMESTAMPTZ,
    "timezone"        TEXT         NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
    "status"          "EventStatus" NOT NULL DEFAULT 'draft',
    "min_age"         INT          NOT NULL DEFAULT 0,
    "allow_transfer"  BOOLEAN      NOT NULL DEFAULT true,
    "refund_policy"   TEXT         NOT NULL DEFAULT '24h',
    "published_at"    TIMESTAMPTZ,
    "cancelled_at"    TIMESTAMPTZ,
    "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX "events_organiser_id_idx" ON "events"("organiser_id");
CREATE INDEX "events_status_starts_at_idx" ON "events"("status", "starts_at");
CREATE INDEX "events_category_idx" ON "events"("category");

-- ─── Ticket Tiers ─────────────────────────────────────────────────────────────

CREATE TABLE "ticket_tiers" (
    "id"             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id"       UUID      NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "name"           TEXT      NOT NULL,
    "description"    TEXT,
    "price"          BIGINT    NOT NULL,
    "currency"       CHAR(3)   NOT NULL DEFAULT 'TZS',
    "quantity"       INT       NOT NULL,
    "sold"           INT       NOT NULL DEFAULT 0,
    "tier_type"      "TierType" NOT NULL DEFAULT 'general',
    "max_per_order"  INT       NOT NULL DEFAULT 10,
    "seats_per_unit" INT       NOT NULL DEFAULT 1,
    "sale_starts"    TIMESTAMPTZ,
    "sale_ends"      TIMESTAMPTZ,
    "sort_order"     INT       NOT NULL DEFAULT 0,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "ticket_tiers_event_id_idx" ON "ticket_tiers"("event_id");

-- ─── Promo Codes ──────────────────────────────────────────────────────────────

CREATE TABLE "promo_codes" (
    "id"             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id"       UUID      NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "code"           TEXT      NOT NULL,
    "discount_type"  TEXT      NOT NULL,
    "discount_value" BIGINT    NOT NULL,
    "max_uses"       INT,
    "used_count"     INT       NOT NULL DEFAULT 0,
    "expires_at"     TIMESTAMPTZ,
    "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE ("event_id", "code")
);

-- ─── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE "orders" (
    "id"              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"         UUID          NOT NULL REFERENCES "profiles"("id"),
    "event_id"        UUID          NOT NULL REFERENCES "events"("id"),
    "status"          "OrderStatus" NOT NULL DEFAULT 'pending',
    "items"           JSONB         NOT NULL,
    "subtotal"        BIGINT        NOT NULL,
    "service_fee"     BIGINT        NOT NULL,
    "total"           BIGINT        NOT NULL,
    "currency"        CHAR(3)       NOT NULL DEFAULT 'TZS',
    "promo_code_id"   UUID          REFERENCES "promo_codes"("id"),
    "discount_amount" BIGINT        NOT NULL DEFAULT 0,
    "attendee_name"   TEXT          NOT NULL,
    "attendee_email"  TEXT          NOT NULL,
    "attendee_phone"  TEXT          NOT NULL,
    "custom_fields"   JSONB         NOT NULL DEFAULT '{}',
    "dpo_token"       TEXT,
    "dpo_ref"         TEXT,
    "reserved_until"  TIMESTAMPTZ,
    "paid_at"         TIMESTAMPTZ,
    "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX "orders_event_id_idx" ON "orders"("event_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- ─── Tickets ──────────────────────────────────────────────────────────────────

CREATE TABLE "tickets" (
    "id"             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    "order_id"       UUID           NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "event_id"       UUID           NOT NULL REFERENCES "events"("id"),
    "tier_id"        UUID           NOT NULL REFERENCES "ticket_tiers"("id"),
    "buyer_id"       UUID           NOT NULL REFERENCES "profiles"("id"),
    "holder_id"      UUID           NOT NULL REFERENCES "profiles"("id"),
    "qr_token"       TEXT           NOT NULL UNIQUE,
    "status"         "TicketStatus" NOT NULL DEFAULT 'valid',
    "checked_in_at"  TIMESTAMPTZ,
    "checked_in_by"  UUID,
    "transferred_at" TIMESTAMPTZ,
    "created_at"     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX "tickets_buyer_id_idx"         ON "tickets"("buyer_id");
CREATE INDEX "tickets_holder_id_idx"        ON "tickets"("holder_id");
CREATE INDEX "tickets_qr_token_idx"         ON "tickets"("qr_token");
CREATE INDEX "tickets_event_id_status_idx"  ON "tickets"("event_id", "status");

-- ─── Boosts ───────────────────────────────────────────────────────────────────

CREATE TABLE "boosts" (
    "id"           UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
    "event_id"     UUID                  NOT NULL REFERENCES "events"("id"),
    "organiser_id" UUID                  NOT NULL REFERENCES "organisers"("id"),
    "package"      TEXT                  NOT NULL,
    "placement"    TEXT                  NOT NULL,
    "price_paid"   BIGINT                NOT NULL,
    "currency"     CHAR(3)               NOT NULL DEFAULT 'TZS',
    "starts_at"    TIMESTAMPTZ           NOT NULL,
    "ends_at"      TIMESTAMPTZ           NOT NULL,
    "dpo_ref"      TEXT,
    "status"       "BoostStatus"         NOT NULL DEFAULT 'active',
    "sms_status"   "SmsCampaignStatus"   NOT NULL DEFAULT 'not_applicable',
    "sms_sent_at"  TIMESTAMPTZ,
    "impressions"  INT                   NOT NULL DEFAULT 0,
    "clicks"       INT                   NOT NULL DEFAULT 0,
    "created_at"   TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX "boosts_status_ends_at_idx" ON "boosts"("status", "ends_at");
CREATE INDEX "boosts_event_id_idx"        ON "boosts"("event_id");

-- ─── Payouts ──────────────────────────────────────────────────────────────────

CREATE TABLE "payouts" (
    "id"              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    "organiser_id"    UUID           NOT NULL REFERENCES "organisers"("id"),
    "amount"          BIGINT         NOT NULL,
    "currency"        CHAR(3)        NOT NULL DEFAULT 'TZS',
    "method"          TEXT           NOT NULL,
    "account_details" JSONB          NOT NULL,
    "status"          "PayoutStatus" NOT NULL DEFAULT 'pending',
    "requested_at"    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    "processed_at"    TIMESTAMPTZ,
    "admin_note"      TEXT,
    "reference"       TEXT
);

CREATE INDEX "payouts_organiser_id_idx" ON "payouts"("organiser_id");
CREATE INDEX "payouts_status_idx"        ON "payouts"("status");

-- ─── Reviews ──────────────────────────────────────────────────────────────────
-- Created lazily on first POST /reviews. Also created here for completeness.

CREATE TABLE IF NOT EXISTS "reviews" (
    "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id"    UUID NOT NULL REFERENCES "profiles"("id"),
    "event_id"   UUID NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
    "rating"     INT  NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "comment"    TEXT,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    UNIQUE ("user_id", "event_id")
);

-- ─── Prisma migration history table ──────────────────────────────────────────
-- Prisma uses this to track which migrations have been applied.
-- DO NOT modify this manually.
