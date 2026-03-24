// POST /api/conseiller/file-active/[id]/resend-code
// Regénère et renvoie un code PIN au bénéficiaire (quand l'ancien a expiré ou n'a pas été reçu)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { referral, priseEnCharge, codeVerification } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendPinCode } from '@/lib/sms'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifié', 401)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvée', 404)
    }

    const pec = pecs[0]

    // Récupérer le referral pour les infos du bénéficiaire
    const refs = await db
      .select()
      .from(referral)
      .where(eq(referral.id, referralId))

    if (refs.length === 0) {
      return jsonError('Referral non trouvé', 404)
    }

    const ref = refs[0]
    const now = new Date().toISOString()

    // Invalider les anciens codes non vérifiés pour ce referral
    const oldCodes = await db
      .select()
      .from(codeVerification)
      .where(
        and(
          eq(codeVerification.referralId, referralId),
          eq(codeVerification.verifie, 0)
        )
      )

    // Marquer les anciens comme expirés (en mettant expireLe dans le passé)
    for (const old of oldCodes) {
      await db
        .update(codeVerification)
        .set({ expireLe: now })
        .where(eq(codeVerification.id, old.id))
    }

    // Générer un nouveau code à 6 chiffres
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const token = uuidv4()
    const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours

    await db.insert(codeVerification).values({
      id: uuidv4(),
      referralId,
      utilisateurId: ref.utilisateurId,
      code,
      token,
      verifie: 0,
      tentatives: 0,
      expireLe,
      creeLe: now,
    })

    // Envoyer la notification
    const notifResult = await sendPinCode(ref.moyenContact || '', code, {
      type: 'beneficiaire',
      conseillerPrenom: ctx.email?.split('@')[0],
    })

    console.log(`[PIN RESEND] Nouveau code pour ${ref.moyenContact}: ${code} (via ${notifResult.channel})`)

    // Audit
    await logAudit(ctx.id, 'resend_code', 'referral', referralId)

    return jsonSuccess({
      code,
      moyenContact: ref.moyenContact,
      channel: notifResult.channel,
      sent: notifResult.sent,
    })
  } catch (error) {
    console.error('[Resend Code]', error)
    return jsonError('Erreur serveur', 500)
  }
}
