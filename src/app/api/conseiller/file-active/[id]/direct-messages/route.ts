// GET & POST /api/conseiller/file-active/[id]/direct-messages
// Messagerie directe conseiller <-> beneficiaire

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { referral, priseEnCharge, messageDirect, codeVerification, utilisateur, conseiller } from '@/data/schema'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendPinCode } from '@/lib/sms'
import { notifyBeneficiaireNewMessage } from '@/lib/push-triggers'
import { translateMessage } from '@/lib/translate'
import { safeJsonParse } from '@/core/constants'

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

    // Vérifier que le conseiller est bien assigné (ou super_admin)
    if (pec.conseillerId !== ctx.id && ctx.role !== 'super_admin') {
      return jsonError('Non autorise', 403)
    }

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

    let beneficiaire: { prenom: string | null; age: number | null; langue: string } = { prenom: null, age: null, langue: 'fr' }

    if (refs.length > 0) {
      const users = await db
        .select({ prenom: utilisateur.prenom, age: utilisateur.age, preferences: utilisateur.preferences })
        .from(utilisateur)
        .where(eq(utilisateur.id, refs[0].utilisateurId))

      if (users.length > 0) {
        const prefs = safeJsonParse<Record<string, string>>(users[0].preferences, {})
        beneficiaire = { prenom: users[0].prenom, age: users[0].age, langue: prefs.langue || 'fr' }
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

    // Vérifier que le conseiller est bien assigné à cette prise en charge (ou super_admin)
    if (pec.conseillerId !== ctx.id && ctx.role !== 'super_admin') {
      return jsonError('Non autorise', 403)
    }

    if (pec.statut !== 'prise_en_charge') {
      return jsonError('Impossible d\'envoyer un message pour cette prise en charge', 400)
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

    // Traduction automatique vers la langue du bénéficiaire (bloquant avec timeout 3s)
    let contenuTraduit: string | null = null
    let langueCible: string | null = null
    const refs0 = await db.select({ utilisateurId: referral.utilisateurId }).from(referral).where(eq(referral.id, referralId))
    if (refs0.length > 0) {
      try {
        const users = await db.select({ preferences: utilisateur.preferences }).from(utilisateur).where(eq(utilisateur.id, refs0[0].utilisateurId))
        const prefs = safeJsonParse<Record<string, string>>(users[0]?.preferences, {})
        const langBenef = prefs.langue || 'fr'
        if (langBenef !== 'fr') {
          const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))
          const translated = await Promise.race([translateMessage(contenu.trim(), 'fr', langBenef), timeout])
          if (translated) {
            contenuTraduit = translated
            langueCible = langBenef
            await db.update(messageDirect)
              .set({ contenuTraduit, langueCible })
              .where(eq(messageDirect.id, messageId))
          }
        }
      } catch { /* traduction non-bloquante en cas d'erreur */ }
    }

    // Premier message : generer un code PIN pour le beneficiaire
    let codeInfo: { codeGenere: boolean; code?: string; moyenContact?: string | null } = {
      codeGenere: false,
    }

    if (pec.notificationEnvoyee === 0) {
      // Generer un code a 6 chiffres
      const randomBytes = new Uint32Array(1)
      crypto.getRandomValues(randomBytes)
      const code = String(100000 + (randomBytes[0] % 900000))

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

        // Récupérer le prénom du conseiller et du bénéficiaire
        const conseillerForSms = await db.select({ prenom: conseiller.prenom }).from(conseiller).where(eq(conseiller.id, ctx.id))
        const conseillerPrenom = conseillerForSms[0]?.prenom || undefined
        const userForSms = await db.select({ prenom: utilisateur.prenom }).from(utilisateur).where(eq(utilisateur.id, ref.utilisateurId))
        const beneficiairePrenom = userForSms[0]?.prenom || undefined

        // Envoyer le code par SMS/email/console selon la configuration
        const notifResult = await sendPinCode(ref.moyenContact || '', code, {
          type: 'beneficiaire',
          prenom: beneficiairePrenom,
          conseillerPrenom,
        })
        console.log(`[PIN] Code envoyé à ${ref.moyenContact} via ${notifResult.channel}`)

        codeInfo = {
          codeGenere: true,
          code,
          moyenContact: ref.moyenContact,
        }
      }
    }

    // Notification push au bénéficiaire
    try {
      const refForPush = await db.select({ utilisateurId: referral.utilisateurId }).from(referral).where(eq(referral.id, referralId))
      if (refForPush.length > 0) {
        const conseillerInfo = await db.select({ prenom: conseiller.prenom }).from(conseiller).where(eq(conseiller.id, ctx.id))
        const cPrenom = conseillerInfo[0]?.prenom || 'Votre conseiller'
        notifyBeneficiaireNewMessage(refForPush[0].utilisateurId, cPrenom).catch(() => {})
      }
    } catch { /* push non-bloquant */ }

    // Audit
    await logAudit(ctx.id, 'send_direct_message', 'message_direct', messageId, {
      priseEnChargeId: pec.id,
      referralId,
      ...(codeInfo.codeGenere ? { codeGenere: true } : {}),
    })

    return jsonSuccess({
      message: { ...newMessage, contenuTraduit, langueCible },
      ...codeInfo,
    }, 201)
  } catch (error) {
    console.error('[Direct Messages POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
