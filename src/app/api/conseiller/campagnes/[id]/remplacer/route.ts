// POST /api/conseiller/campagnes/[id]/remplacer
// Archive la campagne actuelle et crée une nouvelle avec le même slug

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { campagne, campagneAssignation } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces reserve aux administrateurs de structure', 403)
    }

    const { id } = await params

    // Récupérer la campagne à remplacer
    const rows = await db.select().from(campagne).where(eq(campagne.id, id))
    if (rows.length === 0) return jsonError('Campagne non trouvee', 404)

    const ancienne = rows[0]
    if (ancienne.structureId !== ctx.structureId && !hasRole(ctx, 'super_admin')) {
      return jsonError('Acces refuse', 403)
    }

    if (ancienne.statut === 'archivee') {
      return jsonError('Cette campagne est deja archivee', 400)
    }

    const body = await request.json()
    const { designation, quantiteObjectif, uniteOeuvre, dateDebut, dateFin, conseillerIds } = body

    if (!designation || !quantiteObjectif || !uniteOeuvre || !dateDebut || !dateFin) {
      return jsonError('Tous les champs sont requis', 400)
    }

    const now = new Date().toISOString()
    const nouvelleCampagneId = uuidv4()

    // Le slug est conservé de l'ancienne campagne
    const slug = ancienne.slug

    // 1. Créer la nouvelle campagne avec le même slug
    await db.insert(campagne).values({
      id: nouvelleCampagneId,
      structureId: ancienne.structureId,
      slug,
      designation,
      quantiteObjectif: parseInt(quantiteObjectif, 10),
      uniteOeuvre,
      dateDebut,
      dateFin,
      statut: 'active',
      creeLe: now,
      misAJourLe: now,
    })

    // 2. Archiver l'ancienne campagne (retirer son slug pour éviter conflit)
    await db.update(campagne).set({
      statut: 'archivee',
      slug: `${slug}__archived__${ancienne.id.substring(0, 8)}`,
      archiveeLe: now,
      remplaceeParId: nouvelleCampagneId,
      misAJourLe: now,
    }).where(eq(campagne.id, id))

    // 3. Assigner les conseillers à la nouvelle campagne
    if (conseillerIds && Array.isArray(conseillerIds)) {
      for (const cId of conseillerIds) {
        await db.insert(campagneAssignation).values({
          id: uuidv4(),
          campagneId: nouvelleCampagneId,
          conseillerId: cId,
          creeLe: now,
        })
      }
    }

    return jsonSuccess({
      id: nouvelleCampagneId,
      slug,
      ancienneCampagneId: id,
    }, 201)
  } catch (error) {
    console.error('[Campagne Remplacer]', error)
    return jsonError('Erreur serveur', 500)
  }
}
