// GET & POST /api/conseiller/file-active/[id]/direct-messages
// Messagerie directe conseiller <-> beneficiaire

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { referral, priseEnCharge, messageDirect, codeVerification, utilisateur } from '@/data/schema'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendPinCode } from '@/lib/sms'

// GET — Liste des messages + marquer comme lus
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifie', 401)
    }

    // Trouver la prise en charge liee a ce referral
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvee', 404)
    }

    const pec = pecs[0]

    // Recuperer tous les messages de cette prise en charge
    const messages = await db
      .select()
      .from(messageDirect)
      .where(eq(messageDirect.priseEnChargeId, pec.id))
      .orderBy(asc(messageDirect.horodatage))

    // Marquer les messages du beneficiaire comme lus (batch update)
    const unreadFromBeneficiaire = messages.filter(
      (m) => m.expediteurType === 'beneficiaire' && m.lu === 0
    )

    if (unreadFromBeneficiaire.length > 0) {
      await Promise.all(
        unreadFromBeneficiaire.map((m) =>
          db
            .update(messageDirect)
            .set({ lu: 1 })
            .where(eq(messageDirect.id, m.id))
        )
      )
    }

    // Recuperer les infos du beneficiaire via le referral -> utilisateur
    const refs = await db
      .select()
      .from(referral)
      .where(eq(referral.id, referralId))

    let beneficiaire: { prenom: string | null; age: number | null } = { prenom: null, age: null }

    if (refs.length > 0) {
      const users = await db
        .select({ prenom: utilisateur.prenom, age: utilisateur.age })
        .from(utilisateur)
        .where(eq(utilisateur.id, refs[0].utilisateurId))

      if (users.length > 0) {
        beneficiaire = users[0]
      }
    }

    return jsonSuccess({
      messages: messages.map((m) => ({
        ...m,
        // Rafraichir le statut lu pour les messages qu'on vient de marquer
        lu: m.expediteurType === 'beneficiaire' ? 1 : m.lu,
      })),
      beneficiaire,
      priseEnCharge: {
        id: pec.id,
        statut: pec.statut,
      },
    })
  } catch (error) {
    console.error('[Direct Messages GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

// POST — Envoyer un message (conseiller -> beneficiaire)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifie', 401)
    }

    const body = await request.json()
    const { contenu } = body

    if (!contenu || typeof contenu !== 'string' || contenu.trim().length === 0) {
      return jsonError('Le contenu du message est requis', 400)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvee', 404)
    }

    const pec = pecs[0]

    if (pec.statut !== 'prise_en_charge') {
      return jsonError(
        `Impossible d'envoyer un message : statut actuel "${pec.statut}". Le statut doit etre "prise_en_charge".`,
        400
      )
    }

    // Creer le message
    const now = new Date().toISOString()
    const messageId = uuidv4()

    const newMessage = {
      id: messageId,
      priseEnChargeId: pec.id,
      expediteurType: 'conseiller' as const,
      expediteurId: ctx.id,
      contenu: contenu.trim(),
      lu: 0,
      horodatage: now,
    }

    await db.insert(messageDirect).values(newMessage)

    // Premier message : generer un code PIN pour le beneficiaire
    let codeInfo: { codeGenere: boolean; code?: string; moyenContact?: string | null } = {
      codeGenere: false,
    }

    if (pec.notificationEnvoyee === 0) {
      // Generer un code a 6 chiffres
      const code = String(Math.floor(100000 + Math.random() * 900000))

      // Recuperer le referral pour l'utilisateurId et le moyen de contact
      const refs = await db
        .select()
        .from(referral)
        .where(eq(referral.id, referralId))

      if (refs.length > 0) {
        const ref = refs[0]
        const token = uuidv4()
        const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours

        // Creer l'enregistrement de verification
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

        // Marquer la notification comme envoyee
        await db
          .update(priseEnCharge)
          .set({ notificationEnvoyee: 1, misAJourLe: now })
          .where(eq(priseEnCharge.id, pec.id))

        // Envoyer le code par SMS/email/console selon la configuration
        const notifResult = await sendPinCode(ref.moyenContact || '', code, {
          type: 'beneficiaire',
          prenom: undefined, // on n'a pas le prénom ici
          conseillerPrenom: ctx.email?.split('@')[0],
        })
        console.log(`[PIN] Code pour ${ref.moyenContact}: ${code} (envoyé via ${notifResult.channel})`)

        codeInfo = {
          codeGenere: true,
          code,
          moyenContact: ref.moyenContact,
        }
      }
    }

    // Audit
    await logAudit(ctx.id, 'send_direct_message', 'message_direct', messageId, {
      priseEnChargeId: pec.id,
      referralId,
      ...(codeInfo.codeGenere ? { codeGenere: true } : {}),
    })

    return jsonSuccess({
      message: newMessage,
      ...codeInfo,
    }, 201)
  } catch (error) {
    console.error('[Direct Messages POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
