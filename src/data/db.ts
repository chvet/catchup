// Connexion à la base Turso via Drizzle ORM
// (sert pour l'API bénéficiaire ET l'Espace Conseiller)

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || (process.env.NODE_ENV === 'production' ? 'file:/app/data/local.db' : 'file:local.db'),
  authToken: process.env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(client, { schema })
export { schema }
