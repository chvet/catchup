// Connexion à la base PostgreSQL via Drizzle ORM
// (sert pour l'API bénéficiaire ET l'Espace Conseiller)

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://catchup:CatchUp2026Pg!@localhost:5432/catchup',
})

export const db = drizzle(pool, { schema })
export { schema }
