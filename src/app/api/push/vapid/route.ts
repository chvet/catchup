// GET /api/push/vapid
// Retourne la clé publique VAPID (pas d'auth nécessaire)

import { NextResponse } from 'next/server'
import { getVapidPublicKey } from '@/lib/push'

export async function GET() {
  try {
    const publicKey = getVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error('[VAPID]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
