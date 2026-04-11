// GET/POST /api/accompagnement/messages
// Messagerie directe bénéficiaire ↔ conseiller

import { db } from '@/data/db'
import { messageDirect, conseiller, structure, utilisateur } from '@/data/schema'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { notifyConseillerNewMessage } from '@/lib/push-triggers'
import { translateMessage } from '@/lib/translate'
import { safeJsonParse } from '@/core/constants'

export async function GET(request: Request) {
  try {
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer tous les messages de cette prise en charge
    const messages = await db
      .select()
      .from(messageDirect)
      .where(eq(messageDirect.priseEnChargeId, beneficiaire.priseEnChargeId))
      .orderBy(asc(messageDirect.horodatage))

    // Récupérer les infos du conseiller
    const conseillers = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, beneficiaire.conseillerId))

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

    // Marquer uniquement les messages du conseiller comme lus (pas ceux du bénéficiaire)
    await db
      .update(messageDirect)
      .set({ lu: 1 })
      .where(and(
        eq(messageDirect.priseEnChargeId, beneficiaire.priseEnChargeId),
        eq(messageDirect.expediteurType, 'conseiller'),
        eq(messageDirect.lu, 0)
      ))

    return NextResponse.json({
      messages,
      conseiller: conseillerInfo
        ? {
            prenom: conseillerInfo.prenom,
            structureNom,
          }
        : null,
    })
  } catch (error) {
    console.error('[Accompagnement Messages GET]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contenu } = body

    if (!contenu || typeof contenu !== 'string' || contenu.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu du message est requis' },
        { status: 400 }
      )
    }

    if (contenu.length > 5000) {
      return NextResponse.json(
        { error: 'Le message ne peut pas dépasser 5000 caractères' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newMessage = {
      id: uuidv4(),
      priseEnChargeId: beneficiaire.priseEnChargeId,
      expediteurType: 'beneficiaire' as const,
      expediteurId: beneficiaire.utilisateurId,
      contenu: contenu.trim(),
      lu: 0,
      horodatage: now,
    }

    await db.insert(messageDirect).values(newMessage)

    // Traduction automatique vers le français pour le conseiller (bloquant avec timeout 3s)
    let contenuTraduit: string | null = null
    let langueCible: string | null = null
    try {
      // Langue transmise par le client OU lue depuis les préférences utilisateur
      const langFromBody = body.langue || null
      let langBenef = langFromBody
      if (!langBenef) {
        const users2 = await db.select({ preferences: utilisateur.preferences }).from(utilisateur).where(eq(utilisateur.id, beneficiaire.utilisateurId))
        const prefs = safeJsonParse<Record<string, string>>(users2[0]?.preferences, {})
        langBenef = prefs.langue || 'fr'
      }
      // Sauvegarder la langue dans les préférences pour les prochaines fois
      if (langFromBody && langFromBody !== 'fr') {
        db.update(utilisateur)
          .set({ preferences: JSON.stringify({ langue: langFromBody }) })
          .where(eq(utilisateur.id, beneficiaire.utilisateurId))
          .catch(() => {})
      }
      if (langBenef !== 'fr') {
        const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))
        const translated = await Promise.race([translateMessage(contenu.trim(), langBenef, 'fr'), timeout])
        if (translated) {
          contenuTraduit = translated
          langueCible = 'fr'
          await db.update(messageDirect)
            .set({ contenuTraduit, langueCible })
            .where(eq(messageDirect.id, newMessage.id))
        }
      }
    } catch { /* traduction non-bloquante en cas d'erreur */ }

    // Notification push au conseiller
    try {
      const users = await db.select({ prenom: utilisateur.prenom }).from(utilisateur).where(eq(utilisateur.id, beneficiaire.utilisateurId))
      const prenom = users[0]?.prenom || 'Un beneficiaire'
      notifyConseillerNewMessage(beneficiaire.conseillerId, prenom).catch(() => {})
    } catch { /* push non-bloquant */ }

    return NextResponse.json({ message: { ...newMessage, contenuTraduit, langueCible } }, { status: 201 })
  } catch (error) {
    console.error('[Accompagnement Messages POST]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
