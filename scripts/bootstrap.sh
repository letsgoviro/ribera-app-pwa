#!/usr/bin/env bash
# Bootstrap the Ribera dev environment — no global installs required.
# Usage: bash scripts/bootstrap.sh
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── 1. Node version check ────────────────────────────────────────────────────
REQUIRED_NODE="22"
CURRENT_NODE="$(node -e 'process.stdout.write(process.version.split(".")[0].slice(1))')"

if [ "$CURRENT_NODE" -lt "$REQUIRED_NODE" ]; then
  echo "❌  Node $REQUIRED_NODE+ required (you have v$CURRENT_NODE)"
  echo "   Run: nvm use   (reads .nvmrc)"
  exit 1
fi
echo "✅  Node $(node --version)"

# ── 2. pnpm via corepack (no global install) ─────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  echo "🔧  Enabling pnpm via corepack..."
  corepack enable pnpm
fi
echo "✅  pnpm $(pnpm --version)"

# ── 3. Install all workspace deps locally ────────────────────────────────────
echo "📦  Installing dependencies..."
pnpm install

# ── 4. Generate Prisma client ────────────────────────────────────────────────
echo "🗄️   Generating Prisma client..."
pnpm --filter @ribera/api exec prisma generate

# ── 5. Copy env examples ─────────────────────────────────────────────────────
copy_env() {
  if [ ! -f "$1/.env" ] && [ -f "$1/.env.example" ]; then
    cp "$1/.env.example" "$1/.env"
    echo "📋  Copied $1/.env.example → $1/.env"
  fi
}
copy_env "apps/api"
copy_env "apps/web"
copy_env "apps/organiser"
copy_env "apps/admin"

echo ""
echo "🎉  Done! Next steps:"
echo "   1. Fill in your secrets in apps/api/.env and apps/web/.env"
echo "   2. pnpm dev:api        — start the API"
echo "   3. pnpm dev:web        — start the customer PWA on :3000"
echo "   4. pnpm dev:organiser  — start the organiser PWA on :3002"
echo "   5. pnpm dev:admin      — start the admin panel on :3003"
