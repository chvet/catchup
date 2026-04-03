#!/bin/sh
# Entrypoint Docker — Catch'Up (PostgreSQL)
# Attend que PostgreSQL soit prêt, pousse le schema, puis lance le serveur

echo "🐘 Connexion à PostgreSQL..."

# Attendre que PostgreSQL réponde (max 30s)
for i in $(seq 1 30); do
  if node -e "
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    pool.query('SELECT 1').then(() => { pool.end(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "✅ PostgreSQL prêt"
    break
  fi
  echo "  ⏳ Attente PostgreSQL... ($i/30)"
  sleep 1
done

# Pousser le schema Drizzle (crée les tables manquantes)
echo "🔄 Synchronisation du schema..."
npx drizzle-kit push 2>&1 || echo "⚠️ drizzle-kit push a échoué (les tables existent peut-être déjà)"
echo "✅ Schema OK"

# Vérifier si la BDD contient des données (table structure vide = première exécution)
NEEDS_SEED=$(node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT COUNT(*) as c FROM structure').then(r => {
    pool.end();
    process.stdout.write(r.rows[0].c === '0' ? 'yes' : 'no');
  }).catch(() => { pool.end(); process.stdout.write('yes'); });
" 2>/dev/null)

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "🌱 Première exécution : seed de la base..."
  npx tsx scripts/seed.ts 2>&1 || echo "⚠️ Seed partiel"
  echo "✅ Seed terminé"
else
  echo "📦 Base de données existante trouvée"
fi

# Générer version.json avec le timestamp de démarrage
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"version\":\"$(cat /app/.build-hash 2>/dev/null || echo 'unknown')\",\"buildTime\":\"${BUILD_TIME}\"}" > /app/public/version.json
echo "📋 Version: $(cat /app/.build-hash 2>/dev/null || echo '?') (${BUILD_TIME})"

# Lancer le serveur Next.js
echo "🚀 Démarrage de Catch'Up..."
exec node server.js
