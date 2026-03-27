// GET /api/calendar/status — Returns the user's connected calendars

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { db } from '@/data/db'
import { calendarConnection } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function GET() {
  try {
    const hdrs = await headers()
    const conseillerId = hdrs.get('x-conseiller-id')

    if (!conseillerId) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
    }

    const connections = await db
      .select({
        provider: calendarConnection.provider,
        email: calendarConnection.email,
        creeLe: calendarConnection.creeLe,
      })
      .from(calendarConnection)
      .where(and(
        eq(calendarConnection.userId, conseillerId),
        eq(calendarConnection.type, 'conseiller'),
      ))

    const google = connections.find(c => c.provider === 'google')
    const outlook = connections.find(c => c.provider === 'outlook')

    return NextResponse.json({
      google: google ? { connected: true, email: google.email, since: google.creeLe } : { connected: false },
      outlook: outlook ? { connected: true, email: outlook.email, since: outlook.creeLe } : { connected: false },
    })
  } catch (error) {
    console.error('[Calendar Status]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
