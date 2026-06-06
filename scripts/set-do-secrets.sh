#!/usr/bin/env bash
# Push all secret env vars to DigitalOcean App Platform from local .env
# Run ONCE after first deploy, or whenever secrets change.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCTL="$ROOT/.tools/doctl"
ENV_FILE="$ROOT/apps/api/.env"

if [ ! -f "$DOCTL" ]; then
  echo "❌  doctl not found. Run scripts/deploy-api.sh first."
  exit 1
fi

load_var() { grep "^$1=" "$ENV_FILE" | cut -d= -f2-; }

DO_API_KEY=$(load_var DO_API_KEY)
export DIGITALOCEAN_ACCESS_TOKEN="$DO_API_KEY"

APP_ID=$("$DOCTL" apps list --no-header --format ID,Spec.Name | grep "ribera-api" | awk '{print $1}')
if [ -z "$APP_ID" ]; then echo "❌  App not found. Deploy first."; exit 1; fi

echo "🔐  Setting secrets on app $APP_ID..."

SECRETS=(
  "SUPABASE_URL=$(load_var SUPABASE_URL)"
  "SUPABASE_ANON_KEY=$(load_var SUPABASE_ANON_KEY)"
  "SUPABASE_SERVICE_ROLE_KEY=$(load_var SUPABASE_SERVICE_ROLE_KEY)"
  "DATABASE_URL=$(load_var DATABASE_URL)"
  "DIRECT_URL=$(load_var DIRECT_URL)"
  "DPO_COMPANY_TOKEN=$(load_var DPO_COMPANY_TOKEN)"
  "DPO_COMPANY_ID=$(load_var DPO_COMPANY_ID)"
  "BREVO_API_KEY=$(load_var BREVO_API_KEY)"
  "BREVO_SMTP_USER=$(load_var BREVO_SMTP_USER)"
  "OAUTH_CLIENT_ID=$(load_var OAUTH_CLIENT_ID)"
  "OAUTH_CLIENT_SECRET=$(load_var OAUTH_CLIENT_SECRET)"
  "QR_JWT_SECRET=$(load_var QR_JWT_SECRET)"
)

for SECRET in "${SECRETS[@]}"; do
  KEY="${SECRET%%=*}"
  VAL="${SECRET#*=}"
  "$DOCTL" apps update "$APP_ID" --env "$KEY=$VAL" 2>/dev/null && echo "  ✓ $KEY" || echo "  ⚠ $KEY skipped"
done

echo "✅  All secrets pushed."
