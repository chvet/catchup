#!/bin/bash
# deploy.sh — Deploiement Catch'Up sur Hetzner
# Usage depuis Windows : ssh root@wesh.chat "/opt/catchup/deploy.sh"
# Ou depuis Claude     : "deploie sur la prod"

set -e

cd /opt/catchup

echo "=========================================="
echo "  Deploiement Catch'Up — $(date '+%Y-%m-%d %H:%M')"
echo "=========================================="

# 1. Pull depuis GitHub
echo ""
echo "[1/4] Git pull..."
git fetch origin main
git reset --hard origin/main
echo "  -> $(git log --oneline -1)"

# 2. Build les images Docker
echo ""
echo "[2/4] Build Docker (wesh + catchup)..."
docker-compose build wesh catchup

# 3. Redemarrer les containers
echo ""
echo "[3/4] Redemarrage des containers..."
docker-compose up -d wesh catchup

# 4. Nettoyage des anciennes images
echo ""
echo "[4/4] Nettoyage images inutilisees..."
docker image prune -f > /dev/null 2>&1

# Verification
echo ""
echo "=========================================="
sleep 5
docker ps --format "  {{.Names}}\t{{.Status}}" | grep catchup
echo ""
echo "Deploye: $(git log --oneline -1)"
echo "=========================================="
