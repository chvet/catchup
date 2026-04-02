// PATCH /api/conseiller/file-active/[id]/activites/[actId] — Valider ou refuser une déclaration

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { declarationActivite } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  try {
    const { actId } = await params
    const ctx = await getConseillerFromHeaders()

    const body = await request.json()
    const { statut, commentaire } = body

    if (!statut || !['validee', 'refusee'].includes(statut)) {
      return jsonError('statut doit être "validee" ou "refusee"', 400)
    }

    const now = new Date().toISOString()

    await db
      .update(declarationActivite)
      .set({
        statut,
        valideePar: ctx.id,
        valideLe: now,
        commentaireConseiller: commentaire || null,
        misAJourLe: now,
      })
      .where(eq(declarationActivite.id, actId))

    return jsonSuccess({ ok: true })
  } catch (error) {
    console.error('[Activite PATCH]', error)
    return jsonError('Erreur serveur', 500)
  }
}
