// GET + POST /api/conseiller/file-active/[id]/notes
// Notes du conseiller sur un cas

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { priseEnCharge } from '@/data/schema'
import { eq } from 'drizzle-orm'

interface Note {
  id: string
  conseillerId: string
  contenu: string
  horodatage: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonSuccess({ notes: [] })
    }

    const notes: Note[] = pecs[0].notes ? JSON.parse(pecs[0].notes) : []
    return jsonSuccess({ notes })
  } catch (error) {
    console.error('[Notes GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()
    const body = await request.json()
    const { contenu } = body

    if (!contenu || typeof contenu !== 'string' || contenu.trim().length === 0) {
      return jsonError('Contenu de la note requis', 400)
    }

    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonError('Prise en charge non trouvée', 404)
    }

    const pec = pecs[0]
    const existingNotes: Note[] = pec.notes ? JSON.parse(pec.notes) : []

    const newNote: Note = {
      id: crypto.randomUUID(),
      conseillerId: ctx.id,
      contenu: contenu.trim(),
      horodatage: new Date().toISOString(),
    }

    existingNotes.push(newNote)

    await db
      .update(priseEnCharge)
      .set({
        notes: JSON.stringify(existingNotes),
        misAJourLe: new Date().toISOString(),
      })
      .where(eq(priseEnCharge.id, pec.id))

    // Audit (on ne log pas le contenu de la note)
    await logAudit(ctx.id, 'add_note', 'referral', id)

    return jsonSuccess({ note: newNote }, 201)
  } catch (error) {
    console.error('[Notes POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
