#!/bin/sh
# Entrypoint Docker — Catch'Up
# Initialise la BDD au premier démarrage, puis lance les serveurs

DB_PATH="/app/data/local.db"

# Si la BDD n'existe pas encore → seed
if [ ! -f "$DB_PATH" ]; then
  echo "🌱 Première exécution : initialisation de la base de données..."
  TURSO_DATABASE_URL="file:$DB_PATH" npx tsx scripts/seed.ts
  echo "✅ Base initialisée"
else
  echo "📦 Base de données existante trouvée"
  # Migrations légères (ajout de colonnes manquantes)
  echo "🔄 Vérification des migrations..."
  node -e "
    const { createClient } = require('@libsql/client');
    (async () => {
      const db = createClient({ url: 'file:$DB_PATH' });
      const migrations = [
        'ALTER TABLE referral ADD COLUMN campagne_id TEXT',
        'ALTER TABLE structure ADD COLUMN logo_url TEXT',
        'ALTER TABLE campagne ADD COLUMN slug TEXT',
        'ALTER TABLE campagne ADD COLUMN remplacee_par_id TEXT',
        'ALTER TABLE campagne ADD COLUMN archivee_le TEXT',
      ];
      for (const m of migrations) {
        try { await db.execute(m); console.log('  ✓', m.substring(0, 60)); } catch(e) { /* already exists */ }
      }
    })().catch(() => {});
  " 2>/dev/null
  echo "✅ Migrations OK"
fi

# Lancer le serveur WebSocket de visio en arrière-plan (optionnel)
if [ -f "src/visio/server.ts" ]; then
  echo "📹 Démarrage du serveur visio (port 3003)..."
  node src/visio/server.js &
  sleep 1
else
  echo "⏭️ Serveur visio non trouvé, utilisation de Daily.co"
fi

# Lancer le serveur Next.js
echo "🚀 Démarrage de Catch'Up..."
exec node server.js
