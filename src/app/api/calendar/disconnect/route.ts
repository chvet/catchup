// POST /api/calendar/disconnect — Disconnect a calendar provider

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { db } from '@/data/db'
import { calendarConnection } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const hdrs = await headers()
    const conseillerId = hdrs.get('x-conseiller-id')

    if (!conseillerId) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const body = await request.json()
    const { provider } = body

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return NextResponse.json({ error: 'Provider invalide (google ou outlook)' }, { status: 400 })
    }

    await db
      .delete(calendarConnection)
      .where(and(
        eq(calendarConnection.userId, conseillerId),
        eq(calendarConnection.provider, provider),
        eq(calendarConnection.type, 'conseiller'),
      ))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Calendar Disconnect]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
