#!/bin/bash
# YANSY Deploy Script - Hostinger VPS
# Run from project root on the VPS after git pull

set -e
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> YANSY deploy (yansytech.com)"

# 1. Client build
echo "==> Building client..."
cd client
if [ -f .env.production ]; then
  set -a
  . ./.env.production
  set +a
fi
export VITE_API_URL="${VITE_API_URL:-https://api.yansytech.com/api}"
export VITE_SOCKET_URL="${VITE_SOCKET_URL:-https://api.yansytech.com}"
npm ci --production=false
npm run build
cd ..

# 2. Copy frontend to web root
echo "==> Deploying frontend to /var/www/yansytech.com..."
sudo mkdir -p /var/www/yansytech.com
sudo rsync -av --delete client/dist/ /var/www/yansytech.com/
sudo chown -R www-data:www-data /var/www/yansytech.com 2>/dev/null || true

# 3. Server
echo "==> Installing server dependencies..."
cd server
npm ci --omit=dev
cd ..

# 4. PM2 restart
echo "==> Restarting API (PM2)..."
mkdir -p logs
pm2 start ecosystem.config.cjs --env production --update-env || pm2 reload ecosystem.config.cjs --env production
pm2 save
echo "==> Deploy done."
