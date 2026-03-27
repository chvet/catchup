// GET /api/calendar/google — Initiate Google Calendar OAuth2 flow
// Redirects to Google consent screen

import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/calendar-oauth'
import { headers } from 'next/headers'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const returnUrl = url.searchParams.get('returnUrl') || '/conseiller/parametres'

  // Get conseiller info from middleware headers
  const hdrs = await headers()
  const conseillerId = hdrs.get('x-conseiller-id')

  if (!conseillerId) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })
  }

  // Encode state with user info and return URL
  const state = Buffer.from(JSON.stringify({
    type: 'conseiller',
    userId: conseillerId,
    returnUrl,
  })).toString('base64url')

  const authUrl = getGoogleAuthUrl(state)
  return NextResponse.redirect(authUrl)
}
