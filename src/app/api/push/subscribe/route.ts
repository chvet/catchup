// POST/DELETE /api/push/subscribe
// Gestion des souscriptions push notification

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { pushSubscription } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { getConseillerFromHeaders } from '@/lib/api-helpers'
import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint, keys, type, utilisateurId } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Souscription push invalide' },
        { status: 400 }
      )
    }

    let userId: string | null = null
    let userType: string = type || 'beneficiaire'

    if (userType === 'conseiller') {
      // Authentification conseiller via JWT cookie
      const ctx = await getConseillerFromHeaders()
      if (!ctx.id) {
        return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
      }
      userId = ctx.id
    } else {
      // Authentification beneficiaire via Bearer token ou body param
      const beneficiaire = await getBeneficiaireFromToken(request)
      if (beneficiaire) {
        userId = beneficiaire.utilisateurId
      } else if (utilisateurId) {
        userId = utilisateurId
      }

      if (!userId) {
        return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
      }
      userType = 'beneficiaire'
    }

    // Supprimer les anciennes souscriptions avec le même endpoint
    await db
      .delete(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))

    // Créer la nouvelle souscription
    const now = new Date().toISOString()
    await db.insert(pushSubscription).values({
      id: uuidv4(),
      type: userType,
      userId,
      endpoint,
      keysP256dh: keys.p256dh,
      keysAuth: keys.auth,
      creeLe: now,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error('[Push Subscribe]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      )
    }

    await db
      .delete(pushSubscription)
      .where(eq(pushSubscription.endpoint, endpoint))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Push Unsubscribe]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
