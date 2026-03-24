// POST /api/accompagnement/verify
// Vérifie le code d'accès du bénéficiaire et retourne un token

import { db } from '@/data/db'
import { referral, codeVerification, priseEnCharge, conseiller, structure } from '@/data/schema'
import { eq, and, gt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email et code requis' },
        { status: 400 }
      )
    }

    // 1. Trouver le referral par moyenContact (email)
    const refs = await db
      .select()
      .from(referral)
      .where(eq(referral.moyenContact, email.toLowerCase().trim()))

    if (refs.length === 0) {
      return NextResponse.json(
        { error: 'Aucun dossier trouvé pour cet email' },
        { status: 404 }
      )
    }

    const ref = refs[0]

    // 2. Trouver le code de vérification non expiré, non vérifié
    const now = new Date().toISOString()
    const codes = await db
      .select()
      .from(codeVerification)
      .where(
        and(
          eq(codeVerification.referralId, ref.id),
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

    // 3. Vérifier le nombre de tentatives
    if ((codeRecord.tentatives ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Nombre maximum de tentatives atteint. Demandez un nouveau code.' },
        { status: 429 }
      )
    }

    // 4. Vérifier le code
    if (codeRecord.code !== code.trim()) {
      // Incrémenter les tentatives
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

    // 6. Récupérer les infos de la prise en charge et du conseiller
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, ref.id))

    if (pecs.length === 0) {
      return NextResponse.json(
        { error: 'Aucune prise en charge trouvée' },
        { status: 404 }
      )
    }

    const pec = pecs[0]

    const conseillers = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, pec.conseillerId))

    const conseillerInfo = conseillers.length > 0 ? conseillers[0] : null

    let structureNom: string | null = null
    if (conseillerInfo?.structureId) {
      const structures = await db
        .select()
        .from(structure)
        .where(eq(structure.id, conseillerInfo.structureId))
      if (structures.length > 0) {
        structureNom = structures[0].nom
      }
    }

    return NextResponse.json({
      token,
      referralId: ref.id,
      conseillerInfo: conseillerInfo
        ? {
            prenom: conseillerInfo.prenom,
            nom: conseillerInfo.nom,
            structureNom,
          }
        : null,
    })
  } catch (error) {
    console.error('[Accompagnement Verify]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
