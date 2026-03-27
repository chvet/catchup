/**
 * Migration: Ajout des colonnes adresse aux structures
 * et peuplement avec des adresses réalistes pour les 11 structures existantes.
 *
 * Usage: npx tsx scripts/migrate-structure-addresses.ts
 */

import { createClient } from '@libsql/client'
import 'dotenv/config'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const STRUCTURE_ADDRESSES: Record<string, {
  adresse: string
  codePostal: string
  ville: string
  latitude: number
  longitude: number
}> = {
  'Mission Locale Paris 15': {
    adresse: '2 rue Frémicourt',
    codePostal: '75015',
    ville: 'Paris',
    latitude: 48.8422,
    longitude: 2.2945,
  },
  'CIO Lyon 3': {
    adresse: '28 rue Julien',
    codePostal: '69003',
    ville: 'Lyon',
    latitude: 45.7607,
    longitude: 4.8545,
  },
  'E2C Lille Métropole': {
    adresse: '1 place Sébastopol',
    codePostal: '59000',
    ville: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
  },
  'ML Marseille': {
    adresse: '4 rue de la République',
    codePostal: '13001',
    ville: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
  },
  'PAIO Toulouse': {
    adresse: '5 rue du Rempart Saint-Étienne',
    codePostal: '31000',
    ville: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
  },
  'ML Bordeaux': {
    adresse: '22 quai de Paludate',
    codePostal: '33800',
    ville: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5614,
  },
  'CIO Nantes': {
    adresse: '3 rue Racine',
    codePostal: '44000',
    ville: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
  },
  'E2C Strasbourg': {
    adresse: '7 rue du Fossé des Treize',
    codePostal: '67000',
    ville: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
  },
  'ML Nice': {
    adresse: '15 avenue Jean Médecin',
    codePostal: '06000',
    ville: 'Nice',
    latitude: 43.7102,
    longitude: 7.2620,
  },
  'Fondation JAE': {
    adresse: '26 rue du Sergent Michel Berthet',
    codePostal: '69009',
    ville: 'Lyon',
    latitude: 45.7740,
    longitude: 4.8040,
  },
  'Fondation JAE Lyon': {
    adresse: '26 rue du Sergent Michel Berthet',
    codePostal: '69008',
    ville: 'Lyon',
    latitude: 45.7380,
    longitude: 4.8700,
  },
}

async function main() {
  console.log('=== Migration: Adresses des structures ===\n')

  // 1. Vérifier si les colonnes existent déjà
  const tableInfo = await client.execute('PRAGMA table_info(structure)')
  const existingColumns = tableInfo.rows.map(r => r.name as string)

  const columnsToAdd = [
    { name: 'adresse', type: 'TEXT' },
    { name: 'code_postal', type: 'TEXT' },
    { name: 'ville', type: 'TEXT' },
    { name: 'latitude', type: 'REAL' },
    { name: 'longitude', type: 'REAL' },
  ]

  for (const col of columnsToAdd) {
    if (existingColumns.includes(col.name)) {
      console.log(`  ✓ Colonne "${col.name}" existe déjà`)
    } else {
      await client.execute(`ALTER TABLE structure ADD COLUMN ${col.name} ${col.type}`)
      console.log(`  + Colonne "${col.name}" ajoutée`)
    }
  }

  // 2. Mettre à jour les structures existantes
  console.log('\nMise à jour des adresses...\n')

  const structures = await client.execute('SELECT id, nom FROM structure')

  let updated = 0
  for (const row of structures.rows) {
    const nom = row.nom as string
    const id = row.id as string
    const addr = STRUCTURE_ADDRESSES[nom]

    if (addr) {
      await client.execute({
        sql: `UPDATE structure SET adresse = ?, code_postal = ?, ville = ?, latitude = ?, longitude = ? WHERE id = ?`,
        args: [addr.adresse, addr.codePostal, addr.ville, addr.latitude, addr.longitude, id],
      })
      console.log(`  ✓ ${nom} → ${addr.adresse}, ${addr.codePostal} ${addr.ville}`)
      updated++
    } else {
      console.log(`  ⚠ "${nom}" — pas d'adresse correspondante`)
    }
  }

  console.log(`\n=== Terminé: ${updated} structures mises à jour ===`)
  process.exit(0)
}

main().catch(err => {
  console.error('Erreur:', err)
  process.exit(1)
})
