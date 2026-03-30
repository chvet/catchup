#!/bin/bash
# ─────────────────────────────────────────────────────────────
# setup.sh — Initialisation Catch'Up sur une nouvelle machine
# Usage : bash setup.sh
# ─────────────────────────────────────────────────────────────

set -e

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BOLD}╔══════════════════════════════════╗${NC}"
echo -e "${BOLD}║   Catch'Up — Setup machine       ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════╝${NC}"
echo ""

# ── 1. Prérequis ──────────────────────────────────────────────
echo -e "${BOLD}1. Vérification des prérequis...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js non trouvé. Installe-le via https://nodejs.org (v20+)${NC}"
  exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

if ! command -v git &> /dev/null; then
  echo -e "${RED}✗ Git non trouvé.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Git $(git --version | awk '{print $3}')${NC}"

# ── 2. Dépendances npm ────────────────────────────────────────
echo ""
echo -e "${BOLD}2. Installation des dépendances npm...${NC}"
npm install
echo -e "${GREEN}✓ node_modules installés${NC}"

# ── 3. Fichier .env.local ─────────────────────────────────────
echo ""
echo -e "${BOLD}3. Configuration de l'environnement...${NC}"

if [ -f ".env.local" ]; then
  echo -e "${YELLOW}⚠ .env.local existe déjà — conservé tel quel${NC}"
else
  cat > .env.local << 'ENVEOF'
# Clé OpenAI (obligatoire)
OPENAI_API_KEY=sk-proj-REMPLACE_MOI

# Base de données distante (laisser vide = DB locale SQLite)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Email Office 365 (optionnel en dev)
O365_TENANT_ID=
O365_CLIENT_ID=
O365_CLIENT_SECRET=
O365_FROM_EMAIL=

# URL publique de l'app (optionnel en dev)
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVEOF
  echo -e "${GREEN}✓ .env.local créé${NC}"
  echo -e "${YELLOW}  → Renseigne ta clé OPENAI_API_KEY dans .env.local avant de lancer !${NC}"
fi

# ── 4. Base de données locale ─────────────────────────────────
echo ""
echo -e "${BOLD}4. Initialisation de la base de données locale...${NC}"

if [ -f "local.db" ]; then
  echo -e "${YELLOW}⚠ local.db existe déjà${NC}"
  read -p "  Réinitialiser la DB ? (seed complet) [o/N] " RESET_DB
  if [[ "$RESET_DB" =~ ^[Oo]$ ]]; then
    rm -f local.db
    echo "  DB supprimée."
    npm run db:push -- --force
    echo -e "${GREEN}✓ Schéma appliqué${NC}"
    echo ""
    echo -e "${BOLD}  Quel jeu de données ?${NC}"
    echo "  1) Seed standard  (10 structures, 10 conseillers, 20 bénéficiaires)"
    echo "  2) Seed étendu    (données enrichies)"
    echo "  3) Seed massif    (volume de test)"
    echo "  4) Aucun          (DB vide)"
    read -p "  Choix [1] : " SEED_CHOICE
    case "${SEED_CHOICE:-1}" in
      2) npm run seed:extended ;;
      3) npm run seed:massive ;;
      4) echo "  DB vide conservée." ;;
      *) npm run seed ;;
    esac
    echo -e "${GREEN}✓ Données insérées${NC}"
  fi
else
  npm run db:push -- --force
  echo -e "${GREEN}✓ Schéma appliqué${NC}"
  echo ""
  echo -e "${BOLD}  Quel jeu de données ?${NC}"
  echo "  1) Seed standard  (10 structures, 10 conseillers, 20 bénéficiaires)"
  echo "  2) Seed étendu    (données enrichies)"
  echo "  3) Seed massif    (volume de test)"
  echo "  4) Aucun          (DB vide)"
  read -p "  Choix [1] : " SEED_CHOICE
  case "${SEED_CHOICE:-1}" in
    2) npm run seed:extended ;;
    3) npm run seed:massive ;;
    4) echo "  DB vide." ;;
    *) npm run seed ;;
  esac
  echo -e "${GREEN}✓ Données insérées${NC}"
fi

# ── 5. Résumé & lancement ─────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   Setup terminé ! Lance l'app :      ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  Terminal 1 (serveur visio) :  ${BOLD}npm run dev:visio${NC}"
echo -e "  Terminal 2 (app Next.js)   :  ${BOLD}npm run dev${NC}"
echo ""
echo -e "  Bénéficiaire  → ${BOLD}http://localhost:3000${NC}"
echo -e "  Conseiller    → ${BOLD}http://localhost:3000/conseiller${NC}"
echo ""
echo -e "  Comptes de test (mot de passe : ${BOLD}password123${NC}) :"
echo -e "    admin@fondation-jae.org  (super admin)"
echo -e "    marie.dupont@ml-paris15.fr  (conseiller)"
echo ""
