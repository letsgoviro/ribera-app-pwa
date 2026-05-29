#!/usr/bin/env bash
# Deploy API to DigitalOcean App Platform using local DO API key.
# Never installs doctl globally — downloads the binary into .tools/
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS="$ROOT/.tools"
mkdir -p "$TOOLS"

# ── Download doctl locally if not present ─────────────────────────────────────
DOCTL="$TOOLS/doctl"
if [ ! -f "$DOCTL" ]; then
  echo "📥  Downloading doctl..."
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)
  [ "$ARCH" = "x86_64" ] && ARCH="amd64"
  [ "$ARCH" = "arm64" ]  && ARCH="arm64"
  VERSION="1.119.1"
  URL="https://github.com/digitalocean/doctl/releases/download/v${VERSION}/doctl-${VERSION}-${OS}-${ARCH}.tar.gz"
  curl -sL "$URL" | tar -xz -C "$TOOLS"
  chmod +x "$DOCTL"
fi

# ── Load DO key from .env ─────────────────────────────────────────────────────
DO_API_KEY=$(grep '^DO_API_KEY=' "$ROOT/apps/api/.env" | cut -d= -f2-)

if [ -z "$DO_API_KEY" ]; then
  echo "❌  DO_API_KEY not found in apps/api/.env"
  exit 1
fi

# ── Authenticate locally (no global config) ───────────────────────────────────
export DIGITALOCEAN_ACCESS_TOKEN="$DO_API_KEY"

echo "🔍  Checking existing apps..."
APP_ID=$("$DOCTL" apps list --no-header --format ID,Spec.Name 2>/dev/null | grep "ribera-api" | awk '{print $1}')

if [ -z "$APP_ID" ]; then
  echo "🚀  Creating new app..."
  "$DOCTL" apps create --spec "$ROOT/.do/app.yaml"
else
  echo "🔄  Updating existing app $APP_ID..."
  "$DOCTL" apps update "$APP_ID" --spec "$ROOT/.do/app.yaml"
fi

echo "✅  Done. Monitor at: https://cloud.digitalocean.com/apps"
