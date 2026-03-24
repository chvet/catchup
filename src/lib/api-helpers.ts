// Helpers pour les routes API conseiller
// Extraction des infos du middleware JWT

import { headers } from 'next/headers'

export interface ConseillerContext {
  id: string
  email: string
  role: 'conseiller' | 'admin_structure' | 'super_admin'
  structureId: string | null
}

/**
 * Récupère les infos du conseiller connecté depuis les headers
 * (injectés par le middleware après vérification JWT)
 */
export async function getConseillerFromHeaders(): Promise<ConseillerContext> {
  const h = await headers()
  return {
    id: h.get('x-conseiller-id') || '',
    email: h.get('x-conseiller-email') || '',
    role: (h.get('x-conseiller-role') || 'conseiller') as ConseillerContext['role'],
    structureId: h.get('x-conseiller-structure') || null,
  }
}

/**
 * Vérifie que le conseiller a le rôle minimum requis
 */
export function hasRole(ctx: ConseillerContext, minRole: 'conseiller' | 'admin_structure' | 'super_admin'): boolean {
  const hierarchy = { conseiller: 0, admin_structure: 1, super_admin: 2 }
  return hierarchy[ctx.role] >= hierarchy[minRole]
}

/**
 * Réponse JSON standardisée pour les erreurs
 */
export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

/**
 * Réponse JSON standardisée pour les succès
 */
export function jsonSuccess<T>(data: T, status = 200) {
  return Response.json(data, { status })
}
