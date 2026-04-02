import type { Config } from 'drizzle-kit'

export default {
  schema: './src/data/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://catchup:CatchUp2026Pg!@localhost:5432/catchup',
  },
} satisfies Config
