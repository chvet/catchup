// GET  /api/conseiller/admin/providers — Liste tous les fournisseurs avec leur statut
// PUT  /api/conseiller/admin/providers — Mise à jour bulk (actif, priorité, réglages)
// Accès : super_admin uniquement

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { getAllProviders, invalidateCache, seedProviderConfigIfEmpty } from '@/lib/provider-resolver'
import { db } from '@/data/db'
import { providerConfig } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx) return jsonError('Non authentifié', 401)
    if (!hasRole(ctx, 'super_admin')) return jsonError('Accès réservé aux super administrateurs', 403)

    // Seed si la table est vide (premier accès)
    await seedProviderConfigIfEmpty()

    const providers = await getAllProviders()
    return jsonSuccess({ providers })
  } catch (error) {
    console.error('[Admin Providers GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx) return jsonError('Non authentifié', 401)
    if (!hasRole(ctx, 'super_admin')) return jsonError('Accès réservé aux super administrateurs', 403)

    const body = await request.json()
    const { providers } = body

    if (!Array.isArray(providers)) {
      return jsonError('Format invalide : providers[] attendu', 400)
    }

    const now = new Date().toISOString()

    for (const p of providers) {
      if (!p.id) continue
      await db
        .update(providerConfig)
        .set({
          actif: p.actif ? 1 : 0,
          priorite: typeof p.priorite === 'number' ? p.priorite : undefined,
          reglages: p.reglages ? JSON.stringify(p.reglages) : undefined,
          misAJourLe: now,
        })
        .where(eq(providerConfig.id, p.id))
    }

    // Invalider le cache pour que les changements soient pris en compte immédiatement
    invalidateCache()

    return jsonSuccess({ updated: providers.length })
  } catch (error) {
    console.error('[Admin Providers PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}
