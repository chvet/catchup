// GET /api/calendar/outlook/callback — Microsoft OAuth2 callback
// Exchanges code for tokens, saves calendar connection, redirects back

import { NextResponse } from 'next/server'
import { exchangeOutlookCode } from '@/lib/calendar-oauth'
import { db } from '@/data/db'
import { calendarConnection } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // Default return URL
  let returnUrl = '/conseiller/parametres'

  try {
    if (error) {
      throw new Error(`Outlook OAuth error: ${error} — ${url.searchParams.get('error_description') || ''}`)
    }

    if (!code || !stateParam) {
      throw new Error('Missing code or state parameter')
    }

    // Decode state
    const state = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
    const { type, userId } = state
    returnUrl = state.returnUrl || returnUrl

    if (!type || !userId) {
      throw new Error('Invalid state parameter')
    }

    // Exchange code for tokens
    const tokens = await exchangeOutlookCode(code)
    const now = new Date().toISOString()

    // Upsert: delete existing Outlook connection for this user, then insert
    const existing = await db
      .select({ id: calendarConnection.id })
      .from(calendarConnection)
      .where(and(
        eq(calendarConnection.userId, userId),
        eq(calendarConnection.provider, 'outlook'),
        eq(calendarConnection.type, type),
      ))

    if (existing.length > 0) {
      await db
        .update(calendarConnection)
        .set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken || null,
          expiresAt: tokens.expiresAt,
          email: tokens.email || null,
          misAJourLe: now,
        })
        .where(eq(calendarConnection.id, existing[0].id))
    } else {
      await db.insert(calendarConnection).values({
        id: uuidv4(),
        type,
        userId,
        provider: 'outlook',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        expiresAt: tokens.expiresAt,
        email: tokens.email || null,
        creeLe: now,
        misAJourLe: now,
      })
    }

    // Redirect back with success
    const redirectUrl = new URL(returnUrl, url.origin)
    redirectUrl.searchParams.set('calendar', 'connected')
    redirectUrl.searchParams.set('provider', 'outlook')
    return NextResponse.redirect(redirectUrl.toString())

  } catch (err) {
    console.error('[Calendar Outlook Callback]', err)
    const redirectUrl = new URL(returnUrl, url.origin)
    redirectUrl.searchParams.set('calendar', 'error')
    redirectUrl.searchParams.set('provider', 'outlook')
    return NextResponse.redirect(redirectUrl.toString())
  }
}
