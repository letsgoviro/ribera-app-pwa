#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Ribera — Migrate database from Supabase PostgreSQL to DigitalOcean
#
# What this script does:
#   1. Dumps data from Supabase PostgreSQL (all application tables)
#   2. Creates the schema on DigitalOcean Managed PostgreSQL
#   3. Imports the data
#   4. Verifies row counts match
#
# Prerequisites:
#   - pg_dump and psql installed (brew install postgresql or apt-get install postgresql-client)
#   - Access to both Supabase and DO PostgreSQL
#   - DO PostgreSQL cluster must already be created
#
# Usage:
#   chmod +x scripts/migrate-db-to-do.sh
#   DO_DB_URL="postgresql://doadmin:{password}@{host}:5432/defaultdb?sslmode=require" \
#   ./scripts/migrate-db-to-do.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────

SUPABASE_DIRECT_URL="${SUPABASE_DIRECT_URL:-postgresql://postgres.spzpfjwkohsufvrplaom:jhp.m%26%24%23nu3K%2BNL@aws-0-eu-west-1.pooler.supabase.com:5432/postgres}"
DO_DB_URL="${DO_DB_URL:?Must provide DO_DB_URL=postgresql://doadmin:...}"

TABLES=(
  profiles
  organisers
  events
  ticket_tiers
  promo_codes
  orders
  tickets
  boosts
  payouts
)

DUMP_FILE="/tmp/ribera_supabase_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "════════════════════════════════════════════════════════"
echo "  Ribera DB Migration: Supabase → DigitalOcean"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Source: Supabase PostgreSQL"
echo "Target: $DO_DB_URL" | sed 's/:\/\/.*@/:\/\/***@/'
echo "Dump file: $DUMP_FILE"
echo ""

# ── Step 1: Apply schema to DO ────────────────────────────────────────────────

echo "── Step 1: Applying Prisma schema to DO PostgreSQL..."
cd "$(dirname "$0")/../apps/api"

# Use Prisma to apply migrations
DIRECT_URL="$DO_DB_URL" DATABASE_URL="$DO_DB_URL" \
  pnpm exec prisma db push --accept-data-loss --skip-generate

echo "  ✓ Schema applied"

# ── Step 2: Export data from Supabase ────────────────────────────────────────

echo ""
echo "── Step 2: Exporting data from Supabase..."

# Build table list for pg_dump
TABLE_ARGS=""
for t in "${TABLES[@]}"; do
  TABLE_ARGS="$TABLE_ARGS -t public.$t"
done

pg_dump \
  "$SUPABASE_DIRECT_URL" \
  $TABLE_ARGS \
  --data-only \
  --no-owner \
  --no-acl \
  --disable-triggers \
  -f "$DUMP_FILE"

echo "  ✓ Dump saved to $DUMP_FILE ($(wc -c < "$DUMP_FILE") bytes)"

# ── Step 3: Import to DO ──────────────────────────────────────────────────────

echo ""
echo "── Step 3: Importing data to DigitalOcean..."

# Disable triggers during import to avoid FK violations
psql "$DO_DB_URL" -c "SET session_replication_role = 'replica';" 2>/dev/null || true
psql "$DO_DB_URL" -f "$DUMP_FILE"
psql "$DO_DB_URL" -c "SET session_replication_role = 'DEFAULT';" 2>/dev/null || true

echo "  ✓ Import complete"

# ── Step 4: Verify row counts ─────────────────────────────────────────────────

echo ""
echo "── Step 4: Verifying row counts..."
echo ""
printf "  %-20s %10s %10s %6s\n" "Table" "Supabase" "DO" "Match"
printf "  %-20s %10s %10s %6s\n" "─────" "────────" "──" "─────"

ALL_MATCH=true
for t in "${TABLES[@]}"; do
  SB_COUNT=$(psql "$SUPABASE_DIRECT_URL" -t -c "SELECT COUNT(*) FROM public.$t" 2>/dev/null | tr -d ' ')
  DO_COUNT=$(psql "$DO_DB_URL" -t -c "SELECT COUNT(*) FROM public.$t" 2>/dev/null | tr -d ' ')

  if [ "$SB_COUNT" = "$DO_COUNT" ]; then
    MATCH="✓"
  else
    MATCH="✗"
    ALL_MATCH=false
  fi

  printf "  %-20s %10s %10s %6s\n" "$t" "$SB_COUNT" "$DO_COUNT" "$MATCH"
done

echo ""
if [ "$ALL_MATCH" = true ]; then
  echo "  ✅ All row counts match — migration successful!"
else
  echo "  ⚠ Some counts don't match — check the dump and retry"
  exit 1
fi

# ── Step 5: Update local .env ─────────────────────────────────────────────────

echo ""
echo "── Step 5: Next steps"
echo ""
echo "  1. Update apps/api/.env with the DO connection strings:"
echo "     DATABASE_URL=$DO_DB_URL&pgbouncer=true&connection_limit=10"
echo "     DIRECT_URL=$DO_DB_URL"
echo ""
echo "  2. Restart the API server"
echo ""
echo "  3. Test the app: curl http://localhost:3001/health"
echo ""
echo "  4. Once confirmed working, push to GitHub to trigger DO deployment"
echo ""
echo "  Dump file kept at: $DUMP_FILE"
echo "  (Delete it when done: rm $DUMP_FILE)"
echo ""
echo "════════════════════════════════════════════════════════"
echo "  Migration complete!"
echo "════════════════════════════════════════════════════════"
