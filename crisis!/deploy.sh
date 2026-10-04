#!/usr/bin/env bash
# Updates the live site on the VPS: pull the latest code, rebuild the
# frontend into dist/ (served by Caddy), and restart the Socket.io backend.
#
# Run on the VPS:  bash '/var/www/crisis/crisis!/deploy.sh'
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

echo "→ Pulling latest code"
git pull --ff-only

# Vite bakes VITE_SERVER_URL into the bundle at build time, so it must point
# at the live domain before building. .env.production (server-only, not in
# git) takes priority over the committed .env.
if ! grep -qs '^VITE_SERVER_URL=https://' .env.production .env; then
  echo "✗ VITE_SERVER_URL is not set to an https:// URL."
  echo "  Create it once with:  echo 'VITE_SERVER_URL=https://playcrisis.tech' > .env.production"
  exit 1
fi

echo "→ Installing frontend dependencies"
npm ci

echo "→ Building frontend (lint + vite build → dist/)"
npm run build

echo "→ Installing backend dependencies"
(cd server && npm ci --omit=dev)

echo "→ Restarting backend"
pm2 restart crisis-server

echo "✓ Deployed $(git rev-parse --short HEAD) — check https://playcrisis.tech"
