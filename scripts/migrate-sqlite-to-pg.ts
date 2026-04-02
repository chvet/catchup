#!/usr/bin/env tsx
/**
 * Migration SQLite → PostgreSQL
 *
 * Usage (depuis le serveur) :
 *   DATABASE_URL=postgres://catchup:CatchUp2026Pg!@localhost:5432/catchup \
 *   npx tsx scripts/migrate-sqlite-to-pg.ts /app/data/local.db
 *
 * Ou en local :
 *   npx tsx scripts/migrate-sqlite-to-pg.ts ./data/local.db
 *
 * Ce script :
 * 1. Ouvre la base SQLite source
 * 2. Crée les tables PostgreSQL via drizzle-kit push (ou les suppose déjà créées)
 * 3. Migre toutes les données table par table dans l'ordre des dépendances FK
 */

import { createClient } from '@libsql/client'
import { Pool } from 'pg'

const sqlitePath = process.argv[2]
if (!sqlitePath) {
  console.error('Usage: npx tsx scripts/migrate-sqlite-to-pg.ts <path-to-sqlite.db>')
  process.exit(1)
}

const pgUrl = process.env.DATABASE_URL
if (!pgUrl) {
  console.error('DATABASE_URL environment variable is required')
  process.exit(1)
}

// Ordre des tables respectant les FK (parents avant enfants)
const TABLES_IN_ORDER = [
  'utilisateur',
  'conversation',
  'message',
  'profil_riasec',
  'instantane_profil',
  'indice_confiance',
  'referral',
  'evenement_quiz',
  'source_captation',
  'session_magic_link',
  'structure',
  'conseiller',
  'prise_en_charge',
  'session_conseiller',
  'evenement_audit',
  'message_direct',
  'tiers_intervenant',
  'participant_conversation',
  'demande_consentement',
  'evenement_journal',
  'rendez_vous',
  'bris_de_glace',
  'push_subscription',
  'enquete_satisfaction',
  'rappel',
  'campagne',
  'campagne_assignation',
  'calendar_connection',
  'code_verification',
  'categorie_activite',
  'declaration_activite',
  'objectif_hebdomadaire',
  'alerte_decrochage',
]

async function main() {
  console.log(`📦 Source SQLite: ${sqlitePath}`)
  console.log(`🐘 Destination PostgreSQL: ${pgUrl?.replace(/:[^:@]+@/, ':***@')}`)

  // Connexion SQLite
  const sqlite = createClient({ url: `file:${sqlitePath}` })

  // Connexion PostgreSQL
  const pg = new Pool({ connectionString: pgUrl })

  let totalRows = 0

  for (const table of TABLES_IN_ORDER) {
    try {
      // Lire toutes les lignes de la table SQLite
      const result = await sqlite.execute(`SELECT * FROM ${table}`)
      const rows = result.rows as Record<string, unknown>[]

      if (rows.length === 0) {
        console.log(`  ⏭️  ${table}: vide`)
        continue
      }

      // Construire l'INSERT PostgreSQL par batch
      const columns = Object.keys(rows[0])
      const BATCH_SIZE = 100

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)
        const valuePlaceholders: string[] = []
        const values: unknown[] = []
        let paramIndex = 1

        for (const row of batch) {
          const placeholders: string[] = []
          for (const col of columns) {
            placeholders.push(`$${paramIndex++}`)
            values.push(row[col] ?? null)
          }
          valuePlaceholders.push(`(${placeholders.join(', ')})`)
        }

        const quotedColumns = columns.map(c => `"${c}"`).join(', ')
        const sql = `INSERT INTO "${table}" (${quotedColumns}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`

        await pg.query(sql, values)
      }

      console.log(`  ✅ ${table}: ${rows.length} lignes`)
      totalRows += rows.length
    } catch (error: any) {
      // Table n'existe peut-être pas dans SQLite (nouvelles tables)
      if (error.message?.includes('no such table')) {
        console.log(`  ⏭️  ${table}: n'existe pas dans SQLite`)
      } else {
        console.error(`  ❌ ${table}: ${error.message}`)
      }
    }
  }

  console.log(`\n🎉 Migration terminée: ${totalRows} lignes migrées`)

  await pg.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('💥 Erreur fatale:', err)
  process.exit(1)
})
