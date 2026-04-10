#!/bin/bash
# promote-to-prod.sh — Promouvoir la beta en production
# Usage : ssh root@catchup.jaeprive.fr "bash /opt/catchup/promote-to-prod.sh"
# Merge la dernière branche beta dans main et redéploie la prod

set -e

cd /opt/catchup

echo "=========================================="
echo "  Promotion BETA → PROD — $(date '+%Y-%m-%d %H:%M')"
echo "=========================================="

# 1. Déterminer la branche beta
BETA_BRANCH=$(git branch -r | grep 'v2.0-beta' | sort -V | tail -1 | sed 's|origin/||' | xargs)
if [ -z "$BETA_BRANCH" ]; then
  echo "Aucune branche beta trouvée"
  exit 1
fi
echo "[1/5] Branche beta : $BETA_BRANCH"

# 2. Fetch et merge dans main
echo ""
echo "[2/5] Merge $BETA_BRANCH → main..."
git fetch origin
git checkout main
git reset --hard origin/main
git merge "origin/$BETA_BRANCH" --no-edit
git push origin main
echo "  -> $(git log --oneline -1)"

# 3. Build l'image Docker prod
echo ""
echo "[3/5] Build Docker prod..."
docker-compose build catchup

# 4. Redémarrer le container prod
echo ""
echo "[4/5] Redémarrage prod..."
docker ps -a --format '{{.Names}}' | grep -E '^catchup_catchup_1$|^catchup-catchup-1$' | xargs -r docker rm -f 2>/dev/null || true
docker-compose up -d catchup

# 5. Nettoyage
echo ""
echo "[5/5] Nettoyage images..."
docker image prune -f > /dev/null 2>&1

# Vérification
echo ""
echo "=========================================="
sleep 5
docker ps --format "  {{.Names}}\t{{.Status}}" | grep catchup
echo ""
echo "PROD déployé depuis : $BETA_BRANCH"
echo "  -> $(git log --oneline -1)"
echo ""
echo "BETA toujours accessible : https://beta.catchup.jaeprive.fr"
echo "PROD mise à jour :        https://catchup.jaeprive.fr"
echo "=========================================="
