// GET/POST /api/tiers/messages
// Messagerie directe tiers ↔ bénéficiaire

import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq, and, asc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { getTiersFromToken } from '@/lib/tiers-helpers'
import { logJournal } from '@/lib/journal'

export async function GET(request: Request) {
  try {
    const tiers = await getTiersFromToken(request)

    // Récupérer les messages de type tiers_beneficiaire pour cette prise en charge
    const messages = await db
      .select()
      .from(messageDirect)
      .where(
        and(
          eq(messageDirect.priseEnChargeId, tiers.priseEnChargeId),
          eq(messageDirect.conversationType, 'tiers_beneficiaire'),
          sql`(
            (${messageDirect.expediteurType} = 'tiers' AND ${messageDirect.expediteurId} = ${tiers.tiersId})
            OR ${messageDirect.expediteurType} = 'beneficiaire'
          )`
        )
      )
      .orderBy(asc(messageDirect.horodatage))

    // Marquer les messages du bénéficiaire comme lus
    await db
      .update(messageDirect)
      .set({ lu: 1 })
      .where(
        and(
          eq(messageDirect.priseEnChargeId, tiers.priseEnChargeId),
          eq(messageDirect.conversationType, 'tiers_beneficiaire'),
          eq(messageDirect.expediteurType, 'beneficiaire')
        )
      )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[Tiers Messages GET]', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const status = message === 'Token manquant' || message === 'Token invalide ou expiré' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: Request) {
  try {
    const tiers = await getTiersFromToken(request)

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
      priseEnChargeId: tiers.priseEnChargeId,
      expediteurType: 'tiers' as const,
      expediteurId: tiers.tiersId,
      conversationType: 'tiers_beneficiaire',
      contenu: contenu.trim(),
      lu: 0,
      horodatage: now,
    }

    await db.insert(messageDirect).values(newMessage)

    // Tracer dans le journal
    await logJournal(
      tiers.priseEnChargeId,
      'message_envoye',
      'tiers',
      tiers.tiersId,
      `${tiers.prenom} ${tiers.nom} (${tiers.role}) a envoyé un message au bénéficiaire`
    )

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('[Tiers Messages POST]', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const status = message === 'Token manquant' || message === 'Token invalide ou expiré' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
