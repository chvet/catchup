// Provider Resolver — Résolution dynamique des fournisseurs tiers
// Lit la config depuis provider_config (cache 60s), gère les fallbacks

import { db } from '@/data/db'
import { providerConfig } from '@/data/schema'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { safeJsonParse } from '@/core/constants'

// --- Types ---

export type ProviderType = 'llm' | 'sms' | 'email' | 'tts' | 'stt'

export interface ProviderEntry {
  id: string
  providerType: ProviderType
  providerName: string
  actif: boolean
  priorite: number
  configured: boolean
  dernierSucces: string | null
  dernierEchec: string | null
  dernierMessageErreur: string | null
  reglages: Record<string, unknown>
}

// --- Env var requirements per provider ---

const ENV_REQUIREMENTS: Record<string, string[]> = {
  openai: ['OPENAI_API_KEY'],
  anthropic: ['ANTHROPIC_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
  vonage: ['VONAGE_API_KEY', 'VONAGE_API_SECRET'],
  ovh: ['OVH_SMS_ACCOUNT', 'OVH_SMS_LOGIN', 'OVH_SMS_PASSWORD'],
  smtp: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
  o365: ['O365_TENANT_ID', 'O365_CLIENT_ID', 'O365_CLIENT_SECRET'],
  brevo: ['BREVO_API_KEY'],
  google_tts: [],
}

export function isProviderConfigured(name: string): boolean {
  const required = ENV_REQUIREMENTS[name] || []
  return required.every(key => !!process.env[key])
}

// --- Default providers (seed + fallback if DB unreachable) ---

const DEFAULT_PROVIDERS: Array<{ type: ProviderType; name: string; actif: number; priorite: number }> = [
  { type: 'llm', name: 'openai', actif: 1, priorite: 0 },
  { type: 'llm', name: 'anthropic', actif: 0, priorite: 1 },
  { type: 'llm', name: 'mistral', actif: 0, priorite: 2 },
  { type: 'sms', name: 'vonage', actif: 1, priorite: 0 },
  { type: 'sms', name: 'ovh', actif: 1, priorite: 1 },
  { type: 'email', name: 'smtp', actif: 1, priorite: 0 },
  { type: 'email', name: 'o365', actif: 1, priorite: 1 },
  { type: 'email', name: 'brevo', actif: 1, priorite: 2 },
  { type: 'tts', name: 'google_tts', actif: 1, priorite: 0 },
  { type: 'stt', name: 'openai', actif: 1, priorite: 0 },
]

// --- In-memory cache (60s TTL) ---

const CACHE_TTL_MS = 60_000
const cache = new Map<ProviderType, { data: ProviderEntry[]; fetchedAt: number }>()

export function invalidateCache(type?: ProviderType): void {
  if (type) {
    cache.delete(type)
  } else {
    cache.clear()
  }
}

// --- Core resolver ---

export async function resolveProviders(type: ProviderType): Promise<ProviderEntry[]> {
  const cached = cache.get(type)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const rows = await db
      .select()
      .from(providerConfig)
      .where(eq(providerConfig.providerType, type))
      .orderBy(asc(providerConfig.priorite))

    const entries: ProviderEntry[] = rows.map(row => ({
      id: row.id,
      providerType: row.providerType as ProviderType,
      providerName: row.providerName,
      actif: row.actif === 1,
      priorite: row.priorite ?? 0,
      configured: isProviderConfigured(row.providerName),
      dernierSucces: row.dernierSucces,
      dernierEchec: row.dernierEchec,
      dernierMessageErreur: row.dernierMessageErreur,
      reglages: safeJsonParse<Record<string, unknown>>(row.reglages, {}),
    }))

    cache.set(type, { data: entries, fetchedAt: Date.now() })
    return entries
  } catch (err) {
    console.warn(`[ProviderResolver] DB unreachable, using defaults for ${type}:`, (err as Error).message)
    return defaultEntriesForType(type)
  }
}

export async function getActiveProvider(type: ProviderType): Promise<ProviderEntry | null> {
  const providers = await resolveProviders(type)
  return providers.find(p => p.actif && p.configured) ?? null
}

export async function getAllProviders(): Promise<ProviderEntry[]> {
  try {
    const rows = await db
      .select()
      .from(providerConfig)
      .orderBy(asc(providerConfig.providerType), asc(providerConfig.priorite))

    return rows.map(row => ({
      id: row.id,
      providerType: row.providerType as ProviderType,
      providerName: row.providerName,
      actif: row.actif === 1,
      priorite: row.priorite ?? 0,
      configured: isProviderConfigured(row.providerName),
      dernierSucces: row.dernierSucces,
      dernierEchec: row.dernierEchec,
      dernierMessageErreur: row.dernierMessageErreur,
      reglages: safeJsonParse<Record<string, unknown>>(row.reglages, {}),
    }))
  } catch {
    return ALL_TYPES.flatMap(t => defaultEntriesForType(t))
  }
}

// --- Health reporting ---

export async function reportSuccess(type: ProviderType, name: string): Promise<void> {
  const now = new Date().toISOString()
  try {
    await db
      .update(providerConfig)
      .set({ dernierSucces: now, misAJourLe: now })
      .where(and(eq(providerConfig.providerType, type), eq(providerConfig.providerName, name)))
    invalidateCache(type)
  } catch { /* non-blocking */ }
}

export async function reportFailure(type: ProviderType, name: string, error: string): Promise<void> {
  const now = new Date().toISOString()
  try {
    await db
      .update(providerConfig)
      .set({ dernierEchec: now, dernierMessageErreur: error.slice(0, 500), misAJourLe: now })
      .where(and(eq(providerConfig.providerType, type), eq(providerConfig.providerName, name)))
    invalidateCache(type)
  } catch { /* non-blocking */ }
}

// --- Seed (called from docker-entrypoint or first resolve) ---

export async function seedProviderConfigIfEmpty(): Promise<void> {
  try {
    const existing = await db.select({ id: providerConfig.id }).from(providerConfig).limit(1)
    if (existing.length > 0) return

    const now = new Date().toISOString()
    for (const p of DEFAULT_PROVIDERS) {
      await db.insert(providerConfig).values({
        id: uuidv4(),
        providerType: p.type,
        providerName: p.name,
        actif: p.actif,
        priorite: p.priorite,
        creeLe: now,
        misAJourLe: now,
      })
    }
    console.log('[ProviderResolver] Seeded provider_config with defaults')
  } catch (err) {
    console.warn('[ProviderResolver] Seed failed:', (err as Error).message)
  }
}

// --- Helpers ---

const ALL_TYPES: ProviderType[] = ['llm', 'sms', 'email', 'tts', 'stt']

function defaultEntriesForType(type: ProviderType): ProviderEntry[] {
  return DEFAULT_PROVIDERS
    .filter(p => p.type === type)
    .map(p => ({
      id: `default-${p.type}-${p.name}`,
      providerType: p.type,
      providerName: p.name,
      actif: p.actif === 1,
      priorite: p.priorite,
      configured: isProviderConfigured(p.name),
      dernierSucces: null,
      dernierEchec: null,
      dernierMessageErreur: null,
      reglages: {},
    }))
}
