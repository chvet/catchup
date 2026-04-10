#!/bin/bash
# deploy-beta.sh — Déploiement Catch'Up BETA
# Usage : ssh root@catchup.jaeprive.fr "bash /opt/catchup/deploy-beta.sh"
# Déploie la branche courante (v2.0-beta-*) sur beta.catchup.jaeprive.fr

set -e

cd /opt/catchup

echo "=========================================="
echo "  Déploiement Catch'Up BETA — $(date '+%Y-%m-%d %H:%M')"
echo "=========================================="

# 1. Déterminer la branche beta à déployer
BETA_BRANCH=$(git branch -r | grep 'v2.0-beta' | sort -V | tail -1 | sed 's|origin/||' | xargs)
if [ -z "$BETA_BRANCH" ]; then
  echo "Aucune branche beta trouvée (v2.0-beta-*)"
  exit 1
fi
echo "[1/5] Branche beta : $BETA_BRANCH"

# 2. Pull la branche beta
echo ""
echo "[2/5] Git fetch + checkout..."
git fetch origin "$BETA_BRANCH"
git checkout "$BETA_BRANCH" 2>/dev/null || git checkout -b "$BETA_BRANCH" "origin/$BETA_BRANCH"
git reset --hard "origin/$BETA_BRANCH"
echo "  -> $(git log --oneline -1)"

# 3. Build l'image Docker
echo ""
echo "[3/5] Build Docker..."
docker-compose -f docker-compose.yml -f docker-compose.beta.yml build catchup-beta

# 4. Redémarrer le container beta
echo ""
echo "[4/5] Redémarrage du container beta..."
docker ps -a --format '{{.Names}}' | grep catchup-beta | xargs -r docker rm -f 2>/dev/null || true
docker-compose -f docker-compose.yml -f docker-compose.beta.yml up -d catchup-beta

# 5. Revenir sur main (pour ne pas casser la prod)
echo ""
echo "[5/5] Retour sur main..."
git checkout main

# Vérification
echo ""
echo "=========================================="
sleep 5
docker ps --format "  {{.Names}}\t{{.Status}}" | grep catchup
echo ""
echo "BETA déployé : $BETA_BRANCH"
echo "URL : https://beta.catchup.jaeprive.fr"
echo "=========================================="
