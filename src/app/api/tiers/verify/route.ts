// POST /api/tiers/verify
// Vérifie le code PIN du tiers intervenant et retourne un token

import { db } from '@/data/db'
import { tiersIntervenant, codeVerification, priseEnCharge, referral, utilisateur } from '@/data/schema'
import { eq, and, gt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { telephone, code } = body

    if (!telephone || !code) {
      return NextResponse.json(
        { error: 'Téléphone et code requis' },
        { status: 400 }
      )
    }

    // 1. Trouver le tiers intervenant par téléphone (statut approuvé)
    const tiersList = await db
      .select()
      .from(tiersIntervenant)
      .where(
        and(
          eq(tiersIntervenant.telephone, telephone.trim()),
          eq(tiersIntervenant.statut, 'approuve')
        )
      )

    if (tiersList.length === 0) {
      return NextResponse.json(
        { error: 'Aucun intervenant trouvé pour ce numéro' },
        { status: 404 }
      )
    }

    const tiers = tiersList[0]

    // 2. Trouver le code de vérification non expiré, non vérifié
    const now = new Date().toISOString()
    const codes = await db
      .select()
      .from(codeVerification)
      .where(
        and(
          eq(codeVerification.utilisateurId, tiers.id),
          eq(codeVerification.verifie, 0),
          gt(codeVerification.expireLe, now)
        )
      )

    if (codes.length === 0) {
      return NextResponse.json(
        { error: 'Code expiré ou déjà utilisé. Demandez un nouveau code.' },
        { status: 410 }
      )
    }

    const codeRecord = codes[0]

    // 3. Vérifier le nombre de tentatives (max 5)
    if ((codeRecord.tentatives ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Nombre maximum de tentatives atteint. Demandez un nouveau code.' },
        { status: 429 }
      )
    }

    // 4. Vérifier le code
    if (codeRecord.code !== code.trim()) {
      await db
        .update(codeVerification)
        .set({ tentatives: (codeRecord.tentatives ?? 0) + 1 })
        .where(eq(codeVerification.id, codeRecord.id))

      const remaining = 4 - (codeRecord.tentatives ?? 0)
      return NextResponse.json(
        { error: `Code incorrect. ${remaining} tentative(s) restante(s).` },
        { status: 401 }
      )
    }

    // 5. Code correct : générer le token et marquer comme vérifié
    const token = uuidv4()
    await db
      .update(codeVerification)
      .set({ verifie: 1, token })
      .where(eq(codeVerification.id, codeRecord.id))

    // 6. Récupérer le prénom du bénéficiaire via la chaîne :
    //    tiers.priseEnChargeId → priseEnCharge.referralId → referral.utilisateurId → utilisateur.prenom
    let beneficiairePrenom = 'Bénéficiaire'

    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.id, tiers.priseEnChargeId))

    if (pecs.length > 0) {
      const refs = await db
        .select()
        .from(referral)
        .where(eq(referral.id, pecs[0].referralId))

      if (refs.length > 0) {
        const users = await db
          .select()
          .from(utilisateur)
          .where(eq(utilisateur.id, refs[0].utilisateurId))

        if (users.length > 0 && users[0].prenom) {
          beneficiairePrenom = users[0].prenom
        }
      }
    }

    return NextResponse.json({
      token,
      tiersInfo: {
        prenom: tiers.prenom,
        nom: tiers.nom,
        role: tiers.role,
      },
      beneficiairePrenom,
    })
  } catch (error) {
    console.error('[Tiers Verify]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
