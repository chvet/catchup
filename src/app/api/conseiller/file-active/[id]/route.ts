// GET /api/conseiller/file-active/[id] — Détail d'un referral
// POST /api/conseiller/file-active/[id] — Prendre en charge

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { referral, utilisateur, profilRiasec, indiceConfiance, conversation, priseEnCharge, structure, conseiller, codeVerification } from '@/data/schema'
import { eq, and, desc, ne } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendPinCode } from '@/lib/sms'
import { matcherStructures, type MatchingCriteria, type StructureData } from '@/core/matching'
import { DEPARTMENT_COORDS } from '@/lib/geo-departments'
import { safeJsonParse } from '@/core/constants'

// Calcul distance Haversine en km entre 2 points GPS
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
import { notifyBeneficiaireAccepted } from '@/lib/push-triggers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    // Récupérer le referral complet
    const refs = await db
      .select()
      .from(referral)
      .where(eq(referral.id, id))

    if (refs.length === 0) {
      return jsonError('Referral non trouvé', 404)
    }

    const ref = refs[0]

    // Récupérer l'utilisateur
    const users = await db
      .select()
      .from(utilisateur)
      .where(eq(utilisateur.id, ref.utilisateurId))

    const user = users[0] || null

    // Profil RIASEC
    const profils = await db
      .select()
      .from(profilRiasec)
      .where(eq(profilRiasec.utilisateurId, ref.utilisateurId))

    const profil = profils[0] || null

    // Indice de confiance
    const confiances = await db
      .select()
      .from(indiceConfiance)
      .where(eq(indiceConfiance.utilisateurId, ref.utilisateurId))

    const confiance = confiances[0] || null

    // Conversation
    const convs = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, ref.conversationId))

    const conv = convs[0] || null

    // Prise en charge existante
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    const pec = pecs[0] || null

    // Matching : calculer les structures suggérées
    const allStructures = await db.select().from(structure).where(eq(structure.actif, 1))

    // Compter les cas actifs par structure
    const structuresData: StructureData[] = allStructures.map(s => ({
      id: s.id,
      nom: s.nom,
      departements: safeJsonParse<string[]>(s.departements, []),
      regions: safeJsonParse<string[]>(s.regions, []),
      ageMin: s.ageMin ?? 16,
      ageMax: s.ageMax ?? 25,
      specialites: safeJsonParse<string[]>(s.specialites, []),
      genrePreference: s.genrePreference,
      capaciteMax: s.capaciteMax ?? 50,
      casActifs: 0, // sera enrichi ci-dessous
      actif: true,
    }))

    const criteria: MatchingCriteria = {
      age: ref.ageBeneficiaire,
      genre: ref.genre,
      departement: ref.localisation,
      situation: user?.situation || null,
      riasecDominant: profil?.dimensionsDominantes ? JSON.parse(profil.dimensionsDominantes) : [],
      urgence: ref.priorite as MatchingCriteria['urgence'],
      fragilite: 'none',
    }

    const matchingResults = matcherStructures(criteria, structuresData)

    // Historique : autres referrals du même bénéficiaire (déduplication)
    const historique = await db
      .select({
        referralId: referral.id,
        statut: referral.statut,
        priorite: referral.priorite,
        motif: referral.motif,
        creeLe: referral.creeLe,
        conversationId: referral.conversationId,
        nbMessages: conversation.nbMessages,
        phase: conversation.phase,
      })
      .from(referral)
      .leftJoin(conversation, eq(conversation.id, referral.conversationId))
      .where(and(
        eq(referral.utilisateurId, ref.utilisateurId),
        ne(referral.id, id)
      ))
      .orderBy(desc(referral.creeLe))
      .limit(10)

    // Audit
    await logAudit(ctx.id, 'view_profile', 'referral', id)

    // Temps d'attente
    const attenteMs = Date.now() - new Date(ref.creeLe).getTime()
    const attenteHeures = Math.round(attenteMs / (1000 * 60 * 60))

    return jsonSuccess({
      referral: ref,
      beneficiaire: user ? {
        prenom: user.prenom,
        age: user.age,
        situation: user.situation,
      } : null,
      profil: profil ? {
        r: profil.r,
        i: profil.i,
        a: profil.a,
        s: profil.s,
        e: profil.e,
        c: profil.c,
        dimensionsDominantes: profil.dimensionsDominantes ? JSON.parse(profil.dimensionsDominantes) : [],
        traits: profil.traits ? JSON.parse(profil.traits) : [],
        interets: profil.interets ? JSON.parse(profil.interets) : [],
        forces: profil.forces ? JSON.parse(profil.forces) : [],
        suggestion: profil.suggestion,
      } : null,
      confiance: confiance ? {
        scoreGlobal: confiance.scoreGlobal,
        niveau: confiance.niveau,
      } : null,
      conversation: conv ? {
        id: conv.id,
        nbMessages: conv.nbMessages,
        phase: conv.phase,
        dureeSecondes: conv.dureeSecondes,
      } : null,
      priseEnCharge: pec,
      // Info structure assignée (avec adresse pour la carte)
      structureAssignee: pec ? (() => {
        const s = allStructures.find(s => s.id === pec.structureId)
        return s ? {
          id: s.id,
          nom: s.nom,
          adresse: s.adresse,
          codePostal: s.codePostal,
          ville: s.ville,
          latitude: s.latitude,
          longitude: s.longitude,
        } : null
      })() : null,
      // Distance structure ↔ bénéficiaire en km
      distance: (() => {
        if (!pec) return null
        const s = allStructures.find(s => s.id === pec.structureId)
        const sLat = s?.latitude as number | undefined
        const sLng = s?.longitude as number | undefined
        const dept = ref.localisation
        const bCoord = dept ? DEPARTMENT_COORDS[dept] : null
        if (sLat && sLng && bCoord) {
          const km = Math.round(haversineKm(sLat, sLng, bCoord.lat, bCoord.lng))
          return { km, label: km < 1 ? '< 1 km' : km < 10 ? `${km} km` : `${km} km` }
        }
        return null
      })(),
      matching: matchingResults.slice(0, 5),
      attente: {
        heures: attenteHeures,
        label: attenteHeures < 1 ? '< 1h' : attenteHeures < 24 ? `${attenteHeures}h` : `${Math.round(attenteHeures / 24)}j`,
      },
      historique: historique.length > 0 ? historique : null,
    })
  } catch (error) {
    console.error('[File Active Detail]', error)
    return jsonError('Erreur serveur', 500)
  }
}

// POST — Prendre en charge
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    // Vérifier que le referral existe
    const refs = await db.select().from(referral).where(eq(referral.id, id))
    if (refs.length === 0) return jsonError('Referral non trouvé', 404)

    const ref = refs[0]

    // Déterminer la structureId : celle du conseiller, ou celle suggérée dans le referral (pour super_admin)
    const effectiveStructureId = ctx.structureId || ref.structureSuggereId
    if (!effectiveStructureId) {
      return jsonError('Pas de structure rattachée. Assignez une structure depuis la gestion des structures.', 403)
    }

    // Vérifier qu'il n'est pas déjà pris en charge
    const existingPec = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (existingPec.length > 0) {
      return jsonError('Déjà pris en charge', 409)
    }

    const now = new Date().toISOString()

    // Créer la prise en charge
    const pecId = uuidv4()
    await db.insert(priseEnCharge).values({
      id: pecId,
      referralId: id,
      conseillerId: ctx.id,
      structureId: effectiveStructureId,
      statut: 'prise_en_charge',
      premiereActionLe: now,
      creeLe: now,
      misAJourLe: now,
    })

    // Mettre à jour le statut du referral
    await db
      .update(referral)
      .set({ statut: 'prise_en_charge', misAJourLe: now })
      .where(eq(referral.id, id))

    // Audit
    await logAudit(ctx.id, 'claim_case', 'referral', id)

    // Notification push au bénéficiaire
    const conseillerRows = await db.select({ prenom: conseiller.prenom }).from(conseiller).where(eq(conseiller.id, ctx.id))
    const conseillerPrenom = conseillerRows[0]?.prenom || 'Votre conseiller'
    notifyBeneficiaireAccepted(ref.utilisateurId, conseillerPrenom).catch(() => {})

    // Envoyer le code PIN par SMS au bénéficiaire
    try {
      const randomBytes = new Uint32Array(1)
      crypto.getRandomValues(randomBytes)
      const code = String(100000 + (randomBytes[0] % 900000))
      const token = uuidv4()
      const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

      await db.insert(codeVerification).values({
        id: uuidv4(),
        referralId: id,
        utilisateurId: ref.utilisateurId,
        code,
        token,
        verifie: 0,
        tentatives: 0,
        expireLe,
        creeLe: now,
      })

      // Marquer la notification comme envoyée
      await db
        .update(priseEnCharge)
        .set({ notificationEnvoyee: 1, misAJourLe: now })
        .where(eq(priseEnCharge.id, pecId))

      const userForSms = await db.select({ prenom: utilisateur.prenom }).from(utilisateur).where(eq(utilisateur.id, ref.utilisateurId))
      const beneficiairePrenom = userForSms[0]?.prenom || undefined

      const notifResult = await sendPinCode(ref.moyenContact || '', code, {
        type: 'beneficiaire',
        prenom: beneficiairePrenom,
        conseillerPrenom,
      })
      console.log(`[PIN] Code envoyé à ${ref.moyenContact} via ${notifResult.channel} (prise en charge)`)
    } catch (smsErr) {
      console.error('[PIN] Erreur envoi SMS prise en charge:', smsErr)
    }

    return jsonSuccess({ id: pecId, message: 'Prise en charge créée' }, 201)
  } catch (error) {
    console.error('[File Active Claim]', error)
    return jsonError('Erreur serveur', 500)
  }
}
