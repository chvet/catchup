#!/bin/sh
# Entrypoint Docker — Catch'Up
# Initialise la BDD au premier démarrage, puis lance le serveur

DB_PATH="/app/data/local.db"

# Si la BDD n'existe pas encore → seed
if [ ! -f "$DB_PATH" ]; then
  echo "🌱 Première exécution : initialisation de la base de données..."
  TURSO_DATABASE_URL="file:$DB_PATH" npx tsx scripts/seed.ts
  echo "✅ Base initialisée"
else
  echo "📦 Base de données existante trouvée"
fi

# Lancer le serveur Next.js
echo "🚀 Démarrage de Catch'Up..."
exec node server.js
