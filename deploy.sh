#!/bin/bash
# deploy.sh — Deploiement Catch'Up sur Hetzner
# Usage : ssh root@catchup.jaeprive.fr "/opt/catchup/deploy.sh"

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

# 2. Build l'image Docker
echo ""
echo "[2/4] Build Docker..."
docker-compose build catchup

# 3. Redemarrer le container (force recreate pour eviter le bug ContainerConfig)
echo ""
echo "[3/4] Redemarrage du container..."
docker ps -a --format '{{.Names}}' | grep catchup | xargs -r docker rm -f 2>/dev/null || true
docker-compose up -d catchup

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
