/**
 * Migration : Création des tables campagne + campagne_assignation
 * Usage : npx tsx scripts/migrate-campagnes.ts
 */

import { createClient } from '@libsql/client'
import 'dotenv/config'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:/app/data/local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  console.log('=== Migration Campagnes ===\n')

  // Table campagne
  await client.execute(`
    CREATE TABLE IF NOT EXISTS campagne (
      id TEXT PRIMARY KEY,
      structure_id TEXT NOT NULL REFERENCES structure(id),
      designation TEXT NOT NULL,
      quantite_objectif INTEGER NOT NULL,
      unite_oeuvre TEXT NOT NULL,
      date_debut TEXT NOT NULL,
      date_fin TEXT NOT NULL,
      statut TEXT DEFAULT 'active',
      cree_le TEXT NOT NULL,
      mis_a_jour_le TEXT NOT NULL
    )
  `)
  console.log('✅ Table campagne créée')

  // Table campagne_assignation
  await client.execute(`
    CREATE TABLE IF NOT EXISTS campagne_assignation (
      id TEXT PRIMARY KEY,
      campagne_id TEXT NOT NULL REFERENCES campagne(id),
      conseiller_id TEXT NOT NULL REFERENCES conseiller(id),
      cree_le TEXT NOT NULL
    )
  `)
  console.log('✅ Table campagne_assignation créée')

  console.log('\n✅ Migration terminée !')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Erreur:', err)
  process.exit(1)
})
